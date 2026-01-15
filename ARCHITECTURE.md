# Architecture

This document describes the multi-app launcher architecture and file organization conventions.

## Overview

The application is structured as a multi-app launcher where:

- **`/`** is the launcher page that displays available apps
- Each app lives under **`/apps/<appId>`** with its own routes and features

## Directory Structure

```
├── app/                          # Next.js App Router pages & API routes
│   ├── page.tsx                  # Launcher page (/)
│   ├── apps/
│   │   └── story/                # Story app routes
│   │       ├── page.tsx          # Story library (/apps/story)
│   │       └── [storyId]/
│   │           └── page.tsx      # Story reader (/apps/story/[storyId])
│   ├── api/                      # API routes (stable URLs, do not change)
│   │   ├── story/                # Story API endpoints
│   │   ├── stories/              # Stories list endpoint
│   │   └── logs/                 # LLM logging endpoints
│   ├── actions/                  # Server actions
│   └── lib/                      # Re-exports for backward compatibility
│
├── features/                     # Feature-specific code (one folder per app)
│   └── story/
│       ├── components/           # Story-specific UI components
│       │   ├── StoryHeader.tsx
│       │   ├── StoryComposer.tsx
│       │   ├── StoryEntry.tsx
│       │   └── ...
│       ├── lib/                  # Story data & utilities
│       │   ├── worlds.ts         # World registry
│       │   ├── kvStorage.ts      # Redis storage operations
│       │   └── storyState.ts     # State management re-exports
│       ├── llm/                  # LLM integration
│       │   └── openaiHelper.ts   # OpenAI API wrapper
│       ├── story/                # Story domain utilities
│       │   ├── setPiece.ts       # Set piece detection
│       │   └── anchoredSuggestions.ts
│       └── logging/              # Story-specific logging
│           └── llmLogger.ts
│
└── shared/                       # Cross-app shared utilities
    └── ui/
        └── IosStandaloneGuard.tsx
```

## Conventions

### Route Structure

| Route | Purpose |
|-------|---------|
| `/` | App launcher |
| `/apps/<appId>` | App entry point |
| `/apps/<appId>/*` | App-specific routes |

### Feature Boundaries

1. **Each app's code lives under `features/<appId>/`**
   - Components, utilities, and domain logic specific to that app
   - No cross-app imports between feature folders

2. **App routes (`app/apps/<appId>/`) should be thin shells**
   - Import components from `features/<appId>/components/`
   - Import utilities from `features/<appId>/lib/`
   - Minimal logic in route files

3. **Shared code goes in `shared/`**
   - Only truly cross-app utilities
   - Must be useful for 2+ apps before moving to shared

### API Routes

- API routes remain under `app/api/`
- URLs are stable - do not change without migration plan
- Import from `features/<appId>/` modules

### Data Storage (Redis)

Keys are namespaced by feature:

| Prefix | Description |
|--------|-------------|
| `story:*` | Story app data |
| `llm:logs:*` | LLM call logging |
| `app:*` | Global app state |

## Adding a New App

1. Create route folder: `app/apps/<newAppId>/`
2. Create feature folder: `features/<newAppId>/`
3. Add app card to launcher in `app/page.tsx`
4. Add API routes if needed: `app/api/<newAppId>/`
5. Namespace Redis keys: `<newAppId>:*`

## Legacy Redirects

For backward compatibility:

- `/create` → `/apps/story`
- `/story/[storyId]` → `/apps/story/[storyId]`

## Import Conventions

Prefer feature-based imports:

```typescript
// Good: Import from feature
import { StoryHeader } from '@/features/story/components'
import { getWorldById } from '@/features/story/lib/worlds'

// Avoid: Old app/lib paths (kept for backward compatibility)
import { getWorldById } from '@/app/lib/worlds'
```
