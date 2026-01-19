# Security Policy

## Contact

| Channel | Details |
|---|---|
| Email (preferred) | security@medusajs.com |
| GitHub | If enabled for this repo, use GitHub's **private vulnerability reporting** / Security Advisories |

## TL;DR (how to report)
- **Do not** open a public issue for security vulnerabilities.
- Email **security@medusajs.com** (preferred), or use GitHub private vulnerability reporting if enabled.
- Include a minimal reproduction, affected versions/commit, and impact.
- **Do not include secrets, API keys, session tokens, or real customer data** in any report.

At Medusa, we consider the security of our systems a top priority. However, vulnerabilities can still exist.
If you discover a security issue, we appreciate your help in responsibly disclosing it so we can protect users and downstream projects.

## Supported versions

Security fixes are provided for supported versions only. The supported version policy is maintained in release notes and repo-local docs.
- If you are unsure whether a version is supported, report anyway.
- If you can reproduce on the latest release line, include that in your report.
- Supported release lines are tracked in: docs/SUPPORTED_VERSIONS.md (planned)

## Scope

### In scope
- Vulnerabilities in this repository's code, build, and release artifacts
- Issues that can lead to unauthorized access, data exposure, privilege escalation, or integrity compromise
- Supply-chain issues affecting published packages (when applicable)

### Out of scope
- Social engineering, phishing, or physical attacks
- Denial of service (DoS) testing that impacts real users/infrastructure (reports are welcome if demonstrated safely in a local/dev environment)
- Spam or attacks against third-party applications/services
- Reports lacking a reasonable security impact (e.g., "best practices" without exploitability)

If you are unsure, report anyway — we will help triage.

## Reporting vulnerabilities

Please:
- **Do not** open a public GitHub issue for security vulnerabilities.
- Email your findings to **security@medusajs.com** (or use private GitHub reporting if enabled).
- Do not take advantage of the issue beyond what is necessary to prove impact.
- Do not disclose details publicly until we have coordinated a fix and disclosure timeline.
- Avoid sending screenshots/logs that contain secrets, access tokens, or sensitive personal data. If unsure, redact first.

### What to include in a report

To help us reproduce and fix quickly, include:
- A clear description of the vulnerability and its impact
- Steps to reproduce (or a PoC)
- Affected versions / commits (if known)
- Any relevant logs, stack traces, or screenshots
- Suggested fix or mitigation (optional but appreciated)

## Triage and response targets

What you can expect from us:
- **Acknowledgement:** within **3 business days**
- **Initial triage:** severity assessment and next steps as soon as feasible after acknowledgement
- **Fix coordination:** we will share a remediation plan after triage (including whether a coordinated release is required)

> Complex issues (or issues requiring coordinated releases) may take longer, but we will keep you informed.

## Severity assessment

We prioritize based on impact and exploitability. When useful, we may use CVSS as input, but we will always provide practical guidance:
- Affected versions/surfaces
- Exploit prerequisites
- Mitigations and upgrade path

## Confidentiality and safe harbor

If you follow this policy:
- We will not take legal action against you for the report
- We will handle your report with strict confidentiality
- We will not share your personal details without permission

## CVEs and advisories

When applicable, we will coordinate:
- GitHub Security Advisories and patched releases
- CVE assignment (project- or CNA-dependent) and public disclosure timing
- Reporter attribution (unless you prefer anonymity)

## Coordinated disclosure

We aim to:
- confirm and reproduce the report,
- develop a fix,
- release patched versions,
- and coordinate disclosure with the reporter.

If public disclosure is desired, we'll coordinate timing and attribution (unless you prefer anonymity).

## Security advisories

When applicable, we will use GitHub Security Advisories and/or release notes to inform users of:
- affected versions,
- severity,
- upgrade guidance,
- and mitigations.

## Encryption (optional)

If you prefer encrypted communication, include your public key in the initial email and request encrypted follow-ups.
Maintainers may also publish a PGP key fingerprint here in the future.

---

## Security & operations roadmap

Planned documentation and automation improvements are tracked in: docs/security/ROADMAP.md (planned)

Summary of planned deliverables:

### Documentation
- docs/README.md - Repository documentation index with reading order
- docs/STABILITY.md - Stability tiers, compatibility promises, deprecation policy
- docs/SUPPORTED_VERSIONS.md - Which release lines receive security fixes
- docs/ARCHITECTURE.md - Module boundaries, contracts, transactions, events, workflows
- docs/OPERATIONS.md - Health checks, observability, runbooks, reliability patterns
- docs/PERFORMANCE.md - Hot-path optimization, caching, common pitfalls
- docs/RELEASING.md - Release checklist, SBOMs, provenance/attestations
- docs/DEVELOPMENT.md - Local dev setup and contributor workflows
- docs/TESTING.md - Test taxonomy, contract tests, CI expectations
- docs/THREAT_MODEL.md - Assets, trust boundaries, threats and mitigations
- docs/SECURITY_HARDENING.md - Secure development, supply chain, automated checks
- docs/adr/ - Architecture decision records (template + index)
- docs/_template.md - Standard doc template (audience, status, owner, last reviewed)

### Automation & guardrails
- GitHub issue template guardrails (disable blank issues, security contact link)
- Bug report template with reproduction requirements
- PR template with security + testing + compatibility checklist
- CI hardening (build/test/lint, CodeQL, dependency review, OSSF Scorecard, Dependabot)
- Contract test suite for module boundaries (APIs/events/schemas)
- API/schema diffing on PRs touching public surfaces
- Performance regression benchmarks with CI thresholds

### Community & governance
- CODE_OF_CONDUCT.md, SUPPORT.md, GOVERNANCE.md, MAINTAINERS.md
