# Anshkosh agent entrypoint

Read [the wiki index](./docs/wiki/Home.md) and [agent guidelines](./docs/wiki/agents/Agent-Guidelines.md) before working. Follow any additional `AGENTS.md` instructions supplied by the host. Keep architecture and product facts in their existing source documents; do not duplicate them here.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. Route only to skills in the session's available-skills list; answer directly for quick questions or small scoped edits.

Key routing rules:
- Product ideas and brainstorming → `/office-hours`
- Strategy and scope → `/plan-ceo-review`
- Architecture → `/plan-eng-review`
- Design system and plan review → `/design-consultation` or `/plan-design-review`
- Full review pipeline → `/autoplan`
- Bugs and errors → `/investigate`, unless one read-only check confirms the cause and a narrow fix is clear; then fix it and run the focused test.
- QA and site behavior → `/qa` or `/qa-only`
- Code review and diff checks → `/review`
- Visual polish → `/design-review`
- Shipping, deployment, and PRs → `/ship` or `/land-and-deploy`
- Save progress → `/context-save`
- Resume progress → `/context-restore`
