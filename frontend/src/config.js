export const APP_CONFIG = {
  github: {
    owner: "OWASP",
    repo: "OWASP-CRT",
    branch: "data", // Branch where JSON certificates are stored
    workflowId: "certificate.yml"
  },
  worker: {
    baseUrl: "https://proxy.owasp-crt.workers.dev/"
  },
  domain: "https://crt.owasp.org",
  assetsPath: "/assets", // Assets load from root due to custom domain
};