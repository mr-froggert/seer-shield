# AGENTS

## Engineering Rules

1. Always look for dead code, stale view-model fields, obsolete styles, unused helpers, and outdated tests while making changes. Remove them in the same pass when it is safe to do so.
2. Do not keep patching on top of a weak structure. If the existing foundation is clearly wrong, over-complicated, or fighting the change, stop layering fixes onto it and replace it with a cleaner structure.
3. While reading and implementing, actively scan for red flags and code smell: duplicated logic, misleading naming, brittle data flow, unnecessary indirection, stale abstractions, and UI sections that no longer justify their complexity. Address them when they are in scope, and call them out when they are not.

## Product Shape Guardrails

4. Keep the MVP explicitly single-route. Do not introduce recursive strategy graphs, chained opportunity dependencies, or multi-hop portfolio composition unless the task clearly requires it.
5. Do not hard-code assumptions that a route can never become a composed strategy later. Prefer neutral naming and structures that can evolve into layered yield components and layered risk scopes without a breaking rewrite.
6. Keep yield presentation honest and decomposable. A top-level APY is fine for MVP, but the implementation should preserve the ability to explain what drives that yield through structured components rather than opaque rollups.
7. Keep risk attached by scope, not by implicit graph traversal. Favor asset-level, protocol-level, and opportunity-level risk attachments that can later be composed deliberately instead of relying on brittle recursive assumptions.
