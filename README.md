# 🦇 Fred — Your Personal Alfred

> *"Always at your service, sir."*

Fred is a **strategic personal agent** living inside Discord. He's not a simple utility bot — he's the executive layer of your life operating system.

Inspired by Alfred Pennyworth: **organizes, records, analyzes, alerts, confronts, connects patterns, and maintains historical context.**

## Stack

- **Runtime**: Node.js + TypeScript
- **Discord**: discord.js v14
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Scheduler**: node-cron

## Commands

| Command | Description |
|---|---|
| `/remember` | 🧠 Store a memory (decision, idea, note, person) |
| `/recall` | 🧠 Search your memories |
| `/goal create` | 🎯 Create a new goal |
| `/goal list` | 🎯 List your goals |
| `/goal progress` | 🎯 Update goal progress |
| `/task add` | ✅ Add a new task |
| `/task list` | ✅ List your tasks |
| `/task done` | ✅ Mark a task as done |
| `/mood log` | ❤️ Log your current mood |
| `/mood trend` | ❤️ View mood trend |
| `/fred` | 🏛 Talk to Fred directly |
| `/report` | 📊 Generate daily/weekly report |

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in the values
3. `npm install`
4. `npx prisma generate`
5. `npx prisma db push`
6. `npm run register` — register slash commands with Discord
7. `npm run dev` — start Fred

## Architecture

```
src/
├── core/           # Cognitive engine (types, pattern detector, correlations, insights)
├── modules/        # Domain modules (memory, goals, tasks, emotion)
├── application/    # Use cases (schedulers, analyzers)
├── discord/        # Interface layer (client, router, events, context resolver)
├── infrastructure/ # Database, external services
├── config/         # Environment & settings
└── index.ts        # Bootstrap
```

## Discord Server Structure

```
🏛 CORE
  #comando-central  → core
  #relatorios       → core (daily report target)
  #decisoes         → memory

🧠 PRODUTIVIDADE
  #prioridades      → tasks
  #tarefas          → tasks
  #projetos         → goals

❤️ SAUDE
  #humor            → emotion
  #sono             → emotion
  #treino           → emotion
```