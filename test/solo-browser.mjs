import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.LOCAL_CHROME
    ? { executablePath: process.env.LOCAL_CHROME }
    : {}),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4318/");
  await page.getByRole("button", { name: /Start solo game/ }).click();
  for (let round = 0; round < 5; round++) {
    const category = page.locator("[data-category]");
    if (await category.count()) await category.first().click();
    await page.locator("#bluff").waitFor();
    const inputs = page.locator("#bluff input");
    for (let i = 0; i < (await inputs.count()); i++)
      await inputs.nth(i).fill(`Moonwaffle ${round} ${i}`);
    await page.locator("#bluff button[type=submit]").click();
    await page.locator("#vote").waitFor();
    if (round === 0)
      await page.screenshot({ path: "/tmp/velvet-solo-vote.png" });
    const groups = page.locator("#vote fieldset");
    for (let i = 0; i < (await groups.count()); i++)
      await groups.nth(i).locator("input").first().check();
    await page.locator("#vote button[type=submit]").click();
    await page.locator("#skip").waitFor();
    await page.locator("#skip").click();
    await page.locator("#next").waitFor();
    if (round === 0)
      await page.screenshot({ path: "/tmp/velvet-solo-reveal.png" });
    await page.locator("#next").click();
  }
  await page.getByRole("heading", { name: "Final standings" }).waitFor();
  assert.equal(
    await page.getByRole("link", { name: /KATA ARCADE/ }).getAttribute("href"),
    "https://intrepion.github.io/",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Solo browser match: five questions, double-blank finale, scores and Arcade link passed.",
  );
} finally {
  await browser.close();
}
