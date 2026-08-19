# Security Policy

## Supported Versions

This repository contains the source code for the OWASP-CRT tool and its automated workflows. The `main` branch reflects the latest maintained version of the project.

| Version | Supported |
|--------|-----------|
| main   | ✅ |
| Beta   | ✅ |
| Others | ❌ |

---

## Reporting a Vulnerability

We take the security of this project and the data it processes very seriously. If you believe you have identified a security vulnerability, please follow **responsible disclosure** practices.

Examples of in-scope issues include:
- Vulnerabilities in the application logic or API integrations
- Cross-Site Scripting (XSS) or injection flaws in the generated certificates/frontend
- Security issues affecting our CI/CD workflows (GitHub Actions)
- Misconfigurations leading to unauthorized access or data exposure

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability safely and privately, please:
- Open a **private GitHub Security Advisory** for this repository via the Security tab.

Please include:
- A clear description of the issue
- Steps to reproduce the vulnerability
- Potential impact
- Suggested remediation (if available)

---

## Disclosure Process

- Reports will be reviewed by the project maintainers.
- If applicable, fixes will be discussed, implemented, and deployed.
- Public disclosure may occur after remediation, with proper credit given to the reporter if desired.

---

## Security Best Practices for Contributors

- Do not include secrets, tokens, or credentials in your pull requests.
- Avoid using user-controlled input in workflows or generation scripts without strict validation.
- Follow the OWASP Top 10 guidelines for secure coding practices.

---

## Recognition

Security researchers and contributors who responsibly disclose issues will be acknowledged in release notes or project documentation, unless anonymity is requested.
