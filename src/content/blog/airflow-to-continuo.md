---
title: "Migrating two dbt projects from Airflow to Continuo"
description: "Two dbt teams on separate Airflows, one silent cross-team break, and the step-by-step move to Continuo, where that break becomes a rejected release instead of a Monday-morning incident."
date: 2026-09-05
draft: false
---
Data pipelines get deployed without a release process. A dbt change ships the minute it merges, and nothing checks that it won't break the team reading your tables downstream. Software solved this with staging and validation gates. Data mostly didn't. 🚢

This is a full migration. Two real dbt projects that run on separate Airflow schedules, moved onto **Continuo**, a control plane that treats a data change like a release: validate the whole graph first, promote only if it's safe. By the end, the same breaking change that Airflow ships without a warning is a release Continuo refuses.

Everything runs on your machine. Three repos: two for the Airflow "before", one for the Continuo "after".

## The before: two teams, two schedulers, zero shared knowledge

The **core** team owns transactions and revenue. The **finance** team builds unit economics (lifetime value, cost per user) on top of core's tables. Two teams, two repos, two Airflow instances.

core runs at 02:00. finance runs at 03:00, because core is *usually* done by then. That word, *usually*, is the whole problem. finance's Airflow has no link to core's. It fires at 03:00 whether core finished, failed, or quietly renamed a column finance depends on.

On a good night, both run green:

| Team | Reads / builds | Status |
|---|---|---|
| core · 02:00 | builds `analytics.revenue_per_user` | ✅ promoted |
| finance · 03:00 | reads `revenue_per_user` → builds `ltv_per_user` | ✅ promoted |

Clone the two teams and see for yourself:

```bash
# the core team's Airflow (also starts the shared warehouse)
git clone https://github.com/carolsimone/airflow-core-demo
cd airflow-core-demo && make up

# the finance team's Airflow, separate stack, same warehouse
git clone https://github.com/carolsimone/airflow-finance-demo
cd airflow-finance-demo && make up
```

## The break: core changes one column, finance breaks, nobody knows

core renames a column: `revenue_eur` becomes `net_revenue_eur`. A reasonable change: the number is net of fees now, and the name should say so. core updates its model, its tests, its docs. core's pipeline runs green. Every check core owns passes.

An hour later, finance fires. Its `ltv_per_user` model still does `SELECT revenue_eur`, and that column is gone. 💥

```bash
make break   # core renames the column
# core's run:    success, every core test passes
# finance's run: ERROR: column "revenue_eur" does not exist
```

| Team | What happened | Status |
|---|---|---|
| core · 02:00 | renamed `revenue_eur` → `net_revenue_eur` | ✅ promoted |
| finance · 03:00 | `column "revenue_eur" does not exist` | ❌ failed |

![Both Airflow UIs side by side: core green on 8080, finance red on 8081](/blog/airflow-to-continuo/airflow-before.png)

No alert fired. No release was blocked, because there was no release, just two cron jobs that met in a shared schema and hoped. The wrong number lands in a dashboard, and someone finds it the next morning. **Two separate schedulers cannot see across a team boundary.** That's not an Airflow bug. It's the missing layer. Let's add it.

## Step 1: Stand up Continuo

You need a Continuo platform to migrate onto, and it runs on your laptop: one `helm install` on a local cluster brings up Continuo and its datastores. Follow **[Instantiate the Continuo platform](/docs/instantiate-continuo)** (about ten minutes), then come back here.

## Step 2: Move the projects onto Continuo

The dbt code doesn't change. The two projects move into one repo, [continuo-core-finance-demo](https://github.com/carolsimone/continuo-core-finance-demo), and release through Continuo instead of a cron. Per project it's three steps:

1. **Take the dbt project as-is.** No model edits. The cross-service reference stays a plain `FROM analytics.revenue_per_user`.
2. **Add a Dockerfile.** The project already builds as an image.
3. **Replace the scheduler with a release.** Instead of a cron trigger, you POST a release to Continuo.

Point at the release API and release both services:

```bash
kubectl -n continuo port-forward svc/release-controller 8088:8088 &
git clone https://github.com/carolsimone/continuo-core-finance-demo
cd continuo-core-finance-demo
make release SERVICE=continuo-core    TAG=v1
make release SERVICE=continuo-finance TAG=v1
```

Each ends **promoted**, and there's the first win: there is no `03:00` for finance anymore. Continuo reads that finance depends on core and orders the build itself, the ordering two separate crons could only approximate.

| Service | Continuo | Status |
|---|---|---|
| continuo-core | validated across the graph, then promoted | ✅ promoted |
| continuo-finance | reads core's `revenue_per_user`; sequenced after it | ✅ promoted |

Then trigger a run of the `daily` schedule from the UI so the tables are built. (The [platform guide](/docs/instantiate-continuo) covers logging in.) One run, both services, in one graph: core's nodes and finance's in their own lanes, with the cross-service edges Continuo sequenced on.

![Continuo's run view: the daily schedule at 13/13 nodes succeeded, core 5/5 and finance 8/8 in separate swim lanes, dependency edges crossing between them](/blog/airflow-to-continuo/continuo-run-swimlanes.png)

## Step 3: The same break, rejected before it ships

Now make the *exact* change that broke finance on Airflow: rename `revenue_per_user`'s output column `revenue_eur` in `services/continuo-core`, and release core again:

```bash
make release SERVICE=continuo-core TAG=v2
```

This time it is **rejected**. Continuo validates core against the whole topology, sees that `continuo-finance`'s `ltv_per_user` still reads `revenue_eur`, and refuses to promote. Production never changes: `current-prod` still points at the last good release.

| Node | What Continuo saw | Status |
|---|---|---|
| continuo-core | rename validated across the graph → finance would break | ❌ rejected |
| production | `current-prod` unchanged, the bad release never shipped | ✅ safe |

![Continuo's Releases tab: core v2 rejected on validation while production stays on the last good finance release](/blog/airflow-to-continuo/continuo-rejected.png)

Airflow found the break at 03:00, in production, in finance's data. Continuo found it at release, in a shadow, before anything shipped.

## Step 4: Continuo proposes the fix

A rejected release tells you something broke. Continuo can also try to fix it. When the release is rejected, its remediation agent classifies the failure, reads the *changed* model's source at `repo@commit_sha`, and asks an LLM for a repair, then runs a **real validation** to prove the fix works before showing it to you. It never writes to your repo: the output is a diff you review and a pull request you choose to open. 🤖

For this break, it edited core's `revenue_per_user` and kept both column names: the new `net_revenue_eur` and `revenue_eur` back as an alias, so finance's `ltv_per_user` reads again without finance changing a line. Verified by a live dbt run, confidence **high**, one click from a PR:

![Continuo's remediation proposal: status proposed, confidence high, verification passed; the agent adds revenue_eur back as an alias in core's revenue_per_user so finance reads again, with a Create PR button](/blog/airflow-to-continuo/continuo-remediation-proposal.png)

The fix lands in the service that changed, core, because the downstream model in finance *can't* change in this release: its own fix could never ship ahead of the change that broke it. This step needs two credentials the rest of the demo doesn't (an LLM key to write the fix, a read-only GitHub token to read the source); the **[platform guide](/docs/run-projects-in-continuo)** walks through both, plus the GitHub App that turns *Create PR* into a real pull request.

## Why it's better: dependencies, and deployment

Two things Continuo gives that two Airflows can't:

- **Cross-service dependencies.** core and finance depend on each other across projects (core reads a finance table; finance reads a core table). On Airflow that mesh had no run order two cron schedules could express, so you scheduled an hour apart and hoped. Continuo orders it from the dependency graph itself, every release.
- **Deployment.** A change is validated against the *whole* topology before it promotes, blue/green. The rename wasn't wrong: teams rename columns every week. What was missing was the gate every software deploy has and most data pipelines don't: something that looks at the whole graph and says "not yet" before a change lands. 🔒

## Run it yourself

Clone the two "before" repos, run `make break`, and watch finance fall over. Then stand up Continuo and move the projects onto it, and watch the same change get stopped.

[airflow-core-demo](https://github.com/carolsimone/airflow-core-demo) · [airflow-finance-demo](https://github.com/carolsimone/airflow-finance-demo) · [continuo-core-finance-demo](https://github.com/carolsimone/continuo-core-finance-demo)
