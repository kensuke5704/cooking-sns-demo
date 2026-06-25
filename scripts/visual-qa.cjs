const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const { chromium } = require("playwright");

const root = process.cwd();
const outputRoot = path.resolve(root, "../../outputs/visual-qa-dynamic");
const baseUrl = process.env.APP_URL || "http://localhost:3000";
const width = 390;
const height = 693;
const threshold = 98;
const localChromium =
  "/private/tmp/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";

const user = {
  id: "profile-current",
  name: "けんすけ",
  userId: "kensuke",
  iconUrl: "/images/user1-icon.jpg",
};

const today = "2026-06-25";
const posts = [
  {
    id: "post-current",
    user_id: "kensuke",
    user_name: "けんすけ",
    created_at: "2026-06-25T08:30:00.000Z",
    post_date: today,
    prep_photo: `${baseUrl}/images/cooking.jpg`,
    cooking_photo: `${baseUrl}/images/cooking_2.jpg`,
    finished_photo: `${baseUrl}/images/finished.jpg`,
    dish_name: "夏野菜のチキンプレート",
    memo: "みんなが好きな味にできたよ",
    title_suffix: "作りました",
  },
  {
    id: "post-friend",
    user_id: "souta",
    user_name: "そうた",
    created_at: "2026-06-25T08:35:00.000Z",
    post_date: today,
    prep_photo: `${baseUrl}/images/finished_2.jpg`,
    cooking_photo: `${baseUrl}/images/cooking_2.jpg`,
    finished_photo: `${baseUrl}/images/finished.jpg`,
    dish_name: "ハンバーグと野菜のプレート",
    memo: "たった今",
    title_suffix: "作りました",
  },
];

const profiles = [
  { id: "profile-current", user_id: "kensuke", name: "けんすけ", icon_url: "/images/user1-icon.jpg" },
  { id: "profile-mother", user_id: "okaasan", name: "お母さん", icon_url: "/images/user2-icon.jpg" },
  { id: "profile-souta", user_id: "souta", name: "そうた", icon_url: "/images/user2-icon.jpg" },
];

const targets = [
  { name: "home", tab: "ホーム", reference: "home.png" },
  { name: "camera", tab: "カメラ", reference: "camera.png" },
  { name: "calendar", tab: "カレンダー", reference: "calendar.png" },
  { name: "connections", tab: "つながり", reference: "connections.png" },
  { name: "mypage", tab: "プロフィール", reference: "mypage.png" },
];

function jsonResponse(data, status = 200) {
  const count = Array.isArray(data) ? data.length : 1;

  return {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-expose-headers": "content-range",
      "content-range": `0-${Math.max(0, count - 1)}/${count}`,
    },
    body: JSON.stringify(data),
  };
}

async function mockSupabase(page) {
  await page.route("**/rest/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split("/").pop();

    if (table === "friends") {
      return route.fulfill(
        jsonResponse([
          { id: "friend-1", friend_user_id: "okaasan" },
          { id: "friend-2", friend_user_id: "souta" },
        ])
      );
    }

    if (table === "profiles") return route.fulfill(jsonResponse(profiles));
    if (table === "posts") return route.fulfill(jsonResponse(posts));
    if (table === "comments") {
      return route.fulfill(
        jsonResponse([
          {
            id: "comment-1",
            user_id: "souta",
            user_name: "そうた",
            text: "おいしそう！",
            parent_comment_id: null,
          },
        ])
      );
    }
    if (table === "likes") return route.fulfill(jsonResponse([{ id: "like-1" }]));
    if (table === "notifications") {
      return route.fulfill(
        jsonResponse([
          {
            id: "notification-1",
            message: "そうたさんがあなたの投稿にコメントしました",
            type: "comment",
            read: false,
            created_at: "2026-06-25T08:40:00.000Z",
            post_id: "post-current",
          },
        ])
      );
    }

    if (
      [
        "calendar_code_entries",
        "pair_connections",
        "calendar_codes",
        "push_subscriptions",
      ].includes(table || "")
    ) {
      return route.fulfill(jsonResponse([]));
    }

    return route.fulfill(jsonResponse([]));
  });
}

async function preparePage(page, tab) {
  await page.addInitScript(
    ({ user, tab }) => {
      localStorage.setItem("current-user", JSON.stringify(user));
      localStorage.setItem("current-tab", tab);
      localStorage.setItem(
        `daily-cooking-photos-${user.userId}-2026-06-25`,
        JSON.stringify({
          prep: "/images/cooking.jpg",
          cooking: "/images/cooking_2.jpg",
          dishName: "夏野菜のチキンプレート",
          memo: "みんなが好きな味にできたよ",
          titleSuffix: "作りました",
        })
      );
    },
    { user, tab }
  );
}

async function compareImages(referencePath, actualPath, diffPath) {
  const ref = await sharp(referencePath)
    .resize(width, height, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
  const actual = await sharp(actualPath)
    .resize(width, height, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
  const diff = Buffer.alloc(ref.length);
  let sumSq = 0;
  let absSum = 0;
  let changed = 0;

  for (let i = 0; i < ref.length; i += 3) {
    const dr = ref[i] - actual[i];
    const dg = ref[i + 1] - actual[i + 1];
    const db = ref[i + 2] - actual[i + 2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    sumSq += dr * dr + dg * dg + db * db;
    absSum += Math.abs(dr) + Math.abs(dg) + Math.abs(db);
    if (dist > 35) changed += 1;
    diff[i] = Math.min(255, Math.abs(dr) * 3);
    diff[i + 1] = Math.min(255, Math.abs(dg) * 3);
    diff[i + 2] = Math.min(255, Math.abs(db) * 3);
  }

  await sharp(diff, { raw: { width, height, channels: 3 } })
    .png()
    .toFile(diffPath);

  const pixels = width * height;
  const rmse = Math.sqrt(sumSq / (pixels * 3));
  const similarity = Math.max(0, 100 * (1 - rmse / 255));

  return {
    similarity: Number(similarity.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    mae: Number((absSum / (pixels * 3)).toFixed(2)),
    changedRatio: Number(((changed / pixels) * 100).toFixed(2)),
  };
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  const launchOptions = { headless: true };
  try {
    await fs.access(localChromium);
    launchOptions.executablePath = localChromium;
  } catch {
    // Use Playwright's default browser location when the local Codex cache is absent.
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  const results = [];

  for (const target of targets) {
    const page = await context.newPage();
    await mockSupabase(page);
    await preparePage(page, target.tab);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2200);

    const actual = path.join(outputRoot, `${target.name}-actual.png`);
    const diff = path.join(outputRoot, `${target.name}-diff.png`);
    const reference = path.join(root, "public/design-targets", target.reference);
    await page.screenshot({ path: actual, fullPage: false });
    const bodyText = await page.locator("body").innerText().catch(() => "");
    await fs.writeFile(path.join(outputRoot, `${target.name}-body.txt`), bodyText);

    const metrics = await compareImages(reference, actual, diff);
    results.push({ name: target.name, ...metrics });
    await page.close();
  }

  await browser.close();
  await fs.writeFile(
    path.join(outputRoot, "metrics.json"),
    JSON.stringify(results, null, 2)
  );

  const report = [
    "# Dynamic Visual QA",
    "",
    "| Screen | Similarity | RMSE | MAE | Changed pixels >35 |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...results.map(
      (item) =>
        `| ${item.name} | ${item.similarity}% | ${item.rmse} | ${item.mae} | ${item.changedRatio}% |`
    ),
    "",
    `Acceptance target: ${threshold}% similarity with dynamic posts/forms/lists rendered from app components.`,
  ].join("\n");

  await fs.writeFile(path.join(outputRoot, "report.md"), report);
  console.log(report);

  const failures = results.filter((item) => item.similarity < threshold);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
