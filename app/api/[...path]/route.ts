import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import officialChecks from "@/data/official-source-checks.json";
import {
  all,
  one,
  run,
  transaction,
  logAudit,
  defaultSettings,
  setupCode,
  rotateSetupCode,
} from "@/lib/db";
import {
  HttpError,
  identity,
  issue,
  revoke,
  originCheck,
  rateLimit,
  passwordHash,
  passwordMatches,
  constantEqual,
} from "@/lib/security";
import {
  skills,
  skillById,
  question,
  modules,
  type Skill,
} from "@/lib/content";
import {
  equivalent,
  mastery,
  writingFeedback,
  chooseSkill,
  weeklyPlan,
  type Evidence,
} from "@/lib/engine";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ path: string[] }> };
type Learner = {
  id: string;
  parent_id: string;
  nickname: string;
  grade: number;
  settings: string;
};
type Lesson = {
  id: string;
  learner_id: string;
  skill_id: string;
  mode: string;
  started_at: number;
  ended_at: number | null;
  current_variant: number;
  assisted: number;
  phase: string;
  question_started: number;
  plan: string;
};
const json = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
const string = z.string().trim();
const credentials = z
  .object({
    username: string
      .min(3)
      .max(40)
      .regex(/^[a-zA-Z0-9_.-]+$/),
    password: z.string().min(12).max(128),
  })
  .strict();
function learner(id: string, parentId?: string) {
  const l = parentId
    ? one<Learner>(
        "SELECT * FROM learner WHERE id=? AND parent_id=?",
        id,
        parentId,
      )
    : one<Learner>("SELECT * FROM learner WHERE id=?", id);
  if (!l) throw new HttpError(404, "Profile not found.");
  return l;
}
function events(learnerId: string, skillId?: string) {
  return all<{
    question_id: string;
    session_id: string;
    correct: number;
    assisted: number;
    created_at: number;
    transfer: number;
    repeated: number;
  }>(
    "SELECT * FROM learner_attempt WHERE learner_id=?" +
      (skillId ? " AND skill_id=?" : ""),
    learnerId,
    ...(skillId ? [skillId] : []),
  ).map(
    (e) =>
      ({
        questionId: e.question_id,
        sessionId: e.session_id,
        correct: !!e.correct,
        assisted: !!e.assisted,
        createdAt: e.created_at,
        transfer: !!e.transfer,
        repeated: !!e.repeated,
      }) satisfies Evidence,
  );
}
function progress(learnerId: string) {
  return skills.map((s) => {
    const e = events(learnerId, s.id);
    const schedule = one<{ next_review_due: number }>(
      "SELECT next_review_due FROM review_schedule WHERE learner_id=? AND outcome_id=?",
      learnerId,
      s.id,
    );
    return {
      skillId: s.id,
      ...mastery(e),
      due: schedule?.next_review_due || null,
    };
  });
}
function ownedLesson(id: string, learnerId: string) {
  const l = one<Lesson>(
    "SELECT * FROM lesson_session WHERE id=? AND learner_id=?",
    id,
    learnerId,
  );
  if (!l) throw new HttpError(404, "Lesson not found.");
  return l;
}
function publicQuestion(l: Lesson) {
  const s = skillById(l.skill_id)!;
  const q = question(s, l.current_variant);
  const { answer: _, explanation: __, ...visible } = q;
  void _;
  void __;
  // Rotate choices deterministically so the first choice is not always correct.
  if (visible.choices) {
    const off = l.current_variant % visible.choices.length;
    visible.choices = [
      ...visible.choices.slice(off),
      ...visible.choices.slice(0, off),
    ];
  }
  return {
    lessonId: l.id,
    skill: {
      id: s.id,
      grade: s.grade,
      module: s.module,
      domain: s.domain,
      topic: s.topic,
      objective: s.objective,
      lesson: s.lesson,
      example: s.example,
    },
    question: visible,
    turn: l.current_variant,
    phase: l.phase,
    startedAt: l.started_at,
    assisted: !!l.assisted,
    mode: l.mode,
    totalQuestions: JSON.parse(l.plan).length || null,
  };
}
async function body(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 20000)
    throw new HttpError(413, "This entry is too long.");
  const text = await request.text();
  if (text.length > 20000) throw new HttpError(413, "This entry is too long.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Please send a valid entry.");
  }
}
async function handle(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  const route = path.join("/");
  const method = request.method;
  if (method !== "GET") originCheck(request);
  if (route === "state" && method === "GET") {
    const hasParent = !!one("SELECT id FROM parent LIMIT 1");
    let who;
    try {
      who = identity(request);
    } catch {
      return json({ role: "public", needsSetup: !hasParent });
    }
    if (who.learner_id) {
      const l = learner(who.learner_id);
      const settings = JSON.parse(l.settings);
      const p = progress(l.id);
      const active = one<Lesson>(
        "SELECT * FROM lesson_session WHERE learner_id=? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
        l.id,
      );
      return json({
        role: "learner",
        learner: { id: l.id, nickname: l.nickname, grade: l.grade, settings },
        progress: p,
        active: active ? publicQuestion(active) : null,
        skills: skills
          .filter(
            (s) =>
              s.grade === l.grade ||
              s.grade === l.grade - 1 ||
              (settings.stretch && s.grade === l.grade + 1),
          )
          .map((s) => ({
            id: s.id,
            grade: s.grade,
            module: s.module,
            domain: s.domain,
            topic: s.topic,
            objective: s.objective,
          })),
        weeklyPlan: weeklyPlan(l.grade),
      });
    }
    const ls = all<Learner>(
      "SELECT * FROM learner WHERE parent_id=? ORDER BY grade",
      who.parent_id,
    );
    return json({
      role: "parent",
      learners: ls.map((l) => ({
        ...l,
        settings: JSON.parse(l.settings),
        progress: progress(l.id),
        writing: all(
          "SELECT id,draft_id,text,feedback,created_at FROM writing_revision WHERE learner_id=? ORDER BY created_at DESC LIMIT 30",
          l.id,
        ),
        sessions: all(
          "SELECT id,skill_id,mode,started_at,ended_at,summary FROM lesson_session WHERE learner_id=? ORDER BY started_at DESC LIMIT 30",
          l.id,
        ),
      })),
      skills: all<{ metadata: string }>(
        "SELECT metadata FROM curriculum_outcome",
      ).map((r) => JSON.parse(r.metadata)),
      sources: all<{ metadata: string }>(
        "SELECT metadata FROM curriculum_source",
      ).map((r) => JSON.parse(r.metadata)),
      conflicts: all<{ id: string; metadata: string; status: string }>(
        "SELECT * FROM curriculum_conflict",
      ).map((r) => ({ ...JSON.parse(r.metadata), status: r.status })),
      aiEnabled: false,
      officialChecks,
    });
  }
  if ((route === "setup" || route === "login") && method === "POST") {
    rateLimit("auth:" + route, 8, 60000);
    const b = await body(request);
    if (route === "setup") {
      const v = credentials
        .extend({ setupCode: z.string().min(1).max(200) })
        .parse(b);
      if (one("SELECT id FROM parent LIMIT 1"))
        throw new HttpError(409, "Family setup is already complete.");
      if (!constantEqual(v.setupCode, setupCode()))
        throw new HttpError(403, "The setup code is incorrect.");
      const parentId = randomUUID();
      transaction(() => {
        if (one("SELECT id FROM parent LIMIT 1"))
          throw new HttpError(409, "Family setup is already complete.");
        run(
          "INSERT INTO parent VALUES (?,?,?,?)",
          parentId,
          v.username,
          passwordHash(v.password),
          Date.now(),
        );
        for (const [grade, nickname] of [
          [2, "Explorer"],
          [5, "Challenger"],
        ] as const)
          run(
            "INSERT INTO learner VALUES (?,?,?,?,?)",
            randomUUID(),
            parentId,
            nickname,
            grade,
            JSON.stringify(defaultSettings(grade)),
          );
        logAudit(parentId, "family_created", {});
      });
      return issue(json({ ok: true }), parentId, null);
    }
    const v = credentials.parse(b);
    const p = one<{ id: string; password_hash: string }>(
      "SELECT id,password_hash FROM parent WHERE username=?",
      v.username,
    );
    const dummy = "00000000000000000000000000000000:" + "0".repeat(128);
    if (!passwordMatches(v.password, p?.password_hash || dummy) || !p)
      throw new HttpError(401, "The username or password is incorrect.");
    const res = issue(json({ ok: true }), p.id, null);
    revoke(request, res, "coach_child");
    return res;
  }
  if (route === "logout" && method === "POST") {
    const res = json({ ok: true });
    revoke(request, res, "coach_parent");
    revoke(request, res, "coach_child");
    return res;
  }
  if (route === "launch" && method === "POST") {
    const who = identity(request, "parent");
    const v = z
      .object({ learnerId: z.string().uuid() })
      .strict()
      .parse(await body(request));
    const l = learner(v.learnerId, who.parent_id);
    const res = issue(json({ ok: true }), who.parent_id, l.id);
    revoke(request, res, "coach_parent");
    return res;
  }
  if (route === "settings" && method === "POST") {
    const who = identity(request, "parent");
    const v = z
      .object({
        learnerId: z.string().uuid(),
        nickname: string.min(1).max(24),
        minutes: z.number().int().min(20).max(30),
        stretch: z.boolean(),
        exam: z.boolean(),
        quietHours: z.boolean(),
        entrancePath: z.enum(["broad", "ncee2026"]),
        weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
      })
      .strict()
      .parse(await body(request));
    const l = learner(v.learnerId, who.parent_id);
    if (l.grade === 2 && v.exam)
      throw new HttpError(
        400,
        "Entrance practice is only available for Challenger.",
      );
    run(
      "UPDATE learner SET nickname=?,settings=? WHERE id=?",
      v.nickname,
      JSON.stringify({ ...v, grade: l.grade }),
      l.id,
    );
    logAudit(who.parent_id, "settings_updated", { learnerId: l.id });
    return json({ ok: true });
  }
  if (route === "start" && method === "POST") {
    const who = identity(request, "learner");
    rateLimit("start:" + who.learner_id, 20);
    const l = learner(who.learner_id!);
    const settings = JSON.parse(l.settings);
    const v = z
      .object({
        module: z.enum(modules),
        mode: z.enum([
          "Learn",
          "Practise",
          "Challenge",
          "Revise",
          "Entrance Practice",
          "Diagnostic",
        ]),
        skillId: z.string().optional(),
      })
      .strict()
      .parse(await body(request));
    if (settings.quietHours)
      throw new HttpError(
        403,
        "Learning is paused. Ask your parent when to continue.",
      );
    if (v.mode === "Entrance Practice" && (l.grade !== 5 || !settings.exam))
      throw new HttpError(403, "Ask your parent to enable entrance practice.");
    if (
      v.mode === "Entrance Practice" &&
      settings.entrancePath === "ncee2026" &&
      v.module === "Non-Verbal Reasoning"
    )
      throw new HttpError(
        400,
        "Non-verbal reasoning is broad entrance enrichment, not a separate 2026 NCEE component.",
      );
    if (v.mode === "Challenge" && !settings.stretch)
      throw new HttpError(403, "Ask your parent to enable stretch practice.");
    const p = progress(l.id);
    const stats = Object.fromEntries(
      p.map((e) => [e.skillId, { state: e.state, due: e.due || undefined }]),
    );
    let s = v.skillId
      ? skillById(v.skillId)
      : chooseSkill(l.grade, v.module, settings.stretch, stats);
    if (
      !s ||
      s.module !== v.module ||
      s.grade < l.grade - 1 ||
      s.grade > l.grade + (settings.stretch ? 1 : 0)
    )
      throw new HttpError(
        403,
        "This topic is outside your current learning path.",
      );
    if (v.mode === "Challenge" && s.grade === l.grade) {
      const foundations = skills.filter(
        (x) =>
          x.grade === l.grade &&
          x.module === v.module &&
          x.domain !== "Composition",
      );
      if (foundations.every((x) => stats[x.id]?.state === "retained"))
        s =
          skills.find(
            (x) => x.grade === l.grade + 1 && x.module === v.module,
          ) || s;
    }
    if (s.grade > l.grade) {
      const ready = skills
        .filter(
          (x) =>
            x.grade === l.grade &&
            x.module === s!.module &&
            x.domain !== "Composition",
        )
        .every((x) => stats[x.id]?.state === "retained");
      if (!ready)
        throw new HttpError(
          403,
          "Build independent evidence on your current-grade topics before trying the next grade.",
        );
    }
    const coreSkills = skills.filter(
      (x) =>
        x.grade === l.grade &&
        x.module === v.module &&
        x.domain !== "Composition",
    );
    const repair = skills.find(
      (x) =>
        x.grade === l.grade - 1 &&
        x.module === v.module &&
        x.domain !== "Composition",
    );
    const plan =
      v.mode === "Diagnostic"
        ? Array.from(
            { length: 6 },
            (_, i) =>
              (i === 0 && repair && stats[repair.id]?.state === "learning"
                ? repair
                : coreSkills[i % coreSkills.length]
              ).id,
          )
        : [];
    if (plan.length) s = skillById(plan[0])!;
    const sid = randomUUID();
    const variant =
      v.mode === "Diagnostic"
        ? 0
        : Number(
            one<{ n: number }>(
              "SELECT COUNT(*) AS n FROM learner_attempt WHERE learner_id=? AND skill_id=?",
              l.id,
              s.id,
            )?.n || 0,
          );
    const now = Date.now();
    transaction(() => {
      run(
        "UPDATE lesson_session SET ended_at=?,summary='Stopped to begin another lesson' WHERE learner_id=? AND ended_at IS NULL",
        now,
        l.id,
      );
      run(
        "INSERT INTO lesson_session(id,learner_id,skill_id,mode,started_at,current_variant,question_started,plan) VALUES (?,?,?,?,?,?,?,?)",
        sid,
        l.id,
        s!.id,
        v.mode,
        now,
        variant,
        now,
        JSON.stringify(plan),
      );
    });
    return json(publicQuestion(ownedLesson(sid, l.id)));
  }
  if (route === "help" && method === "POST") {
    const who = identity(request, "learner");
    rateLimit("help:" + who.learner_id, 60);
    const v = z
      .object({
        lessonId: z.string().uuid(),
        kind: z.enum(["not-taught", "forgotten", "hint", "another"]),
      })
      .strict()
      .parse(await body(request));
    const lesson = ownedLesson(v.lessonId, who.learner_id!);
    if (lesson.ended_at) throw new HttpError(409, "This lesson has ended.");
    const s = skillById(lesson.skill_id)!;
    const q = question(s, lesson.current_variant);
    run(
      "INSERT INTO help_event VALUES (?,?,?,?,?,?)",
      randomUUID(),
      who.learner_id!,
      lesson.id,
      q.id,
      v.kind,
      Date.now(),
    );
    run(
      "UPDATE lesson_session SET assisted=1, phase='guided' WHERE id=?",
      lesson.id,
    );
    const content =
      v.kind === "not-taught"
        ? `${s.lesson}\n\nWorked example: ${s.example}\n\nTry the question with this support. We’ll follow it with a fresh independent question.`
        : v.kind === "forgotten"
          ? `${s.cue}\n\nQuick refresher: ${s.example}\n\nTry this check, then a fresh question.`
          : v.kind === "hint"
            ? s.hint
            : `${s.alternate}\n\nWorked example: ${s.example}`;
    return json({
      content,
      assisted: true,
      prerequisites: s.prerequisiteIds
        .map((id) => skillById(id))
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          topic: p!.topic,
          lesson: p!.lesson,
          example: p!.example,
        })),
    });
  }
  if (route === "answer" && method === "POST") {
    const who = identity(request, "learner");
    rateLimit("answer:" + who.learner_id, 120, 3600000);
    const v = z
      .object({
        lessonId: z.string().uuid(),
        questionId: string.max(120),
        turn: z.number().int().min(0),
        answer: string.min(1).max(1000),
      })
      .strict()
      .parse(await body(request));
    const l = ownedLesson(v.lessonId, who.learner_id!);
    if (l.ended_at) throw new HttpError(409, "This lesson has ended.");
    const s = skillById(l.skill_id)!;
    const q = question(s, l.current_variant);
    if (s.domain === "Composition")
      throw new HttpError(400, "Save writing as a draft for feedback.");
    if (q.id !== v.questionId || v.turn !== l.current_variant)
      throw new HttpError(409, "That question has already been answered.");
    const correct = equivalent(v.answer, q.answer);
    const assisted = !!l.assisted;
    const repeated = !!one(
      "SELECT id FROM learner_attempt WHERE learner_id=? AND question_id=? LIMIT 1",
      who.learner_id!,
      q.id,
    );
    const plan: string[] = JSON.parse(l.plan);
    let summary: string | undefined;
    transaction(() => {
      const fresh = ownedLesson(l.id, who.learner_id!);
      if (fresh.current_variant !== v.turn || fresh.ended_at)
        throw new HttpError(409, "That question has already been answered.");
      run(
        "INSERT INTO learner_attempt(id,learner_id,session_id,skill_id,question_id,response,answer_key,correct,assisted,transfer,created_at,elapsed_ms,repeated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        randomUUID(),
        who.learner_id!,
        l.id,
        s.id,
        q.id,
        v.answer,
        q.answer,
        Number(correct),
        Number(assisted),
        Number(q.transfer),
        Date.now(),
        Date.now() - l.question_started,
        Number(repeated),
      );
      const state = mastery(events(who.learner_id!, s.id));
      const days =
        state.state === "retained" ? 7 : state.state === "provisional" ? 3 : 1;
      run(
        "INSERT INTO review_schedule VALUES (?,?,?) ON CONFLICT(learner_id,outcome_id) DO UPDATE SET next_review_due=excluded.next_review_due",
        who.learner_id!,
        s.id,
        Date.now() + days * 86400000,
      );
      const nextTurn = l.current_variant + 1;
      if (plan.length && nextTurn >= plan.length) {
        summary =
          "Your six-question diagnostic is complete. We will use your attempts to choose topics for practice; this is a starting point, not a mastery certificate.";
        run(
          "UPDATE lesson_session SET ended_at=?,summary=? WHERE id=?",
          Date.now(),
          summary,
          l.id,
        );
      } else {
        if (plan.length && !correct) {
          const prerequisite = s.prerequisiteIds.find((id) => {
            const p = skillById(id);
            return p && p.grade >= learner(who.learner_id!).grade - 1;
          });
          if (prerequisite) plan[nextTurn] = prerequisite;
        }
        run(
          "UPDATE lesson_session SET current_variant=current_variant+1,skill_id=?,assisted=0,phase='independent',question_started=?,plan=? WHERE id=?",
          plan[nextTurn] || s.id,
          Date.now(),
          JSON.stringify(plan),
          l.id,
        );
      }
    });
    const message = !correct
      ? "Let’s look at the method together. Which step felt uncertain?"
      : assisted
        ? "You used support to work through this. Try a fresh question on your own next."
        : repeated
          ? "You revisited this question. This helps learning; we count fresh independent items separately."
          : "You worked that out independently. Keep explaining your steps!";
    return json({
      correct,
      assisted,
      repeated,
      summary,
      message,
      explanation: q.explanation,
      mastery: mastery(events(who.learner_id!, s.id)),
      next: summary ? null : publicQuestion(ownedLesson(l.id, who.learner_id!)),
    });
  }
  if (route === "finish" && method === "POST") {
    const who = identity(request, "learner");
    const v = z
      .object({ lessonId: z.string().uuid() })
      .strict()
      .parse(await body(request));
    const l = ownedLesson(v.lessonId, who.learner_id!);
    const p = mastery(
      events(who.learner_id!).filter((e) => e.sessionId === l.id),
    );
    const summary = `You practised ${skillById(l.skill_id)!.topic}. You completed ${p.attempts} questions, with ${p.independent} independent successes and ${p.assisted} successes with support. Next time, revisit one idea and explain your method.`;
    run(
      "UPDATE lesson_session SET ended_at=COALESCE(ended_at,?),summary=? WHERE id=?",
      Date.now(),
      summary,
      l.id,
    );
    return json({ summary });
  }
  if (route === "writing" && method === "POST") {
    const who = identity(request, "learner");
    rateLimit("writing:" + who.learner_id, 30, 3600000);
    const v = z
      .object({
        text: z.string().min(1).max(8000),
        draftId: z.string().uuid().optional(),
      })
      .strict()
      .parse(await body(request));
    const draftId = v.draftId || randomUUID();
    if (
      v.draftId &&
      !one(
        "SELECT id FROM writing_revision WHERE draft_id=? AND learner_id=?",
        v.draftId,
        who.learner_id!,
      )
    )
      throw new HttpError(404, "Draft not found.");
    const feedback = writingFeedback(v.text);
    run(
      "INSERT INTO writing_revision VALUES (?,?,?,?,?,?)",
      randomUUID(),
      who.learner_id!,
      draftId,
      v.text,
      JSON.stringify(feedback),
      Date.now(),
    );
    return json({ draftId, feedback });
  }
  if (route === "writing" && method === "GET") {
    const who = identity(request, "learner");
    return json({
      revisions: all(
        "SELECT id,draft_id,text,feedback,created_at FROM writing_revision WHERE learner_id=? ORDER BY created_at DESC LIMIT 30",
        who.learner_id!,
      ),
    });
  }
  if (route === "history" && method === "GET") {
    const who = identity(request, "parent");
    const id = request.nextUrl.searchParams.get("learnerId") || "";
    learner(id, who.parent_id);
    return json({
      attempts: all(
        "SELECT skill_id,question_id,response,correct,assisted,repeated,created_at,evaluator FROM learner_attempt WHERE learner_id=? ORDER BY created_at DESC LIMIT 100",
        id,
      ),
    });
  }
  if (route === "export" && method === "GET") {
    const who = identity(request, "parent");
    const id = request.nextUrl.searchParams.get("learnerId") || "";
    learner(id, who.parent_id);
    logAudit(who.parent_id, "progress_exported", { learnerId: id });
    const attempts = all(
      "SELECT skill_id,question_id,correct,assisted,repeated,created_at,evaluator FROM learner_attempt WHERE learner_id=?",
      id,
    );
    if (request.nextUrl.searchParams.get("format") === "csv") {
      const header =
        "skill_id,question_id,correct,assisted,repeated,created_at,evaluator";
      const rows = attempts as Record<string, string | number>[];
      return new NextResponse(
        [
          header,
          ...rows.map((r) =>
            [
              "skill_id",
              "question_id",
              "correct",
              "assisted",
              "repeated",
              "created_at",
              "evaluator",
            ]
              .map((k) => '"' + String(r[k]).replace(/"/g, '""') + '"')
              .join(","),
          ),
        ].join("\n"),
        {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="progress.csv"',
            "Cache-Control": "no-store",
          },
        },
      );
    }
    return json({
      profile: "anonymised",
      progress: progress(id),
      attempts,
      writing: all(
        "SELECT draft_id,text,feedback,created_at FROM writing_revision WHERE learner_id=?",
        id,
      ),
    });
  }
  if (route === "purge" && method === "POST") {
    const who = identity(request, "parent");
    const v = z
      .object({ learnerId: z.string().uuid(), confirm: z.literal("DELETE") })
      .strict()
      .parse(await body(request));
    learner(v.learnerId, who.parent_id);
    transaction(() => {
      for (const table of [
        "help_event",
        "learner_attempt",
        "lesson_session",
        "review_schedule",
        "writing_revision",
      ])
        run(`DELETE FROM ${table} WHERE learner_id=?`, v.learnerId);
      run("DELETE FROM auth_session WHERE learner_id=?", v.learnerId);
      run("DELETE FROM rate_limit WHERE key LIKE ?", "%" + v.learnerId);
      logAudit(who.parent_id, "learner_data_deleted", {
        learnerId: v.learnerId,
      });
    });
    return json({ ok: true });
  }
  if (route === "delete-family" && method === "POST") {
    const who = identity(request, "parent");
    rateLimit("delete-family:" + who.parent_id, 5);
    const v = z
      .object({
        password: z.string().min(1).max(128),
        confirm: z.literal("DELETE FAMILY"),
      })
      .strict()
      .parse(await body(request));
    const p = one<{ password_hash: string }>(
      "SELECT password_hash FROM parent WHERE id=?",
      who.parent_id,
    );
    if (!p || !passwordMatches(v.password, p.password_hash))
      throw new HttpError(403, "The password is incorrect.");
    transaction(() => {
      const ls = all<{ id: string }>(
        "SELECT id FROM learner WHERE parent_id=?",
        who.parent_id,
      );
      for (const l of ls) {
        for (const table of [
          "help_event",
          "learner_attempt",
          "lesson_session",
          "review_schedule",
          "writing_revision",
        ])
          run(`DELETE FROM ${table} WHERE learner_id=?`, l.id);
        run("DELETE FROM rate_limit WHERE key LIKE ?", "%" + l.id);
      }
      run("DELETE FROM auth_session WHERE parent_id=?", who.parent_id);
      run("DELETE FROM learner WHERE parent_id=?", who.parent_id);
      run("DELETE FROM audit_event WHERE parent_id=?", who.parent_id);
      run("DELETE FROM parent WHERE id=?", who.parent_id);
      run(
        "DELETE FROM rate_limit WHERE key=?",
        "delete-family:" + who.parent_id,
      );
    });
    rotateSetupCode();
    const res = json({ ok: true });
    revoke(request, res, "coach_parent");
    revoke(request, res, "coach_child");
    return res;
  }
  if (route === "curriculum" && method === "POST") {
    const who = identity(request, "parent");
    const v = z
      .object({
        skillId: string,
        term: z.number().int().min(1).max(3).nullable(),
        week: z.number().int().min(1).max(13).nullable(),
        note: string.min(5).max(500),
      })
      .strict()
      .parse(await body(request));
    const current = one<{ metadata: string }>(
      "SELECT metadata FROM curriculum_outcome WHERE id=?",
      v.skillId,
    );
    if (!current) throw new HttpError(404, "Topic not found.");
    const s = JSON.parse(current.metadata) as Skill;
    run(
      "UPDATE curriculum_outcome SET metadata=? WHERE id=?",
      JSON.stringify({ ...s, term: v.term, week: v.week }),
      s.id,
    );
    run(
      "UPDATE learning_sequence SET term=?,week=? WHERE outcome_id=?",
      v.term,
      v.week,
      s.id,
    );
    logAudit(who.parent_id, "curriculum_sequence_edited", v);
    return json({ ok: true });
  }
  if (route === "conflict" && method === "POST") {
    const who = identity(request, "parent");
    const v = z
      .object({
        id: string,
        status: z.enum(["open", "reviewed"]),
        note: string.min(5).max(500),
      })
      .strict()
      .parse(await body(request));
    if (!one("SELECT id FROM curriculum_conflict WHERE id=?", v.id))
      throw new HttpError(404, "Conflict not found.");
    run("UPDATE curriculum_conflict SET status=? WHERE id=?", v.status, v.id);
    logAudit(who.parent_id, "conflict_review", v);
    return json({ ok: true });
  }
  if (route === "ai" && method === "POST") {
    identity(request, "learner");
    if (process.env.UNDER13_AI_ENABLED === "true")
      throw new HttpError(
        503,
        "A provider and verified under-13 controls have not been configured. Local lessons remain available.",
      );
    throw new HttpError(
      403,
      "Child-to-AI requests are disabled. Local lessons remain available.",
    );
  }
  throw new HttpError(404, "This action is not available.");
}
async function route(request: NextRequest, context: Ctx) {
  try {
    return await handle(request, context);
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        {
          error: "Please check the fields and try again.",
          issues: error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        400,
      );
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    console.error(
      "Application request failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json(
      { error: "Something went wrong. Please ask a parent to try again." },
      500,
    );
  }
}
export { route as GET, route as POST };
