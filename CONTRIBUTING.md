# Contributing to the OWASP Community Recognition Tool

First off, thank you for considering contributing to the OWASP Community Recognition Tool! It's people like you that make the OWASP community such a powerful and collaborative environment.

The tool is now live and in **beta** at [crt.owasp.org](https://crt.owasp.org) — the core certificate generation and verification pipeline is built and running end-to-end. Your input now — testing, bug reports, feedback on tier fairness, and documentation — is exactly what's needed to help the tool prove itself before a wider rollout.

## Code of Conduct

By participating in this project, you agree to abide by the [OWASP Code of Conduct](https://owasp.org/www-policy/operational/code-of-conduct). We are committed to providing a welcoming, respectful, and inclusive environment for everyone.

## How Can I Contribute?

We welcome contributions across several key areas:

### 1. Testing

Since the tool is live, the most valuable thing you can do right now is put it through its paces.

* Request a certificate through [crt.owasp.org](https://crt.owasp.org) and confirm the result matches your actual GitHub contribution history.
* Try edge cases: contributions across multiple repositories, co-authored commits, very low or very high activity.
* Report anything that looks wrong — an incorrect tier, a stuck request, a confusing error message — by opening an **Issue**.

### 2. Feedback & Ideas

* Open an **Issue** to flag unfair or unexpected tier scoring, propose refinements to the scoring weights, or suggest improvements to the request workflow.
* Participate in discussions on existing open issues to help refine the approach.

### 3. Development

Help us fix what testing turns up and harden the automation that's already running.

* Check the **Issues** tab for open tasks. Look for labels like `good first issue` or `help wanted` to get started.
* If you plan to work on a major architectural change or a new feature, please open an issue first to discuss your proposed approach with the project maintainers before writing code.

### 4. Documentation

Clear, precise documentation is just as important as code. You can help by:

* Improving the `README.md`, this `CONTRIBUTING.md`, or the module-level docs in `algorithm/` and `frontend/`.
* Creating technical documentation for the GitHub integration workflows.
* Drafting user guides for contributors requesting credentials.

## Contribution Workflow

To contribute code or documentation, please follow the standard GitHub flow:

1. **Check for Existing Issues:** Ensure your idea or bug hasn't already been reported.
2. **Fork the Repository:** Create your own fork of the project.
3. **Create a Branch:** Create a new, distinctly named branch for your feature or bug fix (e.g., `feature/action-workflow` or `docs/improve-readme`).
4. **Make Your Changes:** Implement your feature or fix. Keep your commits logical and focused.
5. **Write Clear Commit Messages:** Briefly explain *what* you changed and *why* it was necessary.
6. **Submit a Pull Request (PR):**
   * Open a PR against the `main` branch of the original repository.
   * Provide a clear and detailed description of your changes.
   * Explicitly link and reference any related issues (e.g., "Resolves #12").

## Security Focus

As an OWASP project, security is a priority — and now that the tool is live and issuing real credentials, it matters more than ever. When proposing technical implementations or writing code, please keep security best practices in mind, particularly regarding API integrations, GitHub Action permissions, and the integrity of already-issued verifiable credentials.

---

Thank you for helping us test, harden, and grow a system that empowers and recognizes the hard-working volunteers of the OWASP community!
