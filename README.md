<p align="center">
  <a href="https://www.medusajs.com">
    <picture>
      <source
        media="(prefers-color-scheme: dark)"
        srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg"
      >
      <source
        media="(prefers-color-scheme: light)"
        srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg"
      >
      <img
        alt="Medusa logo"
        src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg"
      >
    </picture>
  </a>
</p>

<h1 align="center">Medusa</h1>

<p align="center">Building blocks for digital commerce</p>

<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/develop/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Licensed under MIT" />
  </a>
  <a href="https://github.com/medusajs/medusa/blob/develop/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome" />
  </a>
  <a href="https://discord.gg/medusajs">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord" />
  </a>
</p>

## Quick links
- Docs: https://docs.medusajs.com
- Learn (Getting Started): https://docs.medusajs.com/learn
- Website: https://www.medusajs.com
- Integrations: https://medusajs.com/integrations/
- Releases: https://github.com/medusajs/medusa/releases
- Discussions: https://github.com/medusajs/medusa/discussions
- Repo-local docs (architecture, operations, contributor workflows): docs/README.md (planned)

## What is Medusa?

Medusa is a commerce platform with a built-in framework for customization, designed to help you build custom commerce applications without reinventing core commerce logic.

Use Medusa's framework and modules to support:
- Advanced B2B or DTC stores
- Marketplaces
- Distributor platforms
- PoS systems
- Service businesses
- Other solutions that need foundational commerce primitives

All commerce modules are open-source and available on npm.

## Repository scope

This repository contains Medusa's core framework and commerce modules.

### If you're building a Medusa application
- Start with the official Learn documentation.
- Treat this repository as a dependency (or upstream), not as a project template.

### If you're contributing to core
- Start here: docs/README.md (planned)
- Development environment setup: docs/DEVELOPMENT.md (planned)
- Testing strategy: docs/TESTING.md (planned)

## Architecture at a glance

This repository follows a modular architecture designed to keep core commerce primitives reusable while enabling customization through well-defined extension points.

> The canonical, always-up-to-date deep-dive for building Medusa applications is in the official docs:
> - Architecture: https://docs.medusajs.com/learn/advanced-development/architecture/overview
> - Commerce modules: https://docs.medusajs.com/resources/commerce-modules
>
> This repository also maintains repo-local documentation focused on contributor/maintainer concerns (planned):
> - docs/README.md - Documentation index
> - docs/ARCHITECTURE.md - Module boundaries, contracts, transactions
> - docs/STABILITY.md - Stability tiers, compatibility promises
> - docs/OPERATIONS.md - Health checks, observability, runbooks
> - docs/RELEASING.md - Release process, SBOMs, provenance
> - docs/adr/README.md - Architecture decision records

## Getting started

Visit the Learn docs to set up a Medusa application:
- https://docs.medusajs.com/learn

## Contributing

Please see the contribution guide:
- https://github.com/medusajs/medusa/blob/develop/CONTRIBUTING.md

For community and support:
- GitHub Discussions: https://github.com/medusajs/medusa/discussions
- Discord: https://discord.gg/medusajs

Planned project documentation (see docs/security/ROADMAP.md when available):
- Code of Conduct
- Support guide
- Governance and maintainers

### Large changes (APIs, data, contracts)
For changes that alter public APIs, module contracts, data migrations, or runtime behavior:
- Add or update an ADR: docs/adr/README.md (planned)
- Confirm stability/compatibility expectations: docs/STABILITY.md (planned)
- Consider operational impact (observability, runbooks): docs/OPERATIONS.md (planned)

## Stability & support
- Stability tiers and deprecation policy: docs/STABILITY.md (planned)
- Supported release lines (security fixes): docs/SUPPORTED_VERSIONS.md (planned)

## Security

If you discover a security vulnerability, **do not open a public issue**.

See [`SECURITY.md`](SECURITY.md) for reporting instructions and our disclosure process.

## Other channels
- Issues: https://github.com/medusajs/medusa/issues
- Twitter: https://twitter.com/medusajs
- LinkedIn: https://www.linkedin.com/company/medusajs
- Blog: https://medusajs.com/blog/

## License

Licensed under the MIT License:
- https://github.com/medusajs/medusa/blob/develop/LICENSE
