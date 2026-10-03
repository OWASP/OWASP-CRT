import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config';

export const useCertificateData = (certId, setTelemetryData) => {
  const [certUser, setCertUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
            const apiResponse = await fetch(apiUrl);
            if (apiResponse.ok) {
              const apiJson = await apiResponse.json();
              const decodedContent = decodeURIComponent(escape(atob(apiJson.content)));
              data = JSON.parse(decodedContent);
              if (data && String(data.id) === String(certId)) {
                window.history.replaceState(null, '', `?id=${certId}`);
              }
            }
          } catch (e) {}
        }
        
        if (!data) {
          const rawUrl = `https://raw.githubusercontent.com/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/${APP_CONFIG.github.branch}/certs/${certId}.json?t=${Date.now()}`;
          const rawResponse = await fetch(rawUrl);
          if (!rawResponse.ok) throw new Error(rawResponse.status === 404 ? "IDENTITY_NOT_FOUND" : "SERVER_ERROR");
          data = await rawResponse.json();
          if (!data || String(data.id) !== String(certId)) throw new Error("IDENTITY_MISMATCH");
        }
        
        setCertUser(data);
        if(setTelemetryData) setTelemetryData({ tier: data.tier, stats: data.stats || {} });
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [certId, setTelemetryData]);

  return { certUser, error, isLoading };
};