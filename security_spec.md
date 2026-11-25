# KromaFolio Security Specification (Phase 0)

## 1. Data Invariants
1. **Creator Profile Ownership & PII Isolation**: Public `/creators/{creatorId}` contains zero PII (no email or phone). Email and theme preferences live strictly in `/creators/{creatorId}/private/info`, accessible only when `request.auth.uid == creatorId` and `email_verified == true`.
2. **Portfolio Deck Integrity**: A portfolio deck cannot be created with an `ownerId` different from `request.auth.uid`, an `appreciationCount` other than `0`, or missing/oversized slides (`1 <= slides.size() <= 16`).
3. **Showcase Query Enforcement**: Unauthenticated or non-owner `get` and `list` requests on `/portfolios/{portfolioId}` succeed ONLY when `resource.data.isPublished == true`. Draft portfolios remain private to `ownerId == request.auth.uid`.
4. **Atomic Appreciation Counter**: Users cannot arbitrarily increment `appreciationCount` or like twice; updates to `appreciationCount` must change by exactly `+1` or `-1` in the same atomic batch that creates or deletes `/portfolios/{portfolioId}/appreciations/{request.auth.uid}` on a published portfolio.
5. **Immutable Audit Fields & Server Timestamps**: `createdAt` and `ownerId` / `uid` are strictly immutable after creation, and `createdAt` / `updatedAt` must equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on Portfolio Create**: User `alice` creates `/portfolios/p1` with `ownerId: "bob"`. -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Creator Profile**: User `alice` creates `/creators/alice` adding ghost field `isVerified: true` or `role: "admin"`. -> `PERMISSION_DENIED`.
3. **PII Leak Attempt**: User `bob` reads `/creators/alice/private/info` to steal `alice`'s email. -> `PERMISSION_DENIED`.
4. **Unverified Email Write**: User with `email_verified: false` attempts to create a portfolio deck. -> `PERMISSION_DENIED`.
5. **Private Draft Scraping**: User `bob` lists `/portfolios` without filtering `isPublished == true` or `ownerId == bob`. -> `PERMISSION_DENIED`.
6. **Appreciation Count Inflation**: User `alice` updates `/portfolios/p1` setting `appreciationCount: 999999`. -> `PERMISSION_DENIED`.
7. **Orphan Appreciation Without Counter Update**: User `alice` creates `/portfolios/p1/appreciations/alice` without atomically incrementing `appreciationCount` on `/portfolios/p1`. -> `PERMISSION_DENIED`.
8. **Duplicate Appreciation**: User `alice` tries to increment `appreciationCount` on `/portfolios/p1` when `/portfolios/p1/appreciations/alice` already exists. -> `PERMISSION_DENIED`.
9. **ID Poisoning**: Attacker writes `/portfolios/` with a 1.5KB junk document ID containing `/` or `$`. -> `PERMISSION_DENIED`.
10. **Owner Hijack on Update**: User `alice` updates `/portfolios/p1` to change `ownerId` or tamper with `createdAt`. -> `PERMISSION_DENIED`.
11. **Slide Array Exhaustion**: Attacker creates a portfolio with `slides: []` (empty) or `25` slides exceeding the 16-slide cap. -> `PERMISSION_DENIED`.
12. **Appreciating Unpublished Draft**: User `bob` tries to appreciate `alice`'s private draft portfolio (`isPublished == false`). -> `PERMISSION_DENIED`.
