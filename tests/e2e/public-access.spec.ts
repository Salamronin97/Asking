import { expect, test } from "@playwright/test";

function uniq(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

async function registerUser(page: import("@playwright/test").Page) {
  const password = "SmokePass123!";
  for (let i = 0; i < 6; i += 1) {
    const email = `${uniq("public")}_${i}@example.com`;
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

async function createSurvey(page: import("@playwright/test").Page, payload: Record<string, unknown>) {
  const response = await page.request.post("/api/surveys", { data: payload });
  if (!response.ok()) throw new Error(`create survey failed: ${response.status()} ${await response.text()}`);
  const data = await response.json();
  return Number(data.id);
}

async function publishSurvey(page: import("@playwright/test").Page, surveyId: number) {
  const response = await page.request.post(`/api/surveys/${surveyId}/publish`);
  if (!response.ok()) throw new Error(`publish failed: ${response.status()} ${await response.text()}`);
}

test("public submit accepts modern question types without Invalid answers", async ({ page }) => {
  await registerUser(page);

  const surveyId = await createSurvey(page, {
    title: uniq("Public submit"),
    description: "public form test",
    pages: [
      {
        title: "Page 1",
        questions: [
          { text: "Name", type: "text", required: true },
          { text: "Rate", type: "rating", required: true },
          {
            text: "One",
            type: "single",
            required: true,
            options: [{ text: "A" }, { text: "B" }]
          },
          {
            text: "Many",
            type: "multiple",
            required: true,
            options: [{ text: "X" }, { text: "Y" }, { text: "Z" }]
          },
          {
            text: "Select",
            type: "select",
            required: true,
            options: [{ text: "First" }, { text: "Second" }]
          }
        ]
      }
    ]
  });
  await publishSurvey(page, surveyId);

  await page.goto(`/s/${surveyId}`);
  await page.locator("textarea[name^='q_']").fill("John");
  await page.locator("select[name^='q_']").first().selectOption("5");
  await page.locator("input[type='radio'][value='A']").check();
  await page.locator("input[type='checkbox'][value='X']").check();
  await page.locator("input[type='checkbox'][value='Y']").check();
  await page.locator("select[name^='q_']").nth(1).selectOption("Second");
  await page.getByRole("button", { name: "Отправить" }).click();

  await expect(page.locator(".public-survey-card .status")).toContainText("Ответ успешно отправлен.");

  await expect
    .poll(async () => {
      const res = await page.request.get(`/api/surveys/${surveyId}/results`);
      return res.status();
    })
    .toBe(200);
});

test("public survey enforces password and response limit", async ({ browser, page }) => {
  await registerUser(page);

  const surveyId = await createSurvey(page, {
    title: uniq("Protected"),
    description: "password limit test",
    pages: [
      {
        title: "Page 1",
        questions: [{ text: "Comment", type: "text", required: true }]
      }
    ]
  });

  let response = await page.request.put(`/api/surveys/${surveyId}/access`, {
    data: { passwordEnabled: true, password: "12345", responseLimit: 1 }
  });
  expect(response.ok()).toBeTruthy();

  await publishSurvey(page, surveyId);

  const detailsResponse = await page.request.get(`/api/public/surveys/${surveyId}`);
  const details = await detailsResponse.json();
  const questionId = Number(details.questions?.[0]?.id);
  expect(Number.isInteger(questionId)).toBeTruthy();

  response = await page.request.post(`/api/surveys/${surveyId}/respond`, {
    data: { answers: [{ questionId, value: "test" }], password: "bad" }
  });
  expect(response.status()).toBe(403);

  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
  const publicPage = await context.newPage();
  await publicPage.goto(`/s/${surveyId}`);
  await publicPage.locator("input[name='surveyAccessPassword']").fill("12345");
  await publicPage.locator("textarea[name^='q_']").fill("First answer");
  await publicPage.getByRole("button", { name: "Отправить" }).click();
  await expect(publicPage.locator(".public-survey-card .status")).toContainText("Ответ успешно отправлен.");

  const secondResponse = await page.request.post(`/api/surveys/${surveyId}/respond`, {
    data: { answers: [{ questionId, value: "second" }], password: "12345" }
  });
  expect(secondResponse.status()).toBe(403);
  expect(await secondResponse.text()).toContain("Response limit reached");

  await context.close();
});

test("uploaded image path is kept in page design and public payload", async ({ page }) => {
  await registerUser(page);

  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn6s9UAAAAASUVORK5CYII=";
  const uploadResponse = await page.request.post("/api/uploads/image", {
    multipart: {
      file: {
        name: "tiny.png",
        mimeType: "image/png",
        buffer: Buffer.from(pngBase64, "base64")
      }
    }
  });
  expect(uploadResponse.ok()).toBeTruthy();
  const uploadData = await uploadResponse.json();
  expect(String(uploadData.path || "")).toMatch(/^\/uploads\/.+\.png$/);

  const surveyId = await createSurvey(page, {
    title: uniq("Bg upload"),
    description: "bg upload",
    pages: [
      {
        title: "Page 1",
        design: { bgColor: "#ffffff", bgImage: uploadData.path, layout: "full", overlay: 0 },
        questions: [{ text: "Question", type: "text", required: false }]
      }
    ]
  });

  const surveyResponse = await page.request.get(`/api/surveys/${surveyId}`);
  const surveyData = await surveyResponse.json();
  expect(surveyData.pages[0].design.bgImage).toBe(uploadData.path);

  await publishSurvey(page, surveyId);
  const publicResponse = await page.request.get(`/api/public/surveys/${surveyId}`);
  const publicData = await publicResponse.json();
  expect(publicData.pages[0].design.bgImage).toBe(uploadData.path);
});

test("public survey keeps legacy logic jumps and opens on mobile", async ({ browser, page }) => {
  await registerUser(page);

  const surveyId = await createSurvey(page, {
    title: uniq("Legacy jump"),
    description: "legacy page index compatibility",
    pages: [
      {
        title: "Page 1",
        questions: [
          {
            text: "Route",
            type: "single",
            required: true,
            logicEnabled: true,
            options: [{ text: "Skip", jumpToPageIndex: 4 }, { text: "Regular" }]
          }
        ]
      },
      {
        title: "Page 2",
        questions: [{ text: "Middle question", type: "text", required: true }]
      },
      {
        title: "Page 3",
        questions: []
      },
      {
        title: "Page 4",
        questions: [{ text: "Final question", type: "text", required: true }]
      }
    ]
  });
  await publishSurvey(page, surveyId);

  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  });
  const mobilePage = await context.newPage();

  await mobilePage.goto(`/s/${surveyId}`);
  await expect(mobilePage.locator(".public-survey-head")).toContainText("Legacy jump");
  await mobilePage.locator("input[type='radio'][value='Skip']").check();
  await mobilePage.locator(".action-row .btn--primary").first().click();

  const visiblePane = mobilePage.locator(".wizard-pane:not([hidden])");
  await expect(visiblePane).toContainText("Final question");
  await expect(visiblePane).not.toContainText("Middle question");
  await visiblePane.locator("textarea[name^='q_']").fill("done");
  await mobilePage.locator("button[type='submit']").click();
  await expect(mobilePage.locator(".public-survey-card .status")).toContainText("Ответ успешно отправлен.");

  await context.close();
});

test("public survey ignores legacy zero jump and continues to the next page", async ({ browser, page }) => {
  await registerUser(page);

  const surveyId = await createSurvey(page, {
    title: uniq("Legacy zero jump"),
    description: "zero jump compatibility",
    pages: [
      {
        title: "Page 1",
        questions: [{ text: "Intro", type: "text", required: true }]
      },
      {
        title: "Page 2",
        questions: [
          {
            text: "Pick one",
            type: "single",
            required: true,
            logicEnabled: true,
            options: [{ text: "A", jumpToPageIndex: 0 }, { text: "B", jumpToPageIndex: 0 }]
          }
        ]
      },
      {
        title: "Page 3",
        questions: [{ text: "Final note", type: "text", required: true }]
      }
    ]
  });
  await publishSurvey(page, surveyId);

  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3100", viewport: { width: 393, height: 852 } });
  const mobilePage = await context.newPage();

  await mobilePage.goto(`/s/${surveyId}`);
  await mobilePage.locator(".wizard-pane:not([hidden]) textarea[name^='q_']").fill("start");
  await mobilePage.locator(".action-row .btn--primary").first().click();
  await mobilePage.locator(".wizard-pane:not([hidden]) input[type='radio'][value='A']").check();
  await mobilePage.locator(".action-row .btn--primary").first().click();

  const visiblePane = mobilePage.locator(".wizard-pane:not([hidden])");
  await expect(visiblePane).toContainText("Final note");

  await context.close();
});
