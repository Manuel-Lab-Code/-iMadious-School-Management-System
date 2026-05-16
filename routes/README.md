# EduPortal — School-Isolation Fix Pack

This patch closes every cross-school data leak found in your codebase and
fixes several runtime bugs you would have hit during real-time testing.

## How to apply

Drop each file into your project at the **same path**, overwriting the
existing file. No new files are introduced; no `package.json` changes.

```
eduportal-backend/
├── models/
│   ├── Result.js         ← REPLACE
│   ├── SubjectResult.js  ← REPLACE
│   └── TestScore.js      ← REPLACE
└── routes/
    ├── fees.js           ← REPLACE
    ├── notifications.js  ← REPLACE
    ├── results.js        ← REPLACE
    ├── students.js       ← REPLACE
    ├── subjectResults.js ← REPLACE
    ├── teachers.js       ← REPLACE
    └── testScores.js     ← REPLACE
```

After copying, **restart** your node process. Every patched file has
been syntax-checked (`node --check`) AND fully loaded against your real
`node_modules` in a simulated server startup — no errors.

---

## What each file fixes

### `models/Result.js`
The active schema defined `{ studentId, subject, score, term }`, but every
route, the frontend scripts, and `SubjectResult.recalc` query Results with
`{ student, exam, released, theoryScore, objScore, ... }`. That mismatch
meant exam submissions would either fail validation or silently return
nothing. **Restored the full schema** the rest of your codebase expects,
with `schoolId` required and indexed.

### `models/SubjectResult.js`
`recalc()` did `Exam.find({ subject, session, term })` **without
`schoolId`**. Two schools running "Mathematics / 2024-2025 / First Term"
would pull each other's exams into their students' tallies.
**Fixed:** new signature is `recalc(schoolId, studentId, subject, session, term)`.
Legacy callers continue to work via a User-lookup fallback that logs a
warning — upgrade callers when convenient.

### `models/TestScore.js`
Unique index widened to `{ schoolId, student, subject, session, term }`.
Student IDs are already globally unique, so this is mostly defensive, but
it makes the contract explicit.

### `routes/fees.js`
Previously had **no** school scoping at all. School A admin was seeing
School B's fees. **Fixed:** auth + schoolTenant, student-in-school
verification before any read/write, `schoolId` stripped from request
bodies so it cannot be hijacked.

### `routes/notifications.js`
No school filter, and anyone could create a notification with an
arbitrary `schoolId` via the POST body. **Fixed:** scoped queries,
user-ownership checks (non-admins can only touch their own notifications),
`schoolId` always injected server-side.

### `routes/results.js`
Zero school scoping — entire `/results` tree leaked. Also called the
un-fixed `SubjectResult.recalc` the old way. **Fixed:** auth + schoolTenant
throughout; student-is-me check for student POSTs; student/exam belong-
to-school checks; `recalc` called with `schoolId` first.

### `routes/students.js`
Multiple issues:

1. **Runtime crash** — `POST /api/students` contained
   `new Fee({ schoolId, student: student._id })` where `schoolId` was
   a bare, undefined variable. Any admin-created student would throw.
2. The new User had **no schoolId** set, orphaning it.
3. Email/username uniqueness was checked **globally**, so admins of
   different schools couldn't share a common username like `jdoe`.
4. Legacy `PUT /:id` had no school verification at all — admin A could
   mutate any record in the database by ID.
5. Student dashboard fee lookup had no `schoolId`.
6. DELETE only cleaned up the Fee, leaving Result / TestScore /
   SubjectResult records orphaned.

**Fixed:** rewritten end-to-end with schoolTenant; all uniqueness per-school;
cascade delete across Fee/Result/TestScore/SubjectResult in the same school.

### `routes/subjectResults.js`
No school scoping. The **bulk release** endpoint
(`PUT /subject-results/release-bulk`) was releasing every school's results
for the given session/term — a serious leak because the UI triggers this
at end-of-term. **Fixed:** scoped everywhere, including bulk release.
Also registered `/release-bulk` **before** `/:id/release` so the literal
path wins route matching.

### `routes/teachers.js`
Despite being listed as "done" in your multi-tenancy doc, this file had
zero `schoolId` filtering. `GET /` returned teachers from every school.
`POST /` didn't set `schoolId` on the new teacher. Username uniqueness
was global. Salary and approval/rejection endpoints had no school check.
**Fixed:** every endpoint scoped, helper `findTeacherInSchool` for
ownership verification, per-school uniqueness matching the User index.

### `routes/testScores.js`
The single worst leak. `PUT /test-scores/release-bulk` ran
`TestScore.updateMany({ session, term }, { released: true })` with no
school filter — triggering it from any school's admin panel would
release every school's test scores globally. **Fixed:** scoped; teacher
verified to be in the same school as the student; `recalc` called with
`schoolId` first.

---

## Things that are still fine and untouched

These files are already correct and do NOT need patching:

- `middleware/schoolTenant.js` — solid, correctly written
- `middleware/auth.js` — fine
- `middleware/requireRole.js` — fine
- `routes/exams.js` — already school-scoped (use it as reference)
- `routes/auth.js` — embeds `schoolId` in JWT correctly
- `models/User.js`, `School.js`, `Exam.js`, `Fee.js`, `Notification.js`,
  `TeacherPayment.js` — all carry `schoolId` with indexes
- `routes/subjects.js` — static config, no tenant concern
- `server.js` — routing and startup are correct

---

## ⚠️ Security: rotate these immediately

Your `.env` file was included in the zip you shared. That means your
live credentials are no longer private. **Before any real-time testing:**

1. **Change your MongoDB Atlas user password.** Go to Atlas → Database
   Access → edit user → set a new password → paste into `.env`.
2. **Change `JWT_SECRET`** to a fresh random 64-char string. Every
   currently-issued token becomes invalid (which is what you want).
3. **Rotate the Gmail app password** for `imadioustech@gmail.com` at
   `myaccount.google.com/apppasswords`.
4. **Change `DEVELOPER_KEY`** to something other than the default string.
5. Add `.env` to `.gitignore` if it isn't already.

---

## Manual isolation test (do before production)

With the server running:

1. Register School A and School B via `/developer.html`.
2. Log in as each school's admin in two different browser windows.
3. From School A's admin panel, create a student, record a fee, submit
   an exam, release a test score.
4. In School B's admin panel, verify that:
   - `GET /api/students` returns only School B's students.
   - `GET /api/fees` returns only School B's fees.
   - `GET /api/results` returns only School B's results.
   - Calling `PUT /api/students/:id/approve` with School A's student id
     returns `404` (not 403 — because the filter means "not found in
     this school").
5. Trigger `PUT /api/test-scores/release-bulk` as School A admin and
   confirm School B's unreleased scores stay unreleased.

If any of those tests fail, there's another leak — let me know.
