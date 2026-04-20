# Frontend Structure

This frontend is organized to absorb UI feedback quickly without spreading edits across unrelated modules.

## Top-level folders

- `app/`: application entry wiring such as router composition.
- `features/`: route-facing screens grouped by business area or user role.
- `entities/`: domain data, types, and mock datasets that are shared by multiple features.
- `shared/`: cross-cutting layouts, UI primitives, hooks, store, and utilities.

## Where to edit when feedback arrives

- Public website changes:
  edit `features/public/pages/*`
- Login / register flow:
  edit `features/auth/pages/*`
- Customer self-service screens:
  edit `features/customer/pages/*`
- Internal backoffice screens:
  edit the relevant folder in `features/admin`, `features/manager`, `features/coordinator`, or `features/sales`
- Shared navigation, shells, or wrappers:
  edit `shared/layouts/*`
- Reused modal components:
  edit `shared/ui/*`
- Auth/session logic:
  edit `shared/store/*` and `shared/hooks/*`
- Shared mock/domain data:
  edit the matching module under `entities/*/data/*`
- Business rules and API/database handoff notes:
  edit `docs/business-rules.md`

## Working rules

- New page-level UI should go into the matching `features/<scope>/pages` folder.
- Shared code should move to `shared/` only when at least two features genuinely reuse it.
- Domain types and mock data should stay inside `entities/`, not in page files.
- Keep route definitions centralized in `app/AppRouter.tsx`.
- Prefer alias imports (`@features`, `@entities`, `@shared`) over deep relative paths.
