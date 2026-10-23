ALTER TABLE learner_attempt ADD COLUMN repeated INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lesson_session ADD COLUMN plan TEXT NOT NULL DEFAULT '[]';
PRAGMA user_version=2;
