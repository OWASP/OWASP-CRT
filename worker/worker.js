export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const escapeHTML = (str) => String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));

    const jsonForScript = (val) => JSON.stringify(val).replace(/</g, '\\u003c');

    const sanitizeFullName = (name) => {
      if (!name) return null;
      const sanitized = name.replace(/[^a-zA-Z\s\-]/g, '').replace(/\s+/g, ' ').substring(0, 20).trim();
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

      // Edge Validation: Check 24-hour rate limit before dispatching action.
      const COOLDOWN_SECONDS = 86400; 
      const nowSeconds = Math.floor(Date.now() / 1000);

      const readDataRecord = async (path) => {
        const res = await fetch(
          `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${path}?ref=data`,
          {
            headers: {
              "Accept": "application/vnd.github.v3+json",
              "Authorization": `Bearer ${env.ADMIN_GITHUB_PAT}`,
              "User-Agent": "OWASP-CRT-App"
            }
          }
        );

        if (!res.ok) return null;

        try {
          const meta = await res.json();
          return JSON.parse(decodeURIComponent(escape(atob(meta.content))));
        } catch {
          return null;
        }
      };

      let cooldownSince = 0;
      let blockedByFailedAttempt = false;

      const certRecord = await readDataRecord(`certs/${verifiedUserId}.json`);
      if (certRecord) {
        cooldownSince = Math.max(cooldownSince, certRecord.last_issued || 0);
      }

      const attemptRecord = await readDataRecord(`attempts/${verifiedUserId}.json`);
      if (attemptRecord) {
        const attemptMessage = String(attemptRecord.message || "");
        const attemptCountsAgainstCooldown =
          attemptRecord.apply_limit === true || attemptMessage.includes("No verified commits");
        const lastAttempt = attemptRecord.last_attempt || 0;

        if (attemptCountsAgainstCooldown && lastAttempt > cooldownSince) {
          cooldownSince = lastAttempt;
          blockedByFailedAttempt = attemptMessage.includes("No verified commits");
        }
      }

      if (cooldownSince > 0 && nowSeconds - cooldownSince < COOLDOWN_SECONDS) {
        const hoursLeft = Math.ceil((COOLDOWN_SECONDS - (nowSeconds - cooldownSince)) / 3600);

        if (blockedByFailedAttempt) {
          throw new Error(`No verified commits were found for your account in the OWASP or GenAI Security Project repositories. You can try again in ${hoursLeft} hours.`);
        }

        throw new Error(`Rate Limit Exceeded: You must wait ${hoursLeft} hours before requesting a new certificate.`);
      }

      // Dispatch GitHub Action via Repository Dispatch (Sending User Token Securely)
      const dispatchResponse = await fetch(`https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/dispatches`, {
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

      if (!dispatchResponse.ok) {
        console.error(`GitHub dispatch failed with HTTP ${dispatchResponse.status}`);
        return new Response("Certificate generation could not be started.", {
          status: 502,
          headers: { "Content-Type": "text/plain; charset=UTF-8" }
        });
      }

      const safeUserJSON = jsonForScript(verifiedUsername);
      const safeUserIdJSON = jsonForScript(verifiedUserId);
      const safeCsrfJSON = jsonForScript(stateCsrf);
      const targetOriginJSON = jsonForScript(ALLOWED_ORIGIN);

      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Authentication Successful</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              body { margin: 0; background-color: #05050A; color: #fff; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
              .bg-blobs { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: radial-gradient(ellipse at center, transparent 40%, #05050A 100%); }
              .blob { position: absolute; top: 50%; left: 50%; width: 45vw; height: 45vw; border-radius: 50%; mix-blend-mode: screen; filter: blur(100px); opacity: 0.15; animation: pulse 4s infinite alternate ease-in-out; }
              .blob-1 { background: #6366f1; transform: translate(-80%, -80%); animation-delay: 0s; }
              .blob-2 { background: #d946ef; transform: translate( -20%, -80%); animation-delay: -1s; }
              .blob-3 { background: #3b82f6; transform: translate(-50%, -20%); animation-delay: -2s; }
              @keyframes pulse { 0% { opacity: 0.1; } 100% { opacity: 0.2; transform: scale(1.05) translate(var(--tx, 0), var(--ty, 0)); } }
              .glass-card { position: relative; z-index: 10; background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px; text-align: center; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); width: 85%; max-width: 420px; animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              .icon-box { width: 64px; height: 64px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px auto; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #34d399; box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
              .icon-box svg { width: 32px; height: 32px; stroke-width: 2.5; }
              h2 { margin: 0 0 12px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
              p { margin: 0; color: #a1a1aa; font-size: 15px; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="bg-blobs">
              <div class="blob blob-1"></div>
              <div class="blob blob-2"></div>
              <div class="blob blob-3"></div>
            </div>
            <div class="glass-card">
              <div class="icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h2>Authentication Successful</h2>
              <p>Verifying secure session and returning you to the dashboard...</p>
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
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Authentication Error</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              body { margin: 0; background-color: #05050A; color: #fff; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
              .bg-blobs { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: radial-gradient(ellipse at center, transparent 40%, #05050A 100%); }
              .blob { position: absolute; top: 50%; left: 50%; width: 45vw; height: 45vw; border-radius: 50%; mix-blend-mode: screen; filter: blur(100px); opacity: 0.15; animation: pulse 4s infinite alternate ease-in-out; }
              .blob-1 { background: #6366f1; transform: translate(-80%, -80%); animation-delay: 0s; }
              .blob-2 { background: #ef4444; transform: translate( -20%, -80%); animation-delay: -1s; } /* Red accent for error */
              .blob-3 { background: #3b82f6; transform: translate(-50%, -20%); animation-delay: -2s; }
              @keyframes pulse { 0% { opacity: 0.1; } 100% { opacity: 0.2; transform: scale(1.05); } }
              .glass-card { position: relative; z-index: 10; background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px; text-align: center; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); width: 85%; max-width: 420px; animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              .icon-box { width: 64px; height: 64px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px auto; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
              .icon-box svg { width: 32px; height: 32px; stroke-width: 2.5; }
              h2 { margin: 0 0 12px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
              p { margin: 0; color: #a1a1aa; font-size: 15px; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="bg-blobs">
              <div class="blob blob-1"></div>
              <div class="blob blob-2"></div>
              <div class="blob blob-3"></div>
            </div>
            <div class="glass-card">
              <div class="icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h2>Access Denied</h2>
              <p>${safeErrorMessage}</p>
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
