# Platform Audit Report

- Started: 2026-05-10T19:13:28.288Z
- Base URL: http://127.0.0.1:3000
- Browser audit available: yes
- Passed checks: 2
- Failed checks: 2
- Warnings: 3

## API checks
- PASS | Create disposable student | audit.student.1778440408456@danesh.app
- PASS | Cleanup disposable user | cmp05i27f00f27lyeh32i58gm

## Route checks
- none

## Workflow checks
- FAIL | Public registration flow | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: /Iranian National Curriculum|Iranian/i })[22m

- FAIL | Parent registration flow | page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://127.0.0.1:3000/en/register", waiting until "networkidle"[22m


## Created audit artifacts
### Users
- audit.student.1778440408456@danesh.app (cmp05i27f00f27lyeh32i58gm) via api-seed

### Courses
- none

## Warnings
- public registration workflow browser issues: Console errors: 10, page errors: 0 | Sample: Failed to load resource: the server responded with a status of 404 (Not Found) | Refused to execute script from 'http://127.0.0.1:3000/_next/static/chunks/main-app.js?v=1778440409726' because its MIME type ('text/html') is not executable, and strict MIME type checking is enabled.
- parent registration workflow browser issues: Console errors: 26, page errors: 0 | Sample: Failed to load resource: the server responded with a status of 500 (Internal Server Error) | Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- Browser audit unavailable: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://127.0.0.1:3000/en/login", waiting until "networkidle"[22m


## Failures
- none

## Suggested improvements
- Expand route coverage to parent, forum, and assessment submission flows.
- Add stable `data-testid` attributes for critical actions to improve UI audit reliability.
- Add seeded audit fixtures for teacher/student assignments so role-specific checks can assert exact data states.
- Add cleanup support for forum test content so browser-created collaboration artifacts do not accumulate.
- Add console-error budgets in CI so regressions fail automatically.