# HerdSense

> **3rd Place — Precision Digital Architecture Hackathon, UIUC**

HerdSense is an AI livestock health intelligence dashboard for monitoring herd conditions, surfacing risk alerts, and exploring farm data through a modern operations UI.

## Features

- Real-time herd health dashboard
- Live feed and alert monitoring
- AI-assisted farm document search with `Field Oracle`
- Animal-level health profiling and risk signals

## AI API Setup

Create a local env file in the project root named `.env.local` and add:

```sh
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

`Field Oracle` will automatically use that key. `.env.local` is already ignored by git because of the existing `*.local` rule.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion

## Getting Started

```sh
npm install
npm run dev
```

## Available Scripts

```sh
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```
