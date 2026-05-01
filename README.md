# DevOps Control Center

`DevOps Control Center` is a portfolio-friendly DevOps dashboard concept focused on CI/CD visibility, pipeline health, deployment tracking, and operational awareness across multiple repositories.

## What This Project Aims To Be

- A central dashboard for monitoring GitHub Actions and delivery health
- A polished frontend that feels production-ready
- A strong portfolio project for DevOps, platform engineering, and SRE roles
- A repo with both a real app shell and a static GitHub Pages preview

## Initial Feature Scope

- Multi-repo pipeline status overview
- Failed build and deployment alert feed
- Environment health summary
- Recent deploy timeline
- Repository drill-down cards
- Static public preview for GitHub Pages

## Project Structure

```text
frontend/      Future app shell for the main dashboard
backend/       Future API for repo health, alerts, and deployments
preview/       Static landing page for GitHub Pages
docs/
  architecture.md
```

## Tech Direction

- `frontend`: React + TypeScript + Vite
- `backend`: Node API scaffold
- `preview`: Static HTML/CSS/JS for instant GitHub Pages hosting

## Why There Is A Preview Folder

- `frontend` is the real product direction
- `preview` is the public showcase page that can go live quickly and link back to the repo

This makes it easier to:

- show the project publicly right away
- keep building the real app without blocking the preview
- add the project to your portfolio early

## Suggested Next Steps

1. Create the GitHub Pages preview from `preview`
2. Start building the dashboard modules in `frontend`
3. Connect real API endpoints from `backend`
4. Add the final live preview to your portfolio
