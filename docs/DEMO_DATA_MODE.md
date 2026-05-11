# Demo Data Mode

This project now separates **demo content** from **demo login accounts**.

## What stays enabled
- Demo login accounts for:
  - Super admin
  - Teacher
  - Student
- These remain available for role-based testing.

## What is controlled
The environment variable below controls whether UI pages are allowed to show built-in demo content:

- `NEXT_PUBLIC_ENABLE_DEMO_DATA="true"` → demo content enabled
- `NEXT_PUBLIC_ENABLE_DEMO_DATA="false"` → demo content disabled

Current default in `.env`:

- `NEXT_PUBLIC_ENABLE_DEMO_DATA="false"`

## How to disable demo data
1. Open `.env`
2. Set:
   - `NEXT_PUBLIC_ENABLE_DEMO_DATA="false"`
3. Restart the dev server

## How to enable demo data again
1. Open `.env`
2. Set:
   - `NEXT_PUBLIC_ENABLE_DEMO_DATA="true"`
3. Restart the dev server

## Important note
Changing this flag requires restarting the Next.js server because the value is read from environment configuration.
