# Decomposition: breezy-wobbling-clarke

**Source:** /home/ubuntu/.claude/plans/breezy-wobbling-clarke.md
**Created:** 2026-01-19T08:32:01Z
**Total beads created:** 13
**Epics:** 3
**Tasks:** 10

## Decisions Made

### Duplicates/Dependencies Found
- Existing open beads `TableClay-9frp` and `TableClay-3hsb` are unrelated to the OmniSend migration; no dependencies added.
- Beads DB is legacy (no repo fingerprint). Proceeded without migration; warnings recorded during bd operations.

### Priority Assignments
- Backend core migration tasks (module/config/subscribers) set to Priority 1 (high) because they are foundational.
- Frontend tracking + ops tasks set to Priority 2 (medium) as follow-on work.

## Epics Created

### TableClay-5lf6: Phase 1-3: OmniSend Backend Migration
Depends on: TableClay-kurx, TableClay-8uvu, TableClay-yaq8, TableClay-4nry, TableClay-pesh, TableClay-fzj5, TableClay-uuh0
Status: BLOCKED (waiting for children)

### TableClay-idum: Phase 4-5: OmniSend Frontend Tracking
Depends on: TableClay-xdv0, TableClay-i84j, TableClay-gf4e
Status: BLOCKED (waiting for children)

### TableClay-cow1: Phase 6-8: Env, Dashboard, Verification
Depends on: TableClay-alsv, TableClay-k8q9, TableClay-2cr4
Status: BLOCKED (waiting for children)

## All Beads

| ID | Title | Type | Priority | Blocked By | Status |
|----|-------|------|----------|------------|--------|
| TableClay-kurx | Create OmniSend Medusa module | task | 1 | - | READY |
| TableClay-8uvu | Register OmniSend module in medusa-config | task | 1 | TableClay-kurx | blocked |
| TableClay-yaq8 | Send OmniSend placed order event from order-placed subscriber | task | 1 | TableClay-kurx, TableClay-8uvu | blocked |
| TableClay-4nry | Send OmniSend order fulfilled event from order-shipped subscriber | task | 1 | TableClay-kurx, TableClay-8uvu | blocked |
| TableClay-pesh | Create OmniSend contact on newsletter signup | task | 1 | TableClay-kurx, TableClay-8uvu | blocked |
| TableClay-fzj5 | Update test-email admin endpoint for OmniSend | task | 2 | TableClay-kurx, TableClay-8uvu | blocked |
| TableClay-uuh0 | Update test-shipping-flow endpoint for OmniSend | task | 2 | TableClay-kurx, TableClay-8uvu | blocked |
| TableClay-xdv0 | Add OmniSend SDK loader and helpers in storefront | task | 2 | - | READY |
| TableClay-i84j | Track OmniSend product/cart/checkout events | task | 2 | TableClay-xdv0 | blocked |
| TableClay-gf4e | Identify OmniSend contact on checkout email entry | task | 2 | TableClay-xdv0 | blocked |
| TableClay-alsv | Document OmniSend environment variables and deployment setup | task | 2 | - | READY |
| TableClay-k8q9 | Configure OmniSend dashboard automations | task | 2 | TableClay-5lf6, TableClay-idum | blocked |
| TableClay-2cr4 | Verify OmniSend end-to-end integration | task | 2 | TableClay-5lf6, TableClay-idum, TableClay-alsv, TableClay-k8q9 | blocked |

## Dependency Graph

TableClay-5lf6 (epic: Backend Migration)
├── TableClay-kurx Create OmniSend Medusa module (READY)
├── TableClay-8uvu Register OmniSend module in medusa-config → TableClay-kurx
├── TableClay-yaq8 Order placed subscriber → TableClay-kurx, TableClay-8uvu
├── TableClay-4nry Order shipped subscriber → TableClay-kurx, TableClay-8uvu
├── TableClay-pesh Newsletter subscriber → TableClay-kurx, TableClay-8uvu
├── TableClay-fzj5 Test email endpoint → TableClay-kurx, TableClay-8uvu
└── TableClay-uuh0 Test shipping flow endpoint → TableClay-kurx, TableClay-8uvu

TableClay-idum (epic: Frontend Tracking)
├── TableClay-xdv0 SDK loader + helpers (READY)
├── TableClay-i84j Track product/cart/checkout events → TableClay-xdv0
└── TableClay-gf4e Identify contact on email entry → TableClay-xdv0

TableClay-cow1 (epic: Env/Dashboard/Verification)
├── TableClay-alsv Env vars + deployment notes (READY)
├── TableClay-k8q9 OmniSend dashboard automations → TableClay-5lf6, TableClay-idum
└── TableClay-2cr4 Verification → TableClay-5lf6, TableClay-idum, TableClay-alsv, TableClay-k8q9
