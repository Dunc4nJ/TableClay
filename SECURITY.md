# Security Policy

## Contact

| Channel | Details |
|---|---|
| Email (preferred) | security@medusajs.com |
| GitHub | If enabled for this repo, use GitHub's **private vulnerability reporting** / Security Advisories |

At Medusa, we consider the security of our systems a top priority. However, vulnerabilities can still exist.
If you discover a security issue, we appreciate your help in responsibly disclosing it so we can protect users and downstream projects.

## Supported versions

Security fixes are provided for supported versions only. The supported version policy is maintained in release notes and repo-local docs.
- If you are unsure whether a version is supported, report anyway.
- If you can reproduce on the latest release line, include that in your report.

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

The following documentation and automation improvements are planned to strengthen security posture and operational maturity.

### Stability & Compatibility Policy
Create `docs/STABILITY.md` defining:
- Stability tiers (Stable, Beta, Alpha, Experimental, Deprecated)
- Compatibility promises for each tier
- What surfaces are covered (APIs, config, data migrations)
- Deprecation process and guidance

### Architecture Documentation
Create `docs/ARCHITECTURE.md` covering:
- Module boundaries and contracts
- Transaction boundaries and isolation
- Reliable events and side effects (outbox pattern)
- Idempotency requirements
- Workflow orchestration patterns
- Extension points and backward compatibility
- Observability requirements
- Architecture review checklist

### Operations Guide
Create `docs/OPERATIONS.md` covering:
- Health checks (liveness/readiness)
- Observability (structured logs, metrics, tracing)
- Reliability patterns (idempotency, retry/backoff, circuit breakers)
- Database operations and migration practices
- Performance guidance and runbooks

### Performance Guide
Create `docs/PERFORMANCE.md` covering:
- Hot-path optimization principles
- Common pitfalls (N+1, unbounded lists, missing indexes)
- Caching guidelines and invalidation
- Performance review checklist

### Threat Model
Create `docs/THREAT_MODEL.md` covering:
- Key assets (PII, payment state, inventory, credentials)
- Trust boundaries (public HTTP, admin APIs, workers, integrations)
- Common threats and mitigations

### Security Hardening Guide
Create `docs/SECURITY_HARDENING.md` covering:
- Secure development practices
- Supply chain security (pinned actions, SBOMs, provenance)
- Automated security checks (CodeQL, dependency review, Scorecard)

### Release Integrity
Create `docs/RELEASING.md` covering:
- Release checklist and artifact expectations
- SBOM generation
- Provenance and attestations

### Security Automation
- GitHub issue template guardrails (disable blank issues, security contact link)
- Bug report template with reproduction requirements
- PR template with security checklist
- CI workflow for build/test/lint
- CodeQL analysis for security scanning
- Dependency review on PRs
- OSSF Scorecard workflow
- Dependabot for dependency updates

### Community Documentation
- CODE_OF_CONDUCT.md for community standards
- SUPPORT.md for directing questions to appropriate channels
- GOVERNANCE.md for decision-making process
- MAINTAINERS.md for maintainer list and responsibilities

### Architecture Decision Records
Create `docs/adr/` directory with:
- ADR template (0000-template.md)
- Index of architectural decisions
