import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config';
import { decodeBase64Json } from '../utils/base64';

export const useCertificateData = (certId) => {
  const [certUser, setCertUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      if (!certId || !/^\d+$/.test(String(certId))) {
        setIsLoading(false);
        setError("NO_ID_PROVIDED");
        return;
      }

      setIsLoading(true);
      setError(null);
      setCertUser(null);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isFresh = urlParams.get('fresh') === 'true';
        let data = null;

        if (isFresh) {
          try {
            const apiUrl = `https://api.github.com/repos/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/contents/certs/${certId}.json?ref=${APP_CONFIG.github.branch}&t=${Date.now()}`;
            const apiResponse = await fetch(apiUrl, { signal: controller.signal });
            if (apiResponse.ok) {
              const apiJson = await apiResponse.json();
              data = decodeBase64Json(apiJson.content);
              if (data && String(data.id) === String(certId)) {
                window.history.replaceState(null, '', `?id=${certId}`);
              }
            }
          } catch (e) {
            if (e.name === 'AbortError') return;
          }
        }

        if (!data) {
          const rawUrl = `https://raw.githubusercontent.com/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/${APP_CONFIG.github.branch}/certs/${certId}.json?t=${Date.now()}`;
          const rawResponse = await fetch(rawUrl, { signal: controller.signal });
          if (!rawResponse.ok) {
            throw new Error(rawResponse.status === 404 ? "IDENTITY_NOT_FOUND" : "SERVER_ERROR");
          }
          data = await rawResponse.json();
          if (!data || String(data.id) !== String(certId)) {
            throw new Error("IDENTITY_MISMATCH");
          }
        }

        if (!controller.signal.aborted) {
          setCertUser(data);
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          setError(e.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [certId]);

  return { certUser, error, isLoading };
};