# Security Policy

## Contact

| Channel | Details |
|---|---|
| Email (preferred) | security@medusajs.com |
| GitHub | If enabled for this repo, use GitHub's **private vulnerability reporting** / Security Advisories |

At Medusa, we consider the security of our systems a top priority. However, vulnerabilities can still exist.
If you discover a security issue, we appreciate your help in responsibly disclosing it so we can protect users and downstream projects.

## Scope

### In scope
- Vulnerabilities in this repository's code, build, and release artifacts
- Issues that can lead to unauthorized access, data exposure, privilege escalation, or integrity compromise
- Supply-chain issues affecting published packages (when applicable)

### Out of scope
- Social engineering, phishing, or physical attacks
- Denial of service (DoS) testing that impacts real users/infrastructure
- Spam or attacks against third-party applications/services
- Reports lacking a reasonable security impact (e.g., "best practices" without exploitability)

If you are unsure, report anyway — we will help triage.

## Reporting vulnerabilities

Please:
- **Do not** open a public GitHub issue for security vulnerabilities.
- Email your findings to **security@medusajs.com** (or use private GitHub reporting if enabled).
- Do not take advantage of the issue beyond what is necessary to prove impact.
- Do not disclose details publicly until we have coordinated a fix and disclosure timeline.

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
- **Fix coordination:** we will share an estimated remediation timeline after triage

> Complex issues (or issues requiring coordinated releases) may take longer, but we will keep you informed.

## Confidentiality and safe harbor

If you follow this policy:
- We will not take legal action against you for the report
- We will handle your report with strict confidentiality
- We will not share your personal details without permission

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

## Planned Improvements

The following documentation and automation improvements are planned to strengthen security posture and operational maturity:

### Architecture Documentation
Create `docs/ARCHITECTURE.md` covering:
- Modular architecture principles (clear boundaries, extension points)
- Domain invariants and transactional boundaries
- Workflow orchestration patterns
- Idempotency and reliable event emission (outbox pattern)
- Performance/scalability considerations (hot paths, caching, background work)
- Observability requirements

### Operations Guide
Create `docs/OPERATIONS.md` covering:
- Health checks (liveness/readiness)
- Observability (structured logs, metrics, tracing)
- Reliability patterns (idempotency, retry/backoff, async work)
- Database migration practices
- Performance guidance (avoiding N+1, caching, load testing)

### Roadmap & Stability Tiers
Create `docs/ROADMAP.md` with:
- Stability tier definitions (Stable/Beta/Alpha)
- Reliability & correctness priorities (idempotency, outbox, retry taxonomy)
- Observability priorities (tracing, golden metrics)
- Performance priorities (profiling, caching)
- Security priorities (threat model, supply-chain hardening)

### Security Automation
- GitHub issue template guardrails to prevent public security disclosures
- CI workflow for build/test/lint
- CodeQL analysis for security scanning
- Dependabot for dependency updates

### Community Documentation
- CODE_OF_CONDUCT.md for community standards
- SUPPORT.md for directing questions to appropriate channels
