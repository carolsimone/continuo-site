---
title: "Migrating two dbt projects from Airflow to Continuo"
description: "Two dbt teams, two Airflow schedules, one silent cross-team break — and how a release process turns it into a rejected deploy instead of a Monday-morning incident."
date: 2026-09-04
draft: true
---
Data pipelines get deployed without a release process. A dbt change ships the minute it merges, and nothing checks that it won't break the team reading your tables downstream. Software solved this with staging and validation gates. Data mostly didn't. 🚢

This is the proof, in one bug. We take two real dbt projects running on separate Airflow schedules and move them onto **Continuo** — a control plane that treats a data change like a release: validate the whole graph first, promote only if it's safe. The same breaking change that Airflow ships without a warning, Continuo rejects before it reaches production.

Everything here is runnable. Two repos for the "before", one for the "after".

## Two teams, two schedulers, zero shared knowledge

The **core** team owns transactions and revenue. The **finance** team builds unit economics — lifetime value, cost per user — on top of core's tables. Two teams, two repos, two Airflow instances.

core runs at 02:00. finance runs at 03:00, because core is *usually* done by then. That word, *usually*, is the whole problem. finance's Airflow has no link to core's. It fires at 03:00 whether core finished, failed, or quietly renamed a column finance depends on.

On a good night, both run green:

| Team | Reads / builds | Status |
|---|---|---|
| core · 02:00 | builds `analytics.revenue_per_user` | ✅ promoted |
| finance · 03:00 | reads `revenue_per_user` → builds `ltv_per_user` | ✅ promoted |

Clone them and see for yourself:

```bash
# the core team's Airflow (also starts the shared warehouse)
git clone https://github.com/carolsimone/airflow-core-demo
cd airflow-core-demo && make up

# the finance team's Airflow — separate stack, same warehouse
git clone https://github.com/carolsimone/airflow-finance-demo
cd airflow-finance-demo && make up
```

## core changes one column. finance breaks. Nobody knows.

core renames a column: `revenue_eur` becomes `net_revenue_eur`. A reasonable change — the number is net of fees now, and the name should say so. core updates its model, its tests, its docs. core's pipeline runs green. Every check core owns passes.

An hour later, finance fires. Its `ltv_per_user` model still does `SELECT revenue_eur` — and that column is gone. 💥

```bash
make break   # core renames the column
# core's run:    success — every core test passes
# finance's run: ERROR: column "revenue_eur" does not exist
```

| Team | What happened | Status |
|---|---|---|
| core · 02:00 | renamed `revenue_eur` → `net_revenue_eur` | ✅ promoted |
| finance · 03:00 | `column "revenue_eur" does not exist` | ❌ failed |

![Both Airflow UIs side by side — core green on 8080, finance red on 8081](/blog/airflow-to-continuo/airflow-before.png)

No alert fired. No release was blocked, because there was no release — just two cron jobs that met in a shared schema and hoped. The wrong number lands in a dashboard, and someone finds it the next morning. **Two separate schedulers cannot see across a team boundary.** That's not an Airflow bug. It's the missing layer.

## Three steps to a real release

Moving each project onto Continuo is small. The dbt code doesn't change.

| Before · Airflow | After · Continuo |
|---|---|
| A DAG per team | No DAG, no cron |
| A cron guess for ordering | Continuo orders the graph itself |
| Ships on merge, unchecked | Validated before it promotes |
| Breaks found in dashboards | Breaks rejected at release |

Per project, it's three steps:

1. **Copy the project into the repo.** No model edits. The cross-service reference stays a plain `FROM analytics.revenue_per_user`.
2. **Add a Dockerfile.** The project already builds as an image.
3. **Replace the scheduler with a release.** Instead of a cron trigger, you POST a release to Continuo.

```bash
# from continuo-core-finance-demo, against your local Continuo
make release SERVICE=continuo-core    TAG=v1
make release SERVICE=continuo-finance TAG=v1
```

There's no 03:00 for finance anymore. Continuo reads the dependency between the two projects and sequences the build itself — the ordering two crons could only approximate.

## The same change, rejected before it ships

Now make the *exact* same rename on Continuo. `revenue_eur` → `net_revenue_eur`, release core again. This time it isn't a first-time bootstrap — it's validated against the whole topology.

Continuo compiles the change, sees that finance's `ltv_per_user` still reads `revenue_eur`, and stops. The release is **rejected**. Production is never touched — `current-prod` still points at the last good release.

| Node | What Continuo saw | Status |
|---|---|---|
| continuo-core | rename validated across the graph → finance would break | ❌ rejected |
| production | `current-prod` unchanged — the bad release never shipped | ✅ safe |

![Continuo rejecting the release — the graph with the failing downstream node, status validation_failed](/blog/airflow-to-continuo/continuo-rejected.png)

Airflow found the break at 03:00, in production, in finance's data. Continuo found it at release, in a shadow, before anything shipped. The change that would have broken finance simply never reaches it.

## Data deserves a release process

The rename wasn't wrong — teams rename columns every week. What was missing was the gate every software deploy has and most data pipelines don't: something that looks at the *whole* graph and says "not yet" before a change lands. Continuo is that gate. Blue/green validation for data, so a cross-team break is a rejected release, not a Monday-morning incident. 🔒

---

**Run it yourself.** Clone the two "before" repos, run `make break`, and watch finance fall over. Then move it onto Continuo and watch the same change get stopped.

[airflow-core-demo](https://github.com/carolsimone/airflow-core-demo) · [airflow-finance-demo](https://github.com/carolsimone/airflow-finance-demo) · [continuo-core-finance-demo](https://github.com/carolsimone/continuo-core-finance-demo)
