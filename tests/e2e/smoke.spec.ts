import { expect, test } from "@playwright/test";

function uniq(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

async function registerUser(page: import("@playwright/test").Page) {
  const password = "SmokePass123!";
  let lastStatus = 0;
  let lastBody = "";
  for (let i = 0; i < 6; i += 1) {
    const email = `${uniq("ui")}_${i}@example.com`;
    const response = await page.request.post("/api/auth/register", {
      data: { email, password }
    });
    lastStatus = response.status();
    lastBody = await response.text();
    if (response.ok()) return { email, password };

    if (response.status() === 409) continue;
    if (response.status() === 429) {
      await page.waitForTimeout(1200);
      continue;
    }
    throw new Error(`register failed: ${response.status()} ${lastBody}`);
  }
  throw new Error(`register failed after retries: ${lastStatus} ${lastBody}`);
}

async function createSurvey(page: import("@playwright/test").Page, payload: Record<string, unknown>) {
  let lastStatus = 0;
  let lastBody = "";
  for (let i = 0; i < 6; i += 1) {
    const response = await page.request.post("/api/surveys", { data: payload });
    lastStatus = response.status();
    lastBody = await response.text();
    if (response.ok()) {
      const data = JSON.parse(lastBody || "{}");
      expect(Number.isInteger(data.id)).toBeTruthy();
      return Number(data.id);
    }
    if (response.status() === 429 || response.status() >= 500) {
      await page.waitForTimeout(800 + i * 200);
      continue;
    }
    throw new Error(`create survey failed: ${response.status()} ${lastBody}`);
  }
  throw new Error(`create survey failed after retries: ${lastStatus} ${lastBody}`);
}

test("cabinet: survey can be deleted from card action", async ({ page }) => {
  await registerUser(page);

  const title = uniq("Delete survey");
  const surveyId = await createSurvey(page, {
    title,
    description: "e2e delete smoke",
    pages: [
      {
        title: "Page 1",
        questions: [{ text: "Question one", type: "text", required: true }]
      }
    ]
  });

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page.goto("/cabinet");
  await expect(page.getByText(title)).toBeVisible();
  await page.locator(`[data-delete="${surveyId}"]`).click();

  await expect
    .poll(async () => {
      const res = await page.request.get(`/api/surveys/${surveyId}`);
      return res.status();
    })
    .toBe(404);
});

test("survey settings: save keeps multi-page structure", async ({ page }) => {
  await registerUser(page);

  const surveyId = await createSurvey(page, {
    title: uniq("Paged survey"),
    description: "before save",
    pages: [
      {
        title: "Page 1",
        questions: [
          {
            text: "Pick one",
            type: "single",
            required: true,
            options: [{ text: "A" }, { text: "B" }]
          }
        ]
      },
      {
        title: "Page 2",
        questions: [{ text: "Comment", type: "text", required: false }]
      }
    ]
  });

  await page.goto(`/survey.html?id=${surveyId}&tab=settings`);

  const newTitle = uniq("Saved title");
  await page.locator("#settingsTitle").fill(newTitle);
  await page.locator("#saveSettingsBtn").click();
  await expect(page.locator("#surveyTabStatus")).toContainText("Изменения сохранены");

  await expect
    .poll(async () => {
      const res = await page.request.get(`/api/surveys/${surveyId}`);
      if (!res.ok()) return "error";
      const data = await res.json();
      const pagesCount = Array.isArray(data.pages) ? data.pages.length : 0;
      const pageIds = new Set((data.pages || []).map((p: any) => String(p.id)));
      const usedPageIds = new Set((data.questions || []).map((q: any) => String(q.pageId || q.page_id || "")));
      const titleOk = String(data.survey?.title || "") === newTitle;
      const hasDifferentQuestionPages = [...usedPageIds].filter((id) => pageIds.has(id)).length >= 2;
      return `${pagesCount}|${titleOk}|${hasDifferentQuestionPages}`;
    })
    .toBe("2|true|true");
});

test("builder: move selected questions to another page via bulk action", async ({ page }) => {
  await registerUser(page);

  const surveyId = await createSurvey(page, {
    title: uniq("Bulk move"),
    description: "bulk move test",
    pages: [
      {
        title: "Page 1",
        questions: [
          { text: "Question A", type: "text", required: true },
          { text: "Question B", type: "text", required: false }
        ]
      },
      {
        title: "Page 2",
        questions: [{ text: "Question C", type: "text", required: false }]
      }
    ]
  });

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("prompt");
    await dialog.accept("2");
  });

  await page.goto(`/create?surveyId=${surveyId}`);
  await page.locator("[data-action='select']").first().click();
  await page.locator("[data-action='select']").nth(1).click();
  await page.locator("#moveSelectedToPageBtn").click();

  await expect
    .poll(async () => {
      const res = await page.request.get(`/api/surveys/${surveyId}`);
      if (!res.ok()) return "error";
      const data = await res.json();
      const pages = Array.isArray(data.pages) ? data.pages : [];
      const questions = Array.isArray(data.questions) ? data.questions : [];
      if (pages.length < 2) return "bad_pages";

      const page1Id = String(pages[0].id);
      const page2Id = String(pages[1].id);
      const p1Count = questions.filter((q: any) => String(q.pageId || q.page_id) === page1Id).length;
      const p2Count = questions.filter((q: any) => String(q.pageId || q.page_id) === page2Id).length;
      return `${p1Count}|${p2Count}`;
    })
    .toBe("0|3");
});

test("builder: live preview shows pages and logic routes", async ({ page }) => {
  await registerUser(page);

  const surveyId = await createSurvey(page, {
    title: uniq("Logic preview"),
    description: "preview test",
    pages: [
      {
        title: "Start",
        questions: [
          {
            text: "Choose path",
            type: "single",
            required: true,
            logicEnabled: true,
            options: [{ text: "Go to details", jumpToPageIndex: 1 }, { text: "Continue" }]
          }
        ]
      },
      {
        title: "Details",
        questions: [{ text: "Tell us more", type: "text", required: false }]
      }
    ]
  });

  await page.goto(`/create?surveyId=${surveyId}`);

  await expect(page.locator("#surveyPreviewList")).toContainText("Start");
  await expect(page.locator("#surveyPreviewList")).toContainText("Details");
  await expect(page.locator("#logicMapCount")).toHaveText("1");
  await expect(page.locator("#logicMapList")).toContainText("Go to details -> Details");

  await page.locator("#previewMobileBtn").click();
  await expect(page.locator("#previewModeLabel")).toHaveText("Телефон");
  await expect(page.locator("#surveyPreviewList")).toHaveClass(/constructor-live-preview__list--mobile/);
});

test("cabinet: bulk delete removes all selected surveys", async ({ page }) => {
  await registerUser(page);

  const prefix = uniq("BulkDelete");
  const surveyOne = await createSurvey(page, {
    title: `${prefix} A`,
    description: "bulk delete A",
    pages: [{ title: "Page 1", questions: [{ text: "Question one", type: "text", required: true }] }]
  });
  const surveyTwo = await createSurvey(page, {
    title: `${prefix} B`,
    description: "bulk delete B",
    pages: [{ title: "Page 1", questions: [{ text: "Question two", type: "text", required: true }] }]
  });

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page.goto("/cabinet");
  await page.locator("#searchInput").fill(prefix);
  await page.locator("#selectAllFilteredBtn").click();
  await page.locator("#bulkDeleteBtn").click();

  await expect
    .poll(async () => {
      const [resA, resB] = await Promise.all([
        page.request.get(`/api/surveys/${surveyOne}`),
        page.request.get(`/api/surveys/${surveyTwo}`)
      ]);
      return `${resA.status()}|${resB.status()}`;
    })
    .toBe("404|404");
});

test("builder: quality check flags leading questions", async ({ page }) => {
  await registerUser(page);

  const surveyId = await createSurvey(page, {
    title: "Customer research",
    description: "Understand customer sentiment before launch.",
    pages: [
      {
        title: "Page 1",
        questions: [
          {
            text: "Разве наш продукт не лучший на рынке?",
            type: "single",
            required: true,
            options: [{ text: "Да" }, { text: "Нет" }]
          },
          { text: "Почему вы так считаете?", type: "text", required: false },
          { text: "Что для вас важно при выборе?", type: "text", required: false },
          {
            text: "Как часто вы используете такие сервисы?",
            type: "single",
            required: false,
            options: [{ text: "Каждый день" }, { text: "Иногда" }, { text: "Редко" }]
          }
        ]
      }
    ]
  });

  await page.goto(`/create?surveyId=${surveyId}`);

  await expect(page.locator(".constructor-health summary")).toContainText("Проверка качества");
  await expect(page.locator("[data-health-action^='focus-question:']").first()).toBeVisible();
  await expect(page.locator(".constructor-health-reco__list li.is-error").first()).toBeVisible();

  await page.locator("#publishBtn").click();
  await expect(page.locator("#publishQualityOverlay")).toBeVisible();
  await expect(page.locator("#publishQualityTitle")).toContainText("Перед публикацией");
  await expect(page.locator("#publishAnywayBtn")).toBeVisible();
});
