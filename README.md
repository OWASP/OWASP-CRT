# OWASP Community Recognition Tool
[![Project Status: Beta](https://img.shields.io/badge/status-beta-yellow.svg)](https://owasp.org/www-project-lifecycle/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Site](https://img.shields.io/badge/demo-crt.owasp.org-orange.svg)](https://crt.owasp.org)

An automated tool that verifies GitHub contributions and issues verifiable, tier-based credentials to valued OWASP community members.

---

### Project Status

**The tool is built and live — it's now in beta, being tested and validated in the real world.**

Both halves of the pipeline are complete and deployed:

- **Backend:** a GitHub Actions workflow that verifies contributions and issues certificates automatically, running live on this repository.
- **Frontend:** a web app where contributors register to request their credential, then view, download, and share the issued certificate, deployed at **[crt.owasp.org](https://crt.owasp.org)**.

Development continues, but the focus has shifted from building core features to proving the tool holds up under real usage: catching edge cases, confirming tier scoring is fair across different contribution patterns, and hardening the workflow against abuse. If you request a certificate and hit something odd, please open an issue — beta feedback is exactly what we need right now.

### About The Project

The OWASP Foundation thrives on the dedication of its global community of volunteers. From code contributions and documentation to chapter leadership and event organization, these efforts are the backbone of our mission.

The **OWASP Community Recognition Tool** aims to create a streamlined, transparent, and automated system to formally acknowledge these valuable contributions. By providing verifiable credentials, we want to empower our members to showcase their commitment and expertise.

### Key Objectives

- **Automate:** To eliminate manual processes for issuing contribution certificates.
- **Verify:** To provide a clear, verifiable link between a credential and the contributions it represents.
- **Standardize:** To create a consistent and fair process for recognizing community efforts.
- **Empower:** To give contributors a tangible and shareable acknowledgment of their work.

### How It Works
 
The tool runs on GitHub's own infrastructure behind a web interface — no external backend servers required:
 
1. **Request:** A contributor visits **[crt.owasp.org](https://crt.owasp.org)**, enters their full name, and is redirected to a pre-filled GitHub Issue titled `Cert Request` in this repository.
2. **Verify:** A GitHub Action triggers automatically, using the GitHub GraphQL API to scan the requester's direct commits and merged/co-authored pull requests across public OWASP repositories.
3. **Score & Assign Tier:** Contributions are weighted (lines added, lines removed, commit count), normalized, and checked against dynamically derived thresholds to assign a **Gold**, **Silver**, or **Bronze** tier. A 24-hour cooldown and input validation protect the workflow against spam and abuse.
4. **Issue:** The result is committed to a dedicated `data` branch, and a comment with the contributor's tier, stats, and a certificate link (`crt.owasp.org/?id=...`) is posted back on the issue, which is then closed automatically.

For the full scoring methodology and how to run the pipeline locally, see the **[Algorithm & Contribution Analytics documentation](algorithm/README.md)**.

### Certificate Tiers

To recognize different levels of commitment, we issue three distinct tiers of certificates:

| Tier 1 (Bronze) | Tier 2 (Silver) | Tier 3 (Gold) |
| :---: | :---: | :---: |
| <img src="assets/certificates/tier-1.jpg" alt="Tier 1" width="260"> | <img src="assets/certificates/tier-2.jpg" alt="Tier 2" width="260"> | <img src="assets/certificates/tier-3.jpg" alt="Tier 3" width="260"> |

> **For Developers:** See the **[Certificate Design Specifications](assets/DESIGNSPEC.md)** for detailed dimensions, fonts, and color assets used in these templates.

### Repository Structure

```text
OWASP-CRT/
├── .github/workflows/     # The certificate-issuing GitHub Action
├── algorithm/             # Python scoring engine & contribution analytics (see its README)
├── frontend/              # React/Vite web app for viewing certificates (see its README)
├── assets/                # Certificate templates, logos, and design assets
├── CONTRIBUTING.md
└── LICENSE
```

- **[algorithm/README.md](algorithm/README.md)** — data pipeline, scoring methodology, and local setup instructions.
- **[frontend/README.md](frontend/README.md)** — frontend architecture, stack, and local development instructions.

### How to Contribute

The tool is live, so the most valuable thing you can do right now is **use it and try to break it**. We're looking for help in these areas:
* **Testing:** Request a certificate, try edge cases (multiple repos, co-authored commits, low/high activity), and report anything that looks wrong via an Issue.
* **Development:** Help us fix bugs found during testing, harden the GitHub Actions workflow against abuse, and improve the scoring engine.
* **Feedback & Ideas:** Tell us whether tier assignments feel fair, and suggest improvements to the workflow.
* **Documentation:** Improve this README, the module-level docs, and user guides.

For detailed instructions on how to get started, the standard workflow, and how to submit a Pull Request, please read our **[CONTRIBUTING.md](CONTRIBUTING.md)** guidelines.

### Project Leaders

- [Meysam Bal-afkan](http://github.com/galaxy-sc)
- [Fatemeh Zahedi](https://github.com/dylanzahedi)

### Design Lead

- [Hamidreza Abedi nasab](https://github.com/Ham1dRz)
