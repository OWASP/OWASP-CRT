export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const escapeHTML = (str) => String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));

    const jsonForScript = (val) => JSON.stringify(val).replace(/</g, '\\u003c');

    const sanitizeFullName = (name) => {
      if (!name) return null;
      const sanitized = name.replace(/[^a-zA-Z\s\-]/g, '').substring(0, 50).trim();
      return sanitized || null;
    };

    const ALLOWED_ORIGIN = "https://crt.owasp.org";
    const CALLBACK_URL = `${url.origin}/`;
    const COOKIE_NAME = "__Host-owasp_oauth_csrf";

    const getCookie = (req, name) => {
      const cookieHeader = req.headers.get("Cookie") || "";
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : null;
    };

    const clearCsrfCookieHeader = `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

    if (url.pathname === "/start") {
      const rawName = url.searchParams.get("name") || "";
      const safeName = sanitizeFullName(rawName);

      if (rawName && !safeName) {
        return new Response("Invalid name parameter", { status: 400 });
      }

      const csrfToken = crypto.randomUUID();
      const statePayload = { csrf: csrfToken, name: safeName };
      const encodedState = btoa(unescape(encodeURIComponent(JSON.stringify(statePayload))));

      const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
      authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authorizeUrl.searchParams.set("scope", "read:user");
      authorizeUrl.searchParams.set("state", encodedState);
      authorizeUrl.searchParams.set("redirect_uri", CALLBACK_URL);

      return new Response(null, {
        status: 302,
        headers: {
          "Location": authorizeUrl.toString(),
          "Set-Cookie": `${COOKIE_NAME}=${csrfToken}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`
        }
      });
    }

    const code = url.searchParams.get("code");
    const rawState = url.searchParams.get("state");

    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    let stateName = null;
    let stateCsrf = null;
    try {
      if (!rawState) throw new Error("missing state");
      const decodedJson = JSON.parse(decodeURIComponent(escape(atob(rawState))));
      stateCsrf = decodedJson.csrf || null;
      stateName = sanitizeFullName(decodedJson.name);
    } catch (e) {
      return new Response("Invalid or malformed state parameter (CSRF Alert)", { status: 403 });
    }

    const cookieCsrf = getCookie(request, COOKIE_NAME);

    if (!stateCsrf || !cookieCsrf || stateCsrf !== cookieCsrf) {
      return new Response("Invalid or expired session (CSRF Alert)", {
        status: 403,
        headers: { "Set-Cookie": clearCsrfCookieHeader }
      });
    }

    try {
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: CALLBACK_URL
        })
      });
      const tokenData = await tokenResponse.json();
      const userAccessToken = tokenData.access_token;

      if (!userAccessToken) {
        throw new Error("Auth token could not be verified by GitHub.");
      }

      const userResponse = await fetch("https://api.github.com/user", {
        headers: { "Authorization": `Bearer ${userAccessToken}`, "User-Agent": "OWASP-CRT-App" }
      });
      const userData = await userResponse.json();
      const verifiedUsername = userData.login;
      const verifiedUserId = userData.id.toString();
      const safeFullName = stateName || verifiedUsername;

      // Edge Validation: Check 24-hour rate limit before dispatching action
      const COOLDOWN_SECONDS = 86400; 
      const nowSeconds = Math.floor(Date.now() / 1000);
      const checkCertUrl = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/certs/${verifiedUserId}.json?ref=data`;
      
      const certCheckRes = await fetch(checkCertUrl, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "Authorization": `Bearer ${env.ADMIN_GITHUB_PAT}`,
          "User-Agent": "OWASP-CRT-App"
        }
      });

      if (certCheckRes.ok) {
        const certData = await certCheckRes.json();
        const decodedContent = JSON.parse(decodeURIComponent(escape(atob(certData.content))));
        const lastIssued = decodedContent.last_issued || 0;
        if (nowSeconds - lastIssued < COOLDOWN_SECONDS) {
           const hoursLeft = Math.ceil((COOLDOWN_SECONDS - (nowSeconds - lastIssued)) / 3600);
           throw new Error(`Rate Limit Exceeded: You must wait ${hoursLeft} hours before requesting a new certificate.`);
        }
      }

      // Dispatch GitHub Action via Repository Dispatch (Sending User Token Securely)
      await fetch(`https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/dispatches`, {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "Authorization": `Bearer ${env.ADMIN_GITHUB_PAT}`,
          "Content-Type": "application/json",
          "User-Agent": "OWASP-CRT-App"
        },
        body: JSON.stringify({
          event_type: "generate_cert_event",
          client_payload: {
            full_name: safeFullName,
            github_user: verifiedUsername,
            github_id: verifiedUserId,
            user_token: userAccessToken
          }
        })
      });

      const safeUserJSON = jsonForScript(verifiedUsername);
      const safeUserIdJSON = jsonForScript(verifiedUserId);
      const safeCsrfJSON = jsonForScript(stateCsrf);
      const targetOriginJSON = jsonForScript(ALLOWED_ORIGIN);

      const html = `
        <!DOCTYPE html>
        <html>
          <body style="background:#050608; color:#fff; font-family:monospace; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
            <div style="text-align:center;">
              <p style="color:#10b981;">[✔] Authentication successful! Verifying secure session...</p>
            </div>
            <script>
              const targetOrigin = ${targetOriginJSON};
              const payload = {
                status: 'success',
                user: ${safeUserJSON},
                userid: ${safeUserIdJSON},
                csrf: ${safeCsrfJSON}
              };

              if (window.opener) {
                window.opener.postMessage(payload, targetOrigin);
                setTimeout(() => { window.close(); }, 300);
              } else {
                window.location.href = targetOrigin + '/?status=success&user=' + encodeURIComponent(${safeUserJSON}) + '&userid=' + encodeURIComponent(${safeUserIdJSON}) + '&csrf=' + encodeURIComponent(${safeCsrfJSON});
              }
            </script>
          </body>
        </html>
      `;
      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": clearCsrfCookieHeader
        }
      });

    } catch (error) {
      const safeErrorMessage = escapeHTML(error.message || "Unknown error");
      const targetOriginJSON = jsonForScript(ALLOWED_ORIGIN);

      const html = `
        <!DOCTYPE html>
        <html>
          <body style="background:#050608; color:#ef4444; font-family:monospace; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
            <div style="text-align:center;">
              <p>[!] Authentication Error: ${safeErrorMessage}</p>
            </div>
            <script>
              const targetOrigin = ${targetOriginJSON};
              const errMsg = ${jsonForScript(safeErrorMessage)};
              
              if (window.opener) {
                window.opener.postMessage({ status: 'error', message: errMsg }, targetOrigin);
                setTimeout(() => { window.close(); }, 1500);
              } else {
                window.location.href = targetOrigin + '/?status=error&message=' + encodeURIComponent(errMsg);
              }
            </script>
          </body>
        </html>
      `;
      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": clearCsrfCookieHeader
        }
      });
    }
  }
};
