## `PULL_REQUEST_TEMPLATE.md`

```markdown
# TR-###: <concise title>

## What & Why

- Jira: TR-###
- Summary of UI/logic changes:
  - …
  - …

## How to Test

- Routes / steps / screenshots or video if applicable

## Checklist

- [ ] PR title starts with **TR-###** (e.g., `TR-8: Add PR template`)
- [ ] Branch named **TR-###-<dev>-<short-desc>** (e.g., `TR-8-kin-pr-template`)
- [ ] Commits include the Jira key (`TR-###`)
- [ ] Lint/build pass (`npm run lint`, `npm run build`)
- [ ] Tests updated (RTL/Jest) if applicable
```
