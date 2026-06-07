import { expect, test } from "@playwright/test";

function uniq(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

async function registerUser(page: import("@playwright/test").Page) {
  const password = "SmokePass123!";
  for (let i = 0; i < 6; i += 1) {
    const email = `${uniq("ui")}_${i}@example.com`;
    const response = await page.request.post("/api/auth/register", { data: { email, password } });
    if (response.ok()) return { email, password };
    if (response.status() === 409 || response.status() === 429) {
      await page.waitForTimeout(300);
      continue;
    }
    throw new Error(`register failed: ${response.status()} ${await response.text()}`);
  }
  throw new Error("register failed after retries");
}

test("guide: faq search filters items", async ({ page }) => {
  await page.goto("/guide");
  await page.fill("#guideSearchInput", "экспорт");
  await expect(page.locator(".guide-faq-item:visible")).toHaveCount(1);
  await expect(page.locator(".guide-faq-item:visible")).toContainText("Excel");
});

test("author: topic is prefilled from query", async ({ page }) => {
  await page.goto("/author?topic=%D0%91%D0%B0%D0%B3%20%D0%B2%20%D0%BA%D0%BE%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%82%D0%BE%D1%80%D0%B5");
  await expect(page.locator("#contactTopicInput")).toHaveValue("Баг в конструкторе");
});

test("author: quick topic fills form helper", async ({ page }) => {
  await page.goto("/author");
  await page.getByRole("button", { name: /Проблема/ }).click();
  await expect(page.locator("#contactTopicInput")).toHaveValue("Проблема в конструкторе");
  await expect(page.locator("#contactTypeInput")).toHaveValue("bug");
  await expect(page.locator("#contactMessageInput")).toHaveValue(/Как повторить/);
});

test("author: form submits and mailto link is generated", async ({ page }) => {
  await page.goto("/author");
  await page.fill("#contactNameInput", "Tester");
  await page.fill("#contactEmailInput", "tester@example.com");
  await page.fill("#contactTopicInput", "Проблема");
  await page.selectOption("#contactTypeInput", "bug");
  await page.fill("#contactMessageInput", "Подробное сообщение для проверки формы.");

  const href = await page.locator("#contactMailtoBtn").getAttribute("href");
  expect(href || "").toContain("mailto:arabragduani@gmail.com");
  expect(decodeURIComponent(href || "")).toContain("Проблема");
  expect(decodeURIComponent(href || "")).toContain("Ошибка");
  expect(decodeURIComponent(href || "")).toContain("Tester");

  await page.click("#contactSubmitBtn");

  await expect(page.locator("#contactStatus")).toContainText("Сообщение отправлено");
});

test("account: can save company and position", async ({ page }) => {
  await registerUser(page);
  await page.goto("/account?tab=profile");
  await expect(page.locator(".account-tab.is-active")).toContainText("Профиль");

  const company = uniq("Company");
  const position = uniq("Position");
  await page.fill("#companyInput", company);
  await page.fill("#positionInput", position);
  await page.click("#saveProfileBtn");

  await expect
    .poll(async () => {
      const response = await page.request.get("/api/account");
      const body = await response.json();
      return `${body.company || ""}|${body.position || ""}`;
    })
    .toBe(`${company}|${position}`);
});

test("theme: dark theme persists across public pages", async ({ page }) => {
  await registerUser(page);
  await page.goto("/account?tab=prefs");
  await page.selectOption("#themeSelect", "dark");
  await page.click("#savePrefsBtn");

  for (const path of ["/", "/guide", "/author", "/cabinet", "/create"]) {
    await page.goto(path);
    await expect
      .poll(async () => page.locator("html").getAttribute("data-theme"))
      .toBe("dark");
  }
});
