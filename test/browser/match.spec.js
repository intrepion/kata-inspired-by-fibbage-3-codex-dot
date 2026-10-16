import { test, expect } from "@playwright/test";

test("three private controllers finish five questions, reconnect, restart and reset quick timers", async ({
  browser,
}) => {
  const host = await browser.newPage(),
    a = await browser.newPage(),
    b = await browser.newPage(),
    c = await browser.newPage();
  const pages = [a, b, c],
    errors = [];
  for (const p of [host, ...pages])
    p.on("pageerror", (e) => errors.push(e.message));
  try {
    await host.goto("/host");
    await host
      .getByRole("button", { name: "Open the lounge", exact: true })
      .click();
    await expect(host.locator(".code")).toBeVisible();
    const code = await host.locator(".code").textContent();
    for (const [i, p] of pages.entries()) {
      await p.goto("/play?room=" + code);
      await p.getByLabel("YOUR NAME").fill(["Ada", "Bo", "Cy"][i]);
      await p.getByRole("button", { name: "Take a seat" }).click();
      await expect(p.getByText("Waiting for the host to start.")).toBeVisible();
    }
    await host.locator("#quick").check();
    await host.getByRole("button", { name: "Start the game" }).click();
    for (let q = 0; q < 5; q++) {
      if (q < 4) {
        const chooser = pages[q % 3];
        await expect(
          chooser.locator("[data-action=choose]").first(),
        ).toBeEnabled();
        await chooser.locator("[data-action=choose]").first().click();
      }
      for (const [i, p] of pages.entries()) {
        if (q === 0 && i === 1) continue; // Bo submitted early to test another controller's draft.
        await expect(p.locator("#blank0")).toBeVisible();
        await p.locator("#blank0").fill(`plausible fib ${q} ${i}`);
        if (q === 4) await p.locator("#blank1").fill(`second fib ${i}`);
        if (q === 0 && i === 0) {
          // Force a state-driven render while a draft exists; the text must survive.
          const updated = p.waitForResponse(
            async (r) =>
              r.url().endsWith("/api/state") &&
              (await r.json()).players.some(
                (player) => player.name === "Bo" && player.submitted,
              ),
          );
          await b.locator("#blank0").fill("plausible fib 0 1");
          await b.getByRole("button", { name: "Lock my bluff" }).click();
          await updated;
          await expect(p.locator("#blank0")).toHaveValue("plausible fib 0 0");
          const actions = [];
          const listener = (req) => {
            if (req.url().endsWith("/api/action"))
              actions.push(req.postDataJSON().action);
          };
          p.on("request", listener);
          await p.getByRole("button", { name: "Write one for me" }).click();
          await expect(p.getByText("Your bluff is locked.")).toBeVisible();
          p.off("request", listener);
          expect(actions).toEqual(["help"]);
          await expect(p.locator("#error")).toBeEmpty();
        } else await p.getByRole("button", { name: "Lock my bluff" }).click();
        if (i === 0) {
          await expect(host.locator("main")).not.toContainText(
            `plausible fib ${q} 0`,
          );
          await expect(b.locator("main")).not.toContainText(
            `plausible fib ${q} 0`,
          );
          if (q === 0) {
            await a.reload();
            await expect(a.getByText("Your bluff is locked.")).toBeVisible();
          }
        }
      }
      for (const [i, p] of pages.entries()) {
        await expect(p.locator("[data-action=select]").first()).toBeVisible();
        await expect(p.locator("[data-action=select]")).not.toContainText([
          `plausible fib ${q} ${i}`,
        ]);
        for (let row = 0; row < (q === 4 ? 2 : 1); row++)
          await p
            .locator(`[data-action=select][data-row="${row}"]`)
            .first()
            .click();
        await p.getByRole("button", { name: "Lock my vote" }).click();
        if (q === 0 && i === 0) {
          await a.reload();
          await expect(a.getByText("Vote locked.")).toBeVisible();
        }
      }
      for (const p of pages) {
        await expect(
          p.getByRole("button", { name: "Skip", exact: true }),
        ).toBeVisible();
        await p.getByRole("button", { name: "Skip", exact: true }).click();
      }
      await expect(
        host.getByText("THE TRUTH", { exact: true }).first(),
      ).toBeVisible();
      if (q === 0)
        await host.screenshot({
          path: "test-results/reveal.png",
          fullPage: true,
        });
      await host
        .getByRole("button", {
          name: q === 4 ? "Final standings" : "Next question",
        })
        .click();
    }
    await expect(host.getByText("THE LOUNGE HAS SPOKEN")).toBeVisible();
    await host.screenshot({
      path: "test-results/finished.png",
      fullPage: true,
    });
    await host.getByRole("button", { name: "Play again" }).click();
    await expect(
      host.getByRole("button", { name: "Start the game" }),
    ).toBeVisible();
    await a.reload();
    await expect(a.getByText("Waiting for the host to start.")).toBeVisible();
    await host.locator("#quick").uncheck();
    await host.getByRole("button", { name: "Start the game" }).click();
    await expect(a.locator("[data-action=choose]").first()).toBeEnabled();
    await a.locator("[data-action=choose]").first().click();
    await expect(host.locator("#timer")).toHaveText(/^(5[0-9]|60)s$/);
    expect(errors).toEqual([]);
  } finally {
    await Promise.all([host, ...pages].map((p) => p.close()));
  }
});

test("mobile landing and controller fit a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [url, name] of [
    ["/", "landing"],
    ["/play", "controller"],
  ]) {
    await page.goto(url);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/mobile-${name}.png`,
      fullPage: true,
    });
  }
});
