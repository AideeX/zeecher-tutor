"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Garden, Arrow, Icon } from "./Art";
import { modules, type Module, type Skill } from "@/lib/content";

type Stats = {
  skillId: string;
  attempts: number;
  independent: number;
  assisted: number;
  distinct: number;
  sessions: number;
  state: string;
  due: number | null;
};
type Settings = {
  minutes: number;
  stretch: boolean;
  exam: boolean;
  quietHours: boolean;
  weekdays: number[];
  entrancePath: "broad" | "ncee2026";
};
type Profile = {
  id: string;
  nickname: string;
  grade: number;
  settings: Settings;
  progress: Stats[];
  writing: Revision[];
  sessions: {
    id: string;
    skill_id: string;
    mode: string;
    started_at: number;
    ended_at: number | null;
    summary: string | null;
  }[];
};
type Revision = {
  id: string;
  draft_id: string;
  text: string;
  feedback: string;
  created_at: number;
};
type Feedback = {
  label: string;
  words: number;
  items: { area: string; note: string }[];
};
type Lesson = {
  lessonId: string;
  skill: Pick<
    Skill,
    | "id"
    | "grade"
    | "module"
    | "domain"
    | "topic"
    | "objective"
    | "lesson"
    | "example"
  >;
  question: {
    id: string;
    prompt: string;
    choices?: string[];
    passage?: string;
    diagram?: { turn: number; options: number[] };
  };
  turn: number;
  phase: string;
  startedAt: number;
  assisted: boolean;
  mode: string;
  totalQuestions: number | null;
};
type Source = {
  id: string;
  filename: string;
  pages: number;
  authority_tier: string;
  review_status: string;
};
type Conflict = {
  id: string;
  description: string;
  resolution: string;
  status: string;
  sources: { id: string; page: number }[];
};
type State = {
  role: "public" | "parent" | "learner";
  needsSetup?: boolean;
  learner?: Profile;
  learners?: Profile[];
  skills?: Skill[];
  progress?: Stats[];
  active?: Lesson | null;
  weeklyPlan?: string[];
  sources?: Source[];
  conflicts?: Conflict[];
  officialChecks?: {
    id: string;
    url: string;
    status: string;
    checked_at: string;
    error?: string;
  }[];
};
async function api<T>(path: string, data?: unknown): Promise<T> {
  const res = await fetch("/api/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const value = await res.json();
  if (!res.ok) throw new Error(value.error || "Please try again.");
  return value;
}
const descriptions: Record<Module, string> = {
  Mathematics: "Make numbers make sense.",
  English: "Read, imagine and find your voice.",
  "Verbal Reasoning": "Discover the connections in words.",
  "Quantitative Reasoning": "A little pattern. A big discovery.",
  "General Paper": "Explore science and the world.",
  "Non-Verbal Reasoning": "See things from a new angle.",
};
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export default function Coach() {
  const [state, setState] = useState<State | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [screen, setScreen] = useState("home"),
    [parentLogin, setParentLogin] = useState(false),
    [lesson, setLesson] = useState<Lesson | null>(null),
    [recap, setRecap] = useState(""),
    [mode, setMode] = useState("Learn");
  const refresh = useCallback(async () => {
    const s = await api<State>("state");
    setState(s);
    return s;
  }, []);
  useEffect(() => {
    let live = true;
    api<State>("state")
      .then((s) => {
        if (live) {
          setState(s);
          if (s.active) setLesson(s.active);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function start(module: Module, skillId?: string, requestedMode = mode) {
    await action(async () => {
      const next = await api<Lesson>("start", {
        module,
        mode: requestedMode,
        ...(skillId ? { skillId } : {}),
      });
      setLesson(next);
      setRecap("");
      setScreen("lesson");
    });
  }
  function navigate(nextScreen: string) {
    void action(async () => {
      const s = await refresh();
      setLesson(s.active || null);
      setScreen(nextScreen);
    });
  }
  const l = state?.learner;
  const stats = state?.progress || [];
  const weekday = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "Africa/Lagos",
  });
  const plannedModule = (state?.weeklyPlan?.[(days.indexOf(weekday) + 6) % 7] ||
    "Mathematics") as Module;
  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Lagos",
  });
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header className="topbar">
        <Link
          href="/"
          className="brand"
          aria-label="Learning Coach Nigeria home"
        >
          <span className="brand-icon">✳</span>
          <span>
            learning coach<span className="brand-sub">NIGERIA</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {state?.role === "learner" && !parentLogin && (
            <>
              <button
                className={screen === "home" ? "nav-active" : ""}
                onClick={() => navigate("home")}
              >
                My learning
              </button>
              <button
                className={screen === "map" ? "nav-active" : ""}
                onClick={() => navigate("map")}
              >
                My path
              </button>
              <button
                className={screen === "plan" ? "nav-active" : ""}
                onClick={() => navigate("plan")}
              >
                Weekly plan
              </button>
            </>
          )}
          <button
            onClick={() => {
              setParentLogin(true);
              setScreen("parent");
            }}
          >
            Parent space <span aria-hidden="true">→</span>
          </button>
          {state?.role === "parent" && (
            <button
              onClick={() =>
                action(async () => {
                  await api("logout", {});
                  await refresh();
                  setParentLogin(false);
                })
              }
            >
              Sign out
            </button>
          )}
        </nav>
      </header>
      <main id="main" className="shell">
        {error && (
          <div className="error" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        {!state ? (
          <div className="loading">Getting your learning space ready…</div>
        ) : state.role === "public" ||
          (parentLogin && state.role !== "parent") ? (
          <Auth
            setup={!!state.needsSetup}
            busy={busy}
            onCancel={
              state.role === "learner" ? () => setParentLogin(false) : undefined
            }
            onSubmit={(values) =>
              action(async () => {
                await api(state.needsSetup ? "setup" : "login", values);
                await refresh();
                setParentLogin(false);
                setScreen("parent");
              })
            }
          />
        ) : state.role === "parent" ? (
          <Parent
            state={state}
            busy={busy}
            onLaunch={(id) =>
              action(async () => {
                await api("launch", { learnerId: id });
                const s = await refresh();
                setLesson(s.active || null);
                setScreen("home");
                setMode("Learn");
                setParentLogin(false);
              })
            }
            onMutation={(path, data) =>
              action(async () => {
                await api(path, data);
                await refresh();
              })
            }
          />
        ) : (
          l && (
            <>
              <div className="learner-strip">
                <span>
                  <span className="avatar small">
                    {l.grade === 2 ? "E" : "C"}
                  </span>
                  {l.nickname} <span className="dot">·</span> Primary {l.grade}
                </span>
                <span className="local-badge">
                  <span /> Local learning · AI chat off
                </span>
              </div>
              {screen === "lesson" && lesson ? (
                <LessonView
                  key={lesson.lessonId}
                  initial={lesson}
                  minutes={l.settings.minutes}
                  busy={busy}
                  action={action}
                  onFinish={(summary) => {
                    setRecap(summary);
                    setLesson(null);
                    setScreen("recap");
                    void refresh();
                  }}
                  onHome={() =>
                    void action(async () => {
                      const s = await refresh();
                      setLesson(s.active || null);
                      setScreen("home");
                    })
                  }
                  onAdvance={setLesson}
                />
              ) : screen === "recap" ? (
                <section className="recap panel">
                  <span className="eyebrow">A LITTLE PROGRESS, EVERY DAY</span>
                  <span className="big-spark">✳</span>
                  <h1>Look how far you’ve come.</h1>
                  <p>{recap}</p>
                  <button className="primary" onClick={() => setScreen("home")}>
                    Back to my learning →
                  </button>
                </section>
              ) : screen === "map" ? (
                <section>
                  <div className="page-heading">
                    <span className="eyebrow">YOUR LEARNING JOURNEY</span>
                    <h1>Small steps. Strong foundations.</h1>
                    <p>
                      Your current grade comes first. Earlier topics help fill
                      gaps.
                    </p>
                  </div>
                  <div className="path-grid">
                    {[
                      l.grade - 1,
                      l.grade,
                      ...(l.settings.stretch ? [l.grade + 1] : []),
                    ].map((grade) => (
                      <section className="panel path-column" key={grade}>
                        <span className="tag">
                          {grade === l.grade
                            ? "MY CORE"
                            : grade < l.grade
                              ? "FOUNDATION REPAIR"
                              : "STRETCH WHEN READY"}
                        </span>
                        <h2>Primary {grade}</h2>
                        {state.skills
                          ?.filter((s) => s.grade === grade)
                          .map((s) => (
                            <button
                              key={s.id}
                              className="path-item"
                              disabled={busy}
                              onClick={() => {
                                setMode("Learn");
                                void start(s.module, s.id, "Learn");
                              }}
                            >
                              <Icon name={s.module} />
                              <span>
                                <strong>{s.topic}</strong>
                                <small>
                                  {s.module} ·{" "}
                                  {stats.find((p) => p.skillId === s.id)
                                    ?.state || "untouched"}
                                </small>
                              </span>
                              <span>→</span>
                            </button>
                          ))}
                      </section>
                    ))}
                  </div>
                </section>
              ) : screen === "plan" ? (
                <section>
                  <div className="page-heading">
                    <span className="eyebrow">
                      A LITTLE RHYTHM FOR YOUR WEEK
                    </span>
                    <h1>Room for every kind of curious.</h1>
                    <p>
                      One main subject at a time. Reading, maths and science all
                      have a place.
                    </p>
                  </div>
                  <div className="week-grid">
                    {state.weeklyPlan?.map((m, i) => (
                      <button
                        disabled={busy}
                        className="panel day-card"
                        key={i}
                        onClick={() => start(m as Module)}
                      >
                        <span className="eyebrow">
                          {
                            [
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                              "SUNDAY",
                            ][i]
                          }
                        </span>
                        <Icon name={m} />
                        <h3>{m}</h3>
                        <p>
                          {l.settings.weekdays.includes((i + 1) % 7)
                            ? `${l.settings.minutes} minutes · Planned`
                            : "Optional exploration"}
                        </p>
                        <span>Let’s explore →</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <>
                  <div className="page-heading home-heading">
                    <div>
                      <span className="eyebrow">{today.toUpperCase()}</span>
                      <h1>
                        A little curious.
                        <br />
                        <em>A lot of possibility.</em>
                      </h1>
                      <p>
                        Welcome back, {l.nickname}. What will you discover
                        today?
                      </p>
                    </div>
                    <div className="sticker">
                      <span>ONE STEP</span>
                      <strong>at a time</strong>
                      <span>IS STILL PROGRESS</span>
                    </div>
                  </div>
                  <div className="hero-grid">
                    <section className="hero panel">
                      <div className="hero-copy">
                        <span className="tag">TODAY’S SMALL ADVENTURE</span>
                        <h2>
                          {l.settings.quietHours
                            ? "Time for a little pause."
                            : lesson
                              ? "Pick up where you left off."
                              : `Let’s grow your ${plannedModule === "Mathematics" ? "number confidence" : plannedModule === "English" ? "reading confidence" : plannedModule === "General Paper" ? "science curiosity" : "reasoning skills"}.`}
                        </h2>
                        <p>
                          {l.settings.quietHours
                            ? "Your parent has paused lessons. You can return when learning is unpaused."
                            : lesson
                              ? lesson.skill.topic
                              : "A clear idea, a little practice, and that lovely “I get it!” moment."}
                        </p>
                        <div className="hero-meta">
                          <span>◷ {l.settings.minutes} minutes</span>
                          <span>✧ At your pace</span>
                        </div>
                        <button
                          className="primary"
                          disabled={busy || l.settings.quietHours}
                          onClick={() =>
                            lesson ? setScreen("lesson") : start(plannedModule)
                          }
                        >
                          {lesson
                            ? "Continue my lesson"
                            : "Start today’s lesson"}{" "}
                          <span>→</span>
                        </button>
                      </div>
                      <Garden />
                    </section>
                    <aside className="progress-note panel">
                      <span className="eyebrow">YOUR EFFORT MATTERS</span>
                      <span className="note-spark">✳</span>
                      <h3>
                        Understanding
                        <br />
                        takes practice.
                      </h3>
                      <p>
                        {stats.reduce((a, s) => a + s.independent, 0)}{" "}
                        independent successes
                        <br />
                        {stats.reduce((a, s) => a + s.assisted, 0)} successes
                        with support
                      </p>
                      <span className="handwritten">Both help you grow.</span>
                    </aside>
                  </div>
                  <div className="section-heading">
                    <div>
                      <h2>Follow your curiosity</h2>
                      <p>Choose a subject and make it your own.</p>
                    </div>
                    <label className="mode-label">
                      Learning mode
                      <select
                        aria-label="Learning mode"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                      >
                        {[
                          "Learn",
                          "Practise",
                          "Revise",
                          "Diagnostic",
                          ...(l.settings.stretch ? ["Challenge"] : []),
                          ...(l.grade === 5 && l.settings.exam
                            ? ["Entrance Practice"]
                            : []),
                        ].map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="subject-grid">
                    {modules.map((m, i) => {
                      const ps = stats.filter(
                        (p) =>
                          state.skills?.find((s) => s.id === p.skillId)
                            ?.module === m,
                      );
                      return (
                        <button
                          className={`subject-card tone-${i}`}
                          key={m}
                          disabled={busy || l.settings.quietHours}
                          onClick={() => start(m)}
                        >
                          <span className="subject-icon">
                            <Icon name={m} />
                          </span>
                          <span className="subject-topline">
                            {
                              [
                                "NUMBERS & POSSIBILITIES",
                                "READING & EXPRESSION",
                                "WORDS & CONNECTIONS",
                                "PATTERNS & PUZZLES",
                                "SCIENCE & OUR WORLD",
                                "SHAPES & DISCOVERY",
                              ][i]
                            }
                          </span>
                          <h3>{m}</h3>
                          <p>{descriptions[m]}</p>
                          <div className="subject-bottom">
                            <span>
                              {ps.some((p) => p.attempts)
                                ? `${ps.reduce((a, p) => a + p.attempts, 0)} practice attempts`
                                : "A new discovery awaits"}
                              {[2, 3, 5].includes(i) && (
                                <small>Entrance enrichment</small>
                              )}
                              {i === 4 && (
                                <small>Basic Science tracked separately</small>
                              )}
                            </span>
                            <span className="round-arrow">→</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <section className="bottom-note">
                    <span>✦</span>
                    <p>
                      It’s always okay to say{" "}
                      <strong>“I haven’t learnt this yet.”</strong>
                      <br />
                      <small>
                        We’ll take a step back and work it out together.
                      </small>
                    </p>
                    <button
                      className="text-button"
                      onClick={() => {
                        setScreen("writing");
                      }}
                    >
                      Try a writing adventure →
                    </button>
                  </section>
                  {screen === "writing" && (
                    <Writing
                      busy={busy}
                      action={action}
                      onClose={() => setScreen("home")}
                    />
                  )}
                </>
              )}
            </>
          )
        )}
      </main>
      <footer className="footer">
        <span>Made for growing minds. Rooted in Nigeria.</span>
        <span>
          This learning assistant can make mistakes. Ask a parent or teacher if
          something seems confusing.
        </span>
        <span>Slow progress is still progress. ✳</span>
      </footer>
    </>
  );
}
function Auth({
  setup,
  busy,
  onSubmit,
  onCancel,
}: {
  setup: boolean;
  busy: boolean;
  onSubmit: (v: unknown) => void;
  onCancel?: () => void;
}) {
  return (
    <div className="auth-grid">
      <section className="auth-story">
        <span className="eyebrow">A SPACE TO LEARN. ROOM TO GROW.</span>
        <h1>
          Big discoveries.
          <br />
          <em>Little by little.</em>
        </h1>
        <p>
          A personal learning journey for two curious minds, with gentle
          guidance and progress you can understand.
        </p>
        <Garden />
        <div className="auth-pills">
          <span>Primary 2 + Primary 5</span>
          <span>25-minute adventures</span>
          <span>Private by design</span>
        </div>
      </section>
      <section className="panel auth-form">
        <span className="tag">PARENT SPACE</span>
        <h2>{setup ? "Let’s make room for learning." : "Welcome back."}</h2>
        <p>
          {setup
            ? "Create your parent account to prepare Explorer and Challenger’s learning space."
            : "Sign in to manage your family and open a child’s learning space."}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onSubmit({
              username: f.get("username"),
              password: f.get("password"),
              ...(setup ? { setupCode: f.get("setupCode") } : {}),
            });
          }}
        >
          <label>
            Parent username
            <input
              name="username"
              autoComplete="username"
              minLength={3}
              maxLength={40}
              pattern="[a-zA-Z0-9_.\-]+"
              required
              placeholder="Choose a username"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={setup ? "new-password" : "current-password"}
              minLength={12}
              maxLength={128}
              required
              placeholder="At least 12 characters"
            />
          </label>
          {setup && (
            <label>
              Private setup code
              <input
                name="setupCode"
                type="password"
                required
                autoComplete="off"
              />
              <small>
                Stored in <code>.local/setup-code</code> after running{" "}
                <code>npm run setup</code>. Enter it privately here.
              </small>
            </label>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "One moment…"
              : setup
                ? "Create our learning space →"
                : "Sign in →"}
          </button>
        </form>
        {onCancel && (
          <button className="text-button" onClick={onCancel}>
            Return to my lesson
          </button>
        )}
        <div className="privacy-note">
          <span>⌑</span>
          <p>
            Child answers and writing stay in this app’s local database.
            External AI chat is disabled.
          </p>
        </div>
      </section>
    </div>
  );
}
function LessonView({
  initial,
  minutes,
  busy,
  action,
  onFinish,
  onHome,
  onAdvance,
}: {
  initial: Lesson;
  minutes: number;
  busy: boolean;
  action: (f: () => Promise<void>) => Promise<void>;
  onFinish: (summary: string) => void;
  onHome: () => void;
  onAdvance: (l: Lesson) => void;
}) {
  const [lesson, setLesson] = useState(initial),
    [answer, setAnswer] = useState(""),
    [help, setHelp] = useState(""),
    [feedback, setFeedback] = useState<{
      correct: boolean;
      message: string;
      explanation: string;
      next: Lesson | null;
      summary?: string;
    } | null>(null),
    [paused, setPaused] = useState(false),
    [remaining, setRemaining] = useState(() =>
      Math.max(
        0,
        minutes * 60 - Math.floor((Date.now() - initial.startedAt) / 1000),
      ),
    ),
    [method, setMethod] = useState("");
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(
      () => setRemaining((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [paused]);
  const seconds = remaining;
  const q = lesson.question;
  const dirs = ["up", "right", "down", "left"];
  return (
    <section className="lesson-layout">
      <div className="lesson-top">
        <button className="text-button" onClick={onHome}>
          ← My learning
        </button>
        <span className="tag">
          {lesson.mode.toUpperCase()} · PRIMARY {lesson.skill.grade}
        </span>
        <button
          className="timer"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
        >
          {paused ? "▶" : "Ⅱ"} {Math.floor(seconds / 60)}:
          {String(seconds % 60).padStart(2, "0")}{" "}
          <small>{paused ? "Paused" : "Take a break"}</small>
        </button>
      </div>
      {lesson.mode === "Entrance Practice" && (
        <div className="notice">
          Original entrance enrichment. These are practice questions, not
          official past papers or a complete exam simulation.
        </div>
      )}
      {seconds === 0 && (
        <div className="notice">
          Our planned time is up. Finish your thought, then wrap up when you’re
          ready.
        </div>
      )}
      <div className="lesson-columns">
        <aside className="lesson-sidebar">
          <span className="eyebrow">TODAY’S DISCOVERY</span>
          <Icon name={lesson.skill.module} />
          <h2>{lesson.skill.topic}</h2>
          <p>{lesson.skill.objective}</p>
          <span className="local-badge">
            {lesson.assisted || help
              ? "Guided practice"
              : "Independent practice"}
          </span>
          <div className="lesson-steps">
            <span>1. Remember</span>
            <span>2. Explore an idea</span>
            <strong>3. Try it out</strong>
            <span>4. Reflect & review</span>
          </div>
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              action(async () => {
                const r = await api<{ summary: string }>("finish", {
                  lessonId: lesson.lessonId,
                });
                onFinish(r.summary);
              })
            }
          >
            Finish for today →
          </button>
        </aside>
        <div>
          <section className="panel question-card">
            <div className="question-label">
              <span className="eyebrow">
                {lesson.skill.module.toUpperCase()}
              </span>
              <span>
                {lesson.totalQuestions
                  ? `Diagnostic ${lesson.turn + 1} of ${lesson.totalQuestions}`
                  : "One question at a time"}
              </span>
            </div>
            {lesson.mode === "Learn" && (
              <details className="mini-lesson" open={lesson.turn === 0}>
                <summary>A little idea to start</summary>
                <p>{lesson.skill.lesson}</p>
                <p className="example">{lesson.skill.example}</p>
              </details>
            )}
            {q.passage && (
              <blockquote className="passage">{q.passage}</blockquote>
            )}
            <h2>{q.prompt}</h2>
            {q.diagram && (
              <div className="diagram-source">
                <Arrow
                  turn={q.diagram.turn}
                  label={`Starting arrow points ${dirs[q.diagram.turn]}`}
                />
                <span>One quarter-turn clockwise ↷</span>
              </div>
            )}
            {lesson.skill.domain === "Composition" ? (
              <Writing busy={busy} action={action} />
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    const r = await api<{
                      correct: boolean;
                      message: string;
                      explanation: string;
                      next: Lesson | null;
                      summary?: string;
                    }>("answer", {
                      lessonId: lesson.lessonId,
                      questionId: q.id,
                      turn: lesson.turn,
                      answer,
                    });
                    setFeedback(r);
                    if (r.next) onAdvance(r.next);
                    setHelp("");
                  });
                }}
              >
                {q.choices ? (
                  <fieldset className="choices" disabled={!!feedback || busy}>
                    <legend className="sr-only">Choose your answer</legend>
                    {q.choices.map((c, i) => (
                      <label
                        key={c}
                        className={answer === c ? "choice selected" : "choice"}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={c}
                          checked={answer === c}
                          onChange={() => setAnswer(c)}
                          required
                        />
                        <span className="choice-letter">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {c}
                      </label>
                    ))}
                  </fieldset>
                ) : q.diagram ? (
                  <fieldset
                    className="diagram-choices"
                    disabled={!!feedback || busy}
                  >
                    <legend className="sr-only">
                      Choose the rotated arrow
                    </legend>
                    {q.diagram.options.map((turn, i) => (
                      <label
                        className={
                          answer === String(turn)
                            ? "diagram-choice selected"
                            : "diagram-choice"
                        }
                        key={turn}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={turn}
                          checked={answer === String(turn)}
                          onChange={() => setAnswer(String(turn))}
                          required
                        />
                        <Arrow
                          turn={turn}
                          label={`Option ${String.fromCharCode(65 + i)}: arrow points ${dirs[turn]}`}
                        />
                        <span>{String.fromCharCode(65 + i)}</span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <label className="answer-field">
                    Your answer
                    <input
                      aria-label="Your answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      required
                      maxLength={1000}
                      placeholder="Type your answer…"
                      disabled={!!feedback || busy}
                    />
                    <small>
                      Fractions such as 1/2 or 2/4 are both welcome.
                    </small>
                  </label>
                )}
                <details className="working">
                  <summary>My working or reasoning (optional)</summary>
                  <textarea
                    aria-label="My working"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    placeholder="Use this space to think. These notes are not saved."
                    maxLength={2000}
                  />
                </details>
                {!feedback && (
                  <button className="primary" disabled={busy || !answer.trim()}>
                    {busy ? "Checking…" : "Check my answer →"}
                  </button>
                )}
              </form>
            )}
            {help && (
              <div className="help-box" role="status">
                <span className="tag">LET’S WORK IT OUT TOGETHER</span>
                <p>{help}</p>
              </div>
            )}
            {feedback && (
              <div
                className={feedback.correct ? "feedback correct" : "feedback"}
                role="status"
              >
                <h3>{feedback.message}</h3>
                <p>{feedback.explanation}</p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => {
                    if (!feedback.next) {
                      onFinish(
                        feedback.summary || "Your diagnostic is complete.",
                      );
                      return;
                    }
                    setLesson(feedback.next);
                    setFeedback(null);
                    setAnswer("");
                    setMethod("");
                    setHelp("");
                  }}
                >
                  {feedback.next ? "Try a fresh question →" : "See my recap →"}
                </button>
              </div>
            )}
          </section>
          <section className="help-actions" aria-label="Learning support">
            <p>You don’t have to figure it out alone.</p>
            <div>
              {[
                ["not-taught", "I haven’t learnt this yet"],
                ["forgotten", "I’ve forgotten"],
                ["hint", "Give me a hint"],
                ["another", "Explain another way"],
              ].map(([kind, label]) => (
                <button
                  key={kind}
                  disabled={busy || !!feedback}
                  onClick={() =>
                    action(async () => {
                      const r = await api<{
                        content: string;
                        prerequisites: {
                          topic: string;
                          lesson: string;
                          example: string;
                        }[];
                      }>("help", { lessonId: lesson.lessonId, kind });
                      setHelp(
                        r.content +
                          (kind === "not-taught" && r.prerequisites.length
                            ? "\n\nFoundation: " +
                              r.prerequisites[0].lesson +
                              "\n" +
                              r.prerequisites[0].example
                            : ""),
                      );
                    })
                  }
                >
                  {label} <span>→</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
function Writing({
  busy,
  action,
  onClose,
}: {
  busy: boolean;
  action: (f: () => Promise<void>) => Promise<void>;
  onClose?: () => void;
}) {
  const [text, setText] = useState(""),
    [draftId, setDraftId] = useState<string>(),
    [feedback, setFeedback] = useState<Feedback | null>(null),
    [revisions, setRevisions] = useState<Revision[]>([]);
  useEffect(() => {
    let live = true;
    api<{ revisions: Revision[] }>("writing")
      .then((r) => {
        if (live) setRevisions(r.revisions);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <section
      className={onClose ? "writing-modal panel" : "writing-editor"}
      aria-label="Writing workspace"
    >
      {onClose && (
        <button onClick={onClose} className="text-button">
          ← Close writing workspace
        </button>
      )}
      <span className="eyebrow">YOUR WORDS, YOUR STORY</span>
      <h2>A small act of kindness</h2>
      <p>
        Write about helping someone. Include a beginning, middle and ending. Use
        invented names; leave out personal details.
      </p>
      {revisions.length > 0 && (
        <label>
          Continue a saved revision
          <select
            aria-label="Saved writing revisions"
            onChange={(e) => {
              const r = revisions.find((x) => x.id === e.target.value);
              if (r) {
                setText(r.text);
                setDraftId(r.draft_id);
                setFeedback(JSON.parse(r.feedback));
              }
            }}
          >
            <option value="">Choose a revision</option>
            {revisions.map((r, i) => (
              <option value={r.id} key={r.id}>
                Revision {revisions.length - i} ·{" "}
                {new Date(r.created_at).toLocaleDateString("en-NG", {
                  timeZone: "Africa/Lagos",
                })}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Your draft
        <textarea
          aria-label="Your writing draft"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={8000}
          rows={12}
          placeholder="One day…"
        />
      </label>
      <div className="writing-bottom">
        <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
        <button
          className="primary"
          disabled={busy || !text.trim()}
          onClick={() =>
            action(async () => {
              const r = await api<{ draftId: string; feedback: Feedback }>(
                "writing",
                { text, ...(draftId ? { draftId } : {}) },
              );
              setDraftId(r.draftId);
              setFeedback(r.feedback);
              const fresh = await api<{ revisions: Revision[] }>("writing");
              setRevisions(fresh.revisions);
            })
          }
        >
          Save & get revision ideas →
        </button>
      </div>
      {feedback && (
        <div className="help-box" role="status">
          <h3>{feedback.label}</h3>
          {feedback.items.map((item) => (
            <p key={item.area}>
              <strong>{item.area}:</strong> {item.note}
            </p>
          ))}
          <p>
            Make an improvement, then save a new revision. This checklist does
            not award a writing mastery score.
          </p>
        </div>
      )}
    </section>
  );
}
function Parent({
  state,
  busy,
  onLaunch,
  onMutation,
}: {
  state: State;
  busy: boolean;
  onLaunch: (id: string) => void;
  onMutation: (path: string, data: unknown) => void;
}) {
  const [tab, setTab] = useState("overview"),
    [selected, setSelected] = useState(state.learners?.[0]?.id || ""),
    [grade, setGrade] = useState(2),
    [filter, setFilter] = useState("All modules");
  const l =
    state.learners?.find((x) => x.id === selected) || state.learners![0];
  const core =
    state.skills?.filter(
      (s) => s.grade === l.grade && s.status !== "supplementary",
    ) || [];
  const touched = core.filter(
    (s) => l.progress.find((p) => p.skillId === s.id)?.attempts,
  ).length;
  const repeatedCount = l.progress.reduce(
    (a, p) => a + ((p as Stats & { repeated?: number }).repeated || 0),
    0,
  );
  const measures = [
    {
      value: `${touched}/${core.length}`,
      label: "Provisional mapped topics practised",
      note: "Official total unknown; not verified full curriculum coverage.",
    },
    {
      value: l.progress.filter((p) => p.state === "retained").length,
      label: "Retained independent skills",
      note: "Distinct items, sessions, transfer and spaced retrieval.",
    },
    {
      value: l.progress.reduce((a, p) => a + p.assisted, 0),
      label: "Assisted successes",
      note: "Learning with support, counted separately.",
    },
  ];
  return (
    <section className="parent-space">
      <div className="page-heading">
        <span className="eyebrow">THE BIGGER PICTURE</span>
        <h1>Space to see them grow.</h1>
        <p>
          Keep their journeys separate. Celebrate the learning behind the
          numbers.
        </p>
      </div>
      <div className="parent-tabs" role="tablist">
        {["overview", "curriculum", "sources", "settings"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="profile-select">
        <label>
          Current learner
          <select value={l.id} onChange={(e) => setSelected(e.target.value)}>
            {state.learners?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nickname} · Primary {x.grade}
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary"
          disabled={busy}
          onClick={() => onLaunch(l.id)}
        >
          Open {l.nickname}’s learning space →
        </button>
        <small>
          Opening child mode locks the parent area. Sign in again to switch
          profiles.
        </small>
      </div>
      {tab === "overview" ? (
        <>
          <div className="metric-grid">
            {measures.map((m) => (
              <section className="panel metric" key={m.label}>
                <strong>{m.value}</strong>
                <h3>{m.label}</h3>
                <p>{m.note}</p>
              </section>
            ))}
          </div>
          <div className="parent-columns">
            <section className="panel">
              <h2>What the evidence says</h2>
              <p className="report-note">
                {repeatedCount} correct repeated responses are recorded as
                review practice, separately from fresh independent evidence.
              </p>
              {modules.map((m) => {
                const p = l.progress.filter(
                  (p) =>
                    state.skills?.find((s) => s.id === p.skillId)?.module === m,
                );
                return (
                  <div className="report-row" key={m}>
                    <Icon name={m} />
                    <span>
                      <strong>{m}</strong>
                      {m === "General Paper" && (
                        <small>
                          Basic Science:{" "}
                          {l.progress
                            .filter(
                              (p) =>
                                state.skills?.find((s) => s.id === p.skillId)
                                  ?.domain === "Basic Science",
                            )
                            .reduce((a, p) => a + p.independent, 0)}{" "}
                          independent successes
                        </small>
                      )}
                    </span>
                    <span>
                      {p.reduce((a, p) => a + p.independent, 0)} independent
                      <br />
                      <small>
                        {p.reduce((a, p) => a + p.assisted, 0)} with support
                      </small>
                    </span>
                  </div>
                );
              })}
            </section>
            <section className="panel">
              <h2>Revisit & remember</h2>
              {l.progress.filter((p) => p.due).length ? (
                l.progress
                  .filter((p) => p.due)
                  .map((p) => (
                    <div className="review-row" key={p.skillId}>
                      <strong>
                        {state.skills?.find((s) => s.id === p.skillId)?.topic}
                      </strong>
                      <p>
                        {p.state} · Review{" "}
                        {new Date(p.due!).toLocaleDateString("en-NG", {
                          timeZone: "Africa/Lagos",
                        })}
                      </p>
                    </div>
                  ))
              ) : (
                <div className="empty-state">
                  After a little practice, review suggestions will appear here.
                </div>
              )}
              <h3>Recent sessions</h3>
              {l.sessions.length ? (
                l.sessions.slice(0, 5).map((s) => (
                  <p className="session-row" key={s.id}>
                    {s.summary || "Lesson in progress"}
                    <small>
                      {new Date(s.started_at).toLocaleDateString("en-NG", {
                        timeZone: "Africa/Lagos",
                      })}{" "}
                      · {s.mode}
                    </small>
                  </p>
                ))
              ) : (
                <p>No sessions yet. A first step is all it takes.</p>
              )}
            </section>
          </div>
          <AttemptHistory
            key={l.id + l.progress.reduce((a, p) => a + p.attempts, 0)}
            learnerId={l.id}
          />
          <section className="panel writing-report">
            <h2>Writing & revision</h2>
            {l.writing.length ? (
              l.writing.map((r) => (
                <details key={r.id}>
                  <summary>
                    {new Date(r.created_at).toLocaleString("en-NG", {
                      timeZone: "Africa/Lagos",
                    })}{" "}
                    · Saved revision
                  </summary>
                  <p className="preserve">{r.text}</p>
                  {(JSON.parse(r.feedback) as Feedback).items.map((f) => (
                    <p key={f.area}>
                      <strong>{f.area}:</strong> {f.note}
                    </p>
                  ))}
                </details>
              ))
            ) : (
              <p>
                Saved drafts and local revision checklists will appear here.
              </p>
            )}
          </section>
        </>
      ) : tab === "settings" ? (
        <SettingsPanel
          key={l.id + JSON.stringify(l.settings)}
          learner={l}
          busy={busy}
          onMutation={onMutation}
        />
      ) : tab === "curriculum" ? (
        <>
          <div className="notice">
            This is a small original teaching map, not verified exhaustive NERDC
            coverage. Unmapped outcomes and source conflicts remain under
            review. Reasoning is supplementary entrance enrichment.
          </div>
          <div className="filter-row">
            <label>
              Grade
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={g}>
                    Primary {g}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Module
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["All modules", ...modules].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="curriculum-list">
            {state.skills
              ?.filter(
                (s) =>
                  s.grade === grade &&
                  (filter === "All modules" || s.module === filter),
              )
              .map((s) => (
                <section className="panel curriculum-item" key={s.id}>
                  <div>
                    <span className="tag">
                      {s.status === "supplementary"
                        ? "SUPPLEMENTARY ORIGINAL"
                        : "PRIVATE SOURCE · NEEDS REVIEW"}
                    </span>
                    <h3>{s.topic}</h3>
                    <p>{s.objective}</p>
                    <small>
                      {s.originalSubject} → {s.module} / {s.domain}
                    </small>
                    <p className="source-ref">
                      {s.sourceId
                        ? `Private source ${s.sourceId} · PDF page ${s.sourcePage}`
                        : "Original teaching content; no verified source-page mapping."}
                    </p>
                    <small>
                      Prerequisites:{" "}
                      {s.prerequisiteIds.join(", ") || "None mapped"}
                    </small>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      onMutation("curriculum", {
                        skillId: s.id,
                        term: f.get("term") ? Number(f.get("term")) : null,
                        week: f.get("week") ? Number(f.get("week")) : null,
                        note: f.get("note"),
                      });
                    }}
                  >
                    <label>
                      Term
                      <input
                        name="term"
                        type="number"
                        min={1}
                        max={3}
                        defaultValue={s.term || ""}
                      />
                    </label>
                    <label>
                      Week
                      <input
                        name="week"
                        type="number"
                        min={1}
                        max={13}
                        defaultValue={s.week || ""}
                      />
                    </label>
                    <label>
                      Reason for edit
                      <input
                        name="note"
                        required
                        minLength={5}
                        maxLength={500}
                      />
                    </label>
                    <button className="secondary" disabled={busy}>
                      Save sequence
                    </button>
                  </form>
                </section>
              ))}
          </div>
        </>
      ) : (
        <>
          <div className="notice">
            Official revised NERDC pages could not be verified from this
            environment. Private compilations and historical sources are
            planning support. A “2025” cover does not establish official
            approval.
          </div>
          <div className="source-grid">
            {state.sources?.map((s) => (
              <section className="panel source-card" key={s.id}>
                <span className="tag">
                  {s.authority_tier.replaceAll("_", " ").toUpperCase()}
                </span>
                <h3>{s.id}</h3>
                <p>{s.filename}</p>
                <small>{s.pages} pages · Private reference only</small>
                <p>
                  {s.id === "915968705"
                    ? "P2/P3 chapters: not present in this source."
                    : s.id === "978433855"
                      ? "Duplicate pages excluded from topic coverage."
                      : "Source mapping requires review."}
                </p>
              </section>
            ))}
          </div>
          <details className="panel official-checks">
            <summary>Official references and access checks</summary>
            <p>
              Retrieved documents still need outcome-level review. Revised P2/P5
              detail pages remain inaccessible.
            </p>
            {state.officialChecks?.map((check) => (
              <p key={check.id}>
                <a href={check.url} target="_blank" rel="noopener noreferrer">
                  {check.id} →
                </a>
                <br />
                <small>
                  {check.checked_at} · {check.status.replaceAll("_", " ")}
                  {check.error ? ` · ${check.error}` : ""}
                </small>
              </p>
            ))}
          </details>
          <h2>Curriculum review queue</h2>
          {state.conflicts?.map((c) => (
            <section className="panel conflict-card" key={c.id}>
              <span className="tag">{c.status.toUpperCase()}</span>
              <h3>{c.description}</h3>
              <p>{c.resolution}</p>
              <small>
                {c.sources
                  .map((s) => `Source ${s.id}, PDF page ${s.page}`)
                  .join("; ")}
              </small>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  onMutation("conflict", {
                    id: c.id,
                    status: c.status === "open" ? "reviewed" : "open",
                    note: f.get("note"),
                  });
                }}
              >
                <label>
                  Review note
                  <input name="note" required minLength={5} maxLength={500} />
                </label>
                <button className="secondary" disabled={busy}>
                  {c.status === "open" ? "Mark reviewed" : "Reopen"}
                </button>
              </form>
            </section>
          ))}
          <p>
            Sources and page references are kept in parent space. Child screens
            show original teaching content.
          </p>
        </>
      )}
    </section>
  );
}
function SettingsPanel({
  learner: l,
  busy,
  onMutation,
}: {
  learner: Profile;
  busy: boolean;
  onMutation: (path: string, data: unknown) => void;
}) {
  const [confirm, setConfirm] = useState("");
  return (
    <div className="parent-columns">
      <section className="panel settings-panel">
        <h2>A rhythm that works for {l.nickname}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onMutation("settings", {
              learnerId: l.id,
              nickname: f.get("nickname"),
              minutes: Number(f.get("minutes")),
              stretch: f.has("stretch"),
              exam: l.grade === 5 && f.has("exam"),
              quietHours: f.has("quietHours"),
              weekdays: f.getAll("weekdays").map(Number),
              entrancePath: f.get("entrancePath") || "broad",
            });
          }}
        >
          <label>
            Nickname only
            <input
              name="nickname"
              required
              minLength={1}
              maxLength={24}
              defaultValue={l.nickname}
            />
          </label>
          <label>
            Session length: 20–30 minutes
            <input
              name="minutes"
              type="number"
              required
              min={20}
              max={30}
              defaultValue={l.settings.minutes}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="stretch"
              defaultChecked={l.settings.stretch}
            />
            Allow next-grade stretch after independent readiness
          </label>
          {l.grade === 5 && (
            <>
              <label className="check">
                <input
                  type="checkbox"
                  name="exam"
                  defaultChecked={l.settings.exam}
                />
                Enable entrance practice
              </label>
              <label>
                Entrance pathway
                <select
                  name="entrancePath"
                  defaultValue={l.settings.entrancePath}
                >
                  <option value="broad">
                    Broad Private Entrance · original enrichment
                  </option>
                  <option value="ncee2026">
                    NECO NCEE · 2026 historical structure
                  </option>
                </select>
                <small>
                  The 2026 structure is a supplied reference, pending live
                  re-verification. No current-year format or universal
                  private-school syllabus is claimed.
                </small>
              </label>
            </>
          )}
          <label className="check">
            <input
              type="checkbox"
              name="quietHours"
              defaultChecked={l.settings.quietHours}
            />
            Pause new lessons
          </label>
          <fieldset>
            <legend>Planned learning days</legend>
            <div className="weekday-checks">
              {days.map((d, i) => (
                <label className="check" key={d}>
                  <input
                    type="checkbox"
                    name="weekdays"
                    value={i}
                    defaultChecked={l.settings.weekdays.includes(i)}
                  />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="primary" disabled={busy}>
            Save learning settings →
          </button>
        </form>
      </section>
      <section className="panel privacy-settings">
        <span className="tag">PRIVACY & PARENT CONTROLS</span>
        <h2>Their learning stays theirs.</h2>
        <p>
          External AI requests are blocked server-side. No API key is required.
          Drafts and responses are stored locally and are not sent to a model.
        </p>
        <p>
          Local storage is not encrypted. Use a private machine or protected
          disk; a public deployment needs HTTPS, secure cookies, backup and a
          privacy review.
        </p>
        <div className="export-links">
          <a
            className="secondary"
            href={`/api/export?learnerId=${l.id}`}
            download="progress.json"
          >
            Export JSON →
          </a>
          <a
            className="secondary"
            href={`/api/export?learnerId=${l.id}&format=csv`}
            download="progress.csv"
          >
            Export CSV →
          </a>
        </div>
        <small>
          JSON includes writing content; review before sharing. Exports omit
          family usernames and learner IDs, but free text can contain personal
          details.
        </small>
        <hr />
        <h3>Delete this learner’s progress</h3>
        <p>
          Removes attempts, help events, sessions, reviews, writing revisions
          and active child access. Keeps the profile and settings.
        </p>
        <label>
          Type DELETE to confirm
          <input
            aria-label="Delete confirmation"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        <button
          className="danger"
          disabled={busy || confirm !== "DELETE"}
          onClick={() => {
            onMutation("purge", { learnerId: l.id, confirm });
            setConfirm("");
          }}
        >
          Delete {l.nickname}’s learning records
        </button>
        <hr />
        <h3>Delete the family account</h3>
        <p>
          Removes the parent account, both profiles and all learning records
          from this app. Backups require separate management.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onMutation("delete-family", {
              password: f.get("password"),
              confirm: f.get("confirm"),
            });
          }}
        >
          <label>
            Parent password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            Type DELETE FAMILY
            <input name="confirm" pattern="DELETE FAMILY" required />
          </label>
          <button className="danger" disabled={busy}>
            Delete family account
          </button>
        </form>
      </section>
    </div>
  );
}

function AttemptHistory({ learnerId }: { learnerId: string }) {
  const [history, setHistory] = useState<
    {
      skill_id: string;
      question_id: string;
      response: string;
      correct: number;
      assisted: number;
      repeated: number;
      created_at: number;
      evaluator: string;
    }[]
  >([]);
  useEffect(() => {
    let live = true;
    api<{ attempts: typeof history }>("history?learnerId=" + learnerId)
      .then((r) => {
        if (live) setHistory(r.attempts);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [learnerId]);
  return (
    <section className="panel writing-report">
      <h2>Question history</h2>
      {history.length ? (
        history.map((h, i) => (
          <details key={i}>
            <summary>
              {h.skill_id} · {h.correct ? "Correct" : "Revisit"} ·{" "}
              {h.assisted
                ? "With support"
                : h.repeated
                  ? "Repeated review"
                  : "Independent attempt"}
            </summary>
            <p>Response: {h.response}</p>
            <small>
              {new Date(h.created_at).toLocaleString("en-NG", {
                timeZone: "Africa/Lagos",
              })}{" "}
              · Evaluator: {h.evaluator} · Item: {h.question_id}
            </small>
          </details>
        ))
      ) : (
        <p>No assessed questions yet.</p>
      )}
    </section>
  );
}
