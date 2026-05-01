# Architecture Notes

## Product Vision

DevOps Control Center should feel like a lightweight operations cockpit for small engineering teams.

The UI should answer these questions fast:

- What failed recently?
- Which repositories are unhealthy?
- Which environments are currently risky?
- What changed in the last deployment window?

## Product Areas

### 1. Overview Dashboard

- Global health score
- Failing workflow count
- Active incidents
- Recent deployments
- Slowest pipelines

### 2. Repositories

- Repository status cards
- Workflow success rate
- Last deployment result
- Linked environments

### 3. Deployments

- Timeline view
- Environment badges
- Deployment duration
- Rollback markers

### 4. Alerts

- Failed pipeline alerts
- Repeated failure detection
- Long-running job warnings
- Manual acknowledgement state

## Preview Strategy

The GitHub Pages preview should behave like a polished product demo rather than a screenshot dump.

It should include:

- Hero section
- Product value statement
- Example dashboard cards
- Feature grid
- CTA linking to the repo and live app later

## Future Integrations

- GitHub Actions API
- GitHub webhooks
- Slack or Discord notifications
- Grafana or Prometheus summary widgets
- Environment inventory from Terraform outputs

## Repo Layout

- `frontend/`: dashboard UI, filters, tables, cards, timelines
- `backend/`: sync jobs, GitHub ingestion, alert rules, API endpoints
- `preview/`: static public showcase for GitHub Pages
