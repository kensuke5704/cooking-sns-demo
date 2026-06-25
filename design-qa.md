# Design QA Criteria

## Target

- Mobile viewport: 390px wide.
- Existing Supabase tables, localStorage login data, post data fields, comments, likes, notifications, and account-linked information are not migrated or rewritten.
- Posts continue to render from `prepPhoto`, `cookingPhoto`, and `finishedPhoto`.

## Visual Rules

- Palette: warm orange page surface, rice-white cards, dark brown text, forest green primary actions.
- Radius: large surfaces 28-32px, inner cards 20-26px, inputs and chips 18-999px.
- Spacing: top sections use 20-28px rhythm; post card inner padding is at least 20px around text areas.
- Cheki post photos: exactly three frames per post, labelled `準備`, `調理`, `完成`, with deterministic per-post pose variation from post id.

## Text Fit Checks

- Home hero heading should fit within 2 lines at 390px.
- Section headings should fit within 1 line at 390px.
- Primary button labels should fit within 1 line at 390px.
- Post names and long dish names must not overflow their card; long user names truncate, long titles/memos wrap.
- Bottom navigation must not cover primary post text or actions.

## Dynamic Reproduction Score

Use the generated references in `public/design-targets/` as the visual target. These references are captured from the functional React UI with deterministic mock data, not from flat screenshots layered over the app. A screen is acceptable only at 98% or higher.

- 20%: common UI tokens match the reference direction: warm orange surface, rice-white cards, dark brown text, forest green actions, and soft food/family illustration accents. Deduct for visible color drift or inconsistent radius.
- 20%: home layout hierarchy matches the reference: compact app title/header, warm greeting panel, and feed-first composition without `今日の流れ`. Deduct for section order, density, or proportions that visibly differ.
- 20%: post Cheki visual matches the reference: three food-photo frames, labels, layered overlap, tape or small decoration, and deterministic per-post layout variation. Deduct for flat/simple photo rows or repeated identical poses.
- 15%: spacing quality: no card-inside-card clutter, post card text areas have at least 20px horizontal padding, and primary sections keep 20-28px vertical rhythm. Deduct for cramped cards, accidental gaps, or visual imbalance.
- 15%: text quality at 390px: no overflow, no awkward one-character line breaks, hero headline within 2 lines, section headings and button labels within 1 line. Deduct any visible overflow or unnatural wrapping.
- 10%: functional preservation: no data shape changes, no localStorage login reset, no account-linked data mutation, and existing post/comment/like/delete flows still call the same storage fields. Any violation fails the score regardless of visual quality.

The following user-dependent regions may be excluded from subjective judgment, but the app must still render them dynamically: profile image bitmaps, user-uploaded food photo contents, and the exact current user's display name. Layout, spacing, card geometry, navigation, input visibility, and text wrapping are not excluded.

Fail the release if the total reproduction score is below 98%, even when the app builds successfully.

## Required Verification Before Release

- Run `npm run visual:qa` while the app is available at `http://localhost:3000`.
- Capture home, camera, calendar, connections, and my page at 390px width using deterministic mock data.
- Compare against `public/design-targets/home.png`, `public/design-targets/camera.png`, `public/design-targets/calendar.png`, `public/design-targets/connections.png`, and `public/design-targets/mypage.png`.
- Check that at least one post with three photos renders as Cheki frames using existing post data.
- Inspect long user names, long dish names, and long memos for wrapping or truncation.
- Run static checks and record any pre-existing failures separately from this UI change.
- If a decorative illustration cannot be expressed without risking app functionality, prefer a static generated asset inside a non-interactive illustration area. Do not replace functional forms, photos, lists, or navigation with flat screenshots.
