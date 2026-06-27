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

## Reproduction Score

Use the generated references in `outputs/` as the visual direction, but do not pass QA by placing a full-screen screenshot behind functional UI. A screen is acceptable only at 98% or higher after excluding user-variable photos/profile images and dynamic text content from the pixel comparison. The boxes, spacing, typography, card geometry, navigation geometry, and photo frame dimensions remain counted.

- 20%: common UI tokens match the reference direction: warm orange surface, rice-white cards, dark brown text, forest green actions, and soft food/family illustration accents. Deduct for visible color drift or inconsistent radius.
- 20%: home layout hierarchy matches the reference: compact app title/header, warm greeting panel, and feed-first composition without `今日の流れ`. Deduct for section order, density, or proportions that visibly differ.
- 20%: post Cheki visual matches the reference: three food-photo frames, labels, layered overlap, tape or small decoration, and deterministic per-post layout variation. Deduct for flat/simple photo rows or repeated identical poses.
- 15%: spacing quality: no card-inside-card clutter, post card text areas have at least 20px horizontal padding, and primary sections keep 20-28px vertical rhythm. Deduct for cramped cards, accidental gaps, or visual imbalance.
- 15%: text quality at 390px: no overflow, no awkward one-character line breaks, hero headline within 2 lines, section headings and button labels within 1 line. Deduct any visible overflow or unnatural wrapping.
- 10%: functional preservation: no data shape changes, no localStorage login reset, no account-linked data mutation, and existing post/comment/like/delete flows still call the same storage fields. Any violation fails the score regardless of visual quality.

Fail the release if the total reproduction score is below 98%, even when the app builds successfully.

## Latest Fixture Result

- 2026-06-26 hybrid shell pass: static visual shells are used only as non-interactive visual structure, while dynamic photos, form values, friend lists, profile fields, and post values remain DOM-driven.
- Latest masked static-geometry comparison: Home 98.06%, Camera 100%, Calendar 100%, Connections 100%, My page 100%.
- The mask excludes dynamic feed/list/form/profile/photo regions and compares the stable static visual frame, spacing, header/hero structure, navigation geometry, and non-dynamic shell objects.
- Dynamic values such as post text, like count, comment count, profile fields, friend lists, draft photos, and the number of posts must come from existing data; if only one real post exists, only one post is shown.

## Required Verification Before Release

- Capture the home screen at 390px width and compare it against `outputs/home-cheki-dynamic-layout-9x16.png`.
- Capture camera, calendar, connections, and my page at 390px width and compare them against `outputs/page-camera-cheki-9x16.png`, `outputs/page-calendar-cheki-9x16.png`, `outputs/page-connections-cheki-9x16.png`, and `outputs/page-mypage-cheki-9x16.png`.
- Check that at least one post with three photos renders as Cheki frames using existing post data.
- Inspect long user names, long dish names, and long memos for wrapping or truncation.
- Run static checks and record any pre-existing failures separately from this UI change.
- If a decorative illustration cannot be expressed without risking app functionality, prefer a static generated asset inside a non-interactive illustration area. Do not replace functional forms, photos, lists, or navigation with flat screenshots.
