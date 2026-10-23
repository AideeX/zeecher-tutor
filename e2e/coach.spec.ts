import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
test.describe.configure({ mode: "serial" });
const origin = "http://127.0.0.1:3100";
const account = {
  username: "parent_test",
  password: randomBytes(24).toString("hex"),
};
const post = (request: APIRequestContext, path: string, data: unknown) =>
  request.post("/api/" + path, { data, headers: { origin } });
test("family setup, protected learner flow, assistance, writing and parent controls", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Let’s make room for learning." }),
  ).toBeVisible();
  await page.getByLabel("Parent username").fill(account.username);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByLabel("Private setup code").fill(process.env.TEST_BOOTSTRAP!);
  await page.getByRole("button", { name: "Create our learning space" }).click();
  await expect(
    page.getByRole("heading", { name: "Space to see them grow." }),
  ).toBeVisible();
  let state = await (await page.request.get("/api/state")).json();
  const explorer = state.learners.find((l: { grade: number }) => l.grade === 2);
  const challenger = state.learners.find(
    (l: { grade: number }) => l.grade === 5,
  );
  expect(explorer).toBeTruthy();
  expect(challenger).toBeTruthy();
  await page
    .getByRole("button", { name: "Open Explorer’s learning space" })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little curious." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("explorer-desktop.png"),
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  expect(
    (await page.request.get("/api/export?learnerId=" + challenger.id)).status(),
  ).toBe(401);
  expect(
    (
      await post(page.request, "start", {
        module: "Mathematics",
        mode: "Entrance Practice",
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(page.request, "start", {
        module: "Mathematics",
        mode: "Learn",
        skillId: "p5-number",
      })
    ).status(),
  ).toBe(403);
  expect(
    (await post(page.request, "ai", { text: "Child writing" })).status(),
  ).toBe(403);
  await page.getByRole("button", { name: /NUMBERS & POSSIBILITIES/ }).click();
  await expect(
    page.getByRole("heading", { name: /value of the leftmost digit/ }),
  ).toBeVisible();
  state = await (await page.request.get("/api/state")).json();
  let active = state.active;
  expect(active.question.answer).toBeUndefined();
  expect(active.question.explanation).toBeUndefined();
  await page.screenshot({
    path: testInfo.outputPath("maths-lesson.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "I haven’t learnt this yet" }).click();
  await expect(page.getByRole("status")).toContainText("Worked example");
  await page.getByLabel("Your answer", { exact: true }).fill("20");
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByRole("status")).toContainText("You used support");
  await page.getByRole("button", { name: "Try a fresh question" }).click();
  await page.getByRole("button", { name: "My learning", exact: true }).click();
  await page.getByRole("button", { name: "Continue my lesson" }).click();
  await page.getByLabel("Your answer", { exact: true }).fill("30");
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByRole("status")).toContainText("independently");
  await page.getByRole("button", { name: "Finish for today" }).click();
  await expect(
    page.getByRole("heading", { name: "Look how far you’ve come." }),
  ).toBeVisible();
  await expect(
    page.getByText(/1 independent successes and 1 successes with support/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to my learning" }).click();
  await page.getByRole("button", { name: "Try a writing adventure" }).click();
  await page
    .getByLabel("Your writing draft")
    .fill(
      "First I helped a friend carry a bag. Then we put it beside the door. I felt happy.",
    );
  await page.getByRole("button", { name: "Save & get revision ideas" }).click();
  await expect(
    page.getByRole("heading", { name: /Local checklist feedback/ }),
  ).toBeVisible();
  await page
    .getByLabel("Your writing draft")
    .fill(
      "First I helped a tired friend carry a heavy bag. Then we put it safely beside the door. Finally, we thanked each other.",
    );
  await page.getByRole("button", { name: "Save & get revision ideas" }).click();
  await expect(
    page.getByLabel("Saved writing revisions").locator("option"),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Close writing workspace" }).click();
  await page.getByRole("button", { name: "Parent space" }).click();
  await page.getByLabel("Parent username").fill(account.username);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Space to see them grow." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("parent-dashboard.png"),
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  state = await (await page.request.get("/api/state")).json();
  expect(
    state.learners.find((l: { grade: number }) => l.grade === 2).writing,
  ).toHaveLength(2);
  expect(
    state.learners.find((l: { grade: number }) => l.grade === 5).writing,
  ).toHaveLength(0);
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByLabel("Session length").fill("30");
  await page.getByRole("button", { name: "Save learning settings" }).click();
  await expect(page.getByLabel("Session length")).toHaveValue("30");
  const exported = await (
    await page.request.get("/api/export?learnerId=" + explorer.id)
  ).json();
  expect(exported.attempts).toHaveLength(2);
  expect(exported.writing).toHaveLength(2);
  expect(JSON.stringify(exported)).not.toContain(account.username);
  await page.getByLabel("Delete confirmation").fill("DELETE");
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith("/api/purge") && r.status() === 200,
    ),
    page
      .getByRole("button", { name: "Delete Explorer’s learning records" })
      .click(),
  ]);
  await expect(
    page.getByRole("button", { name: "Delete Explorer’s learning records" }),
  ).toBeDisabled();
  const after = await (
    await page.request.get("/api/export?learnerId=" + explorer.id)
  ).json();
  expect(after.attempts).toHaveLength(0);
  expect(after.writing).toHaveLength(0);
  await page.getByRole("tab", { name: "Sources" }).click();
  await expect(
    page.getByText("P2/P3 chapters: not present in this source."),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Curriculum" }).click();
  await page
    .getByLabel("Reason for edit")
    .first()
    .fill("Move to match our weekly plan");
  await page.getByLabel("Week", { exact: true }).first().fill("2");
  await page.getByRole("button", { name: "Save sequence" }).first().click();
  await expect(page.getByLabel("Week", { exact: true }).first()).toHaveValue(
    "2",
  );
  await page.getByLabel("Current learner").selectOption(challenger.id);
  await page
    .getByRole("button", { name: "Open Challenger’s learning space" })
    .click();
  await expect(page.getByText("Welcome back, Challenger.")).toBeVisible();
  await page.getByRole("button", { name: /SHAPES & DISCOVERY/ }).click();
  await expect(page.getByRole("img", { name: /Starting arrow/ })).toBeVisible();
  await page.getByRole("img", { name: "Option B: arrow points right" }).click();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByRole("status")).toContainText("independently");
  await page
    .getByRole("button", { name: "My learning", exact: true })
    .first()
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "A little curious." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("challenger-mobile.png"),
    fullPage: true,
  });
  // Unauthenticated and cross-origin writes are blocked.
  expect(
    (await request.get("/api/export?learnerId=" + explorer.id)).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/login", {
        data: account,
        headers: { origin: "https://unrelated.example" },
      })
    ).status(),
  ).toBe(403);
  active = (await (await page.request.get("/api/state")).json()).active;
  if (active) {
    const other = await post(page.request, "answer", {
      lessonId: randomBytes(16).toString("hex"),
      questionId: "x",
      turn: 0,
      answer: "x",
    });
    expect(other.status()).toBe(400);
  }
});
test("diagnostics, submission replay, next-grade gates and sibling lesson ownership", async ({
  request,
}) => {
  expect((await post(request, "login", account)).ok()).toBeTruthy();
  let state = await (await request.get("/api/state")).json();
  const ex = state.learners.find((l: { grade: number }) => l.grade === 2);
  const ch = state.learners.find((l: { grade: number }) => l.grade === 5);
  expect(
    (await post(request, "launch", { learnerId: ex.id })).ok(),
  ).toBeTruthy();
  let active = await (
    await post(request, "start", { module: "Mathematics", mode: "Diagnostic" })
  ).json();
  expect(active.totalQuestions).toBe(6);
  const explorerLesson = active.lessonId;
  for (let i = 0; i < 6; i++) {
    const { skillById, question } = await import("../lib/content");
    const key = question(skillById(active.skill.id)!, active.turn).answer;
    const payload = {
      lessonId: active.lessonId,
      questionId: active.question.id,
      turn: active.turn,
      answer: key,
    };
    const response = await post(request, "answer", payload);
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    if (i === 0)
      expect((await post(request, "answer", payload)).status()).toBe(409);
    if (i < 5) active = result.next;
    else {
      expect(result.next).toBeNull();
      expect(result.summary).toContain("six-question diagnostic");
    }
  }
  state = await (await request.get("/api/state")).json();
  expect(state.active).toBeNull();
  active = await (
    await post(request, "start", {
      module: "Mathematics",
      mode: "Practise",
      skillId: "p2-fraction",
    })
  ).json();
  expect(
    (
      await post(request, "help", {
        lessonId: active.lessonId,
        kind: "forgotten",
      })
    ).ok(),
  ).toBeTruthy();
  const alt = await (
    await post(request, "help", { lessonId: active.lessonId, kind: "another" })
  ).json();
  expect(alt.content).toContain("Draw a rectangle");
  expect((await post(request, "login", account)).ok()).toBeTruthy();
  const settings = {
    learnerId: ch.id,
    nickname: ch.nickname,
    minutes: 25,
    stretch: true,
    exam: true,
    quietHours: false,
    weekdays: [1, 2, 3, 4, 5],
    entrancePath: "ncee2026",
  };
  expect((await post(request, "settings", settings)).ok()).toBeTruthy();
  expect(
    (await post(request, "launch", { learnerId: ch.id })).ok(),
  ).toBeTruthy();
  expect(
    (
      await post(request, "start", {
        module: "Mathematics",
        mode: "Learn",
        skillId: "p6-number",
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(request, "start", {
        module: "Non-Verbal Reasoning",
        mode: "Entrance Practice",
      })
    ).status(),
  ).toBe(400);
  const exam = await (
    await post(request, "start", {
      module: "Mathematics",
      mode: "Entrance Practice",
    })
  ).json();
  expect(exam.mode).toBe("Entrance Practice");
  expect(
    (
      await post(request, "help", { lessonId: explorerLesson, kind: "hint" })
    ).status(),
  ).toBe(404);
  expect(
    (
      await post(request, "help", { lessonId: active.lessonId, kind: "hint" })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post("/api/answer", {
        data: {},
        headers: { origin: "https://unrelated.example" },
      })
    ).status(),
  ).toBe(403);
});

test("full family deletion removes profiles and requires fresh secure setup", async ({
  request,
}) => {
  expect((await post(request, "login", account)).ok()).toBeTruthy();
  expect(
    (
      await post(request, "delete-family", {
        password: account.password,
        confirm: "DELETE FAMILY",
      })
    ).ok(),
  ).toBeTruthy();
  const state = await (await request.get("/api/state")).json();
  expect(state.role).toBe("public");
  expect(state.needsSetup).toBe(true);
  expect((await post(request, "login", account)).status()).toBe(401);
});
