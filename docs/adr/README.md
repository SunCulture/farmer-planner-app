# Architecture Decision Records

An ADR is an Architecture Decision Record: a short document that captures one important technical decision, why it was made, what alternatives were considered, and what consequences follow from it.

Use ADRs in this project for decisions that are expensive to reverse, affect multiple features, or need a stable shared reference for future contributors.

Recommended structure:

- Status
- Context
- Decision
- Consequences
- Alternatives Considered

Current ADRs:

- [ADR-001: Adopt TanStack Query for Server State](./001-adopt-tanstack-query.md)
- [ADR-002: Use SQLite and Drizzle for Durable Local Data](./002-use-sqlite-and-drizzle.md)
- [ADR-003: Define a Local-First Sync Engine Contract](./003-sync-engine-contract.md)
- [ADR-004: Use Composition-Root Dependency Injection and Thin App Bootstrap](./004-dependency-injection-and-bootstrap.md)
