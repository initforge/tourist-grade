# WIP: Full-Review — Travela
Date: 2026-03-30
Status: IN_PROGRESS

## Progress
- [x] 1. Pre-flight (npm run build + lint)
- [ ] 2. Audit
- [ ] 3. Cleanup
- [ ] 4. Module-refactor
- [ ] 5. Setup-DB
- [ ] 6. README Update
- [ ] 7. CLAUDE.md Update
- [ ] 8. Final Report

## Pre-flight Result
- Build: **PASS** (chỉ warning chunk size, không lỗi)
- Lint: **10 errors** (phải fix)

## Audit Findings
- P0: 10 lint errors (unused vars, unused imports, `any` type)
- P1: mockData.ts vs bookings.ts schema mismatch (2 booking arrays khác nhau)
- P2: `import React from 'react'` trùng lặp ở 29 files (React 19 tự import JSX)
- Files > 300d: SalesBookingDetail.tsx (396d), AdminTourProgramWizard.tsx (331d) — chưa cần tách
- NOTE: ts_errors.txt chứa file đã xóa → ignore

## Current Step
Fix 10 lint errors found by ESLint

## Notes
- mockData.ts MOCK_BLOGS có encoding lỗi (Vietnamese garbled)
- mockData.ts MOCK_BOOKINGS là stub cũ, bookings.ts là canonical source
- src/stores/authStore.ts không tồn tại → chỉ có src/store/useAuthStore.ts
