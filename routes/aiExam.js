/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/aiExam.js

   AI Examination Question Generator.
   Teacher/Admin only. Calls the Anthropic API to generate
   objective (MCQ) and theory questions for the "Create New
   Examination" screen. Nothing here is saved automatically —
   it only returns generated questions for the teacher to
   review, edit, and insert into their draft before submitting
   the exam through the normal /api/exams flow.
   ═══════════════════════════════════════════════════════════ */
const express       = require('express');
const router         = express.Router();
const auth           = require('../middleware/auth');
const schoolTenant   = require('../middleware/schoolTenant');
const { requireRole } = require('../middleware/requireRole');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { getSecret } = require('../config/secrets');

/* Only teachers/admins, and only after a valid school-scoped login */
router.use(auth);
router.use(schoolTenant);

/* Keep this generous enough for real classroom use but tight enough
   to protect the Anthropic API budget from abuse/runaway loops. */
const aiGenerateLimiter = createRateLimiter(
  20, 10,
  'You have hit the AI question generation limit. Please wait a few minutes and try again.'
);

const DEFAULT_MODEL = 'claude-sonnet-5';
const MAX_OBJECTIVE = 25;
const MAX_THEORY    = 10;

/* ── helpers ─────────────────────────────────────────────── */
function clampInt(val, min, max, fallback) {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/* Strip ```json fences etc. in case the model wraps its answer */
function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end   = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

/* Validate + normalize the model's output into the exact shape
   exam-creator.js expects (same shape as EC.objQuestions /
   EC.theoryQuestions on the frontend). Anything malformed is
   dropped rather than allowed to corrupt the exam draft. */
function sanitizeQuestions(raw, numObjective, numTheory) {
  const out = { objective: [], theory: [] };

  if (raw && Array.isArray(raw.objective)) {
    raw.objective.forEach(q => {
      if (!q || typeof q.text !== 'string' || !q.text.trim()) return;
      let options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
      options = options.map(o => (typeof o === 'string' ? o.trim() : ''));
      while (options.length < 4) options.push('');
      if (options.some(o => !o)) return;
      let answer = parseInt(q.answer, 10);
      if (Number.isNaN(answer) || answer < 0 || answer > 3) return;
      let marks = parseFloat(q.marks);
      if (!marks || marks <= 0) marks = 1;
      out.objective.push({ text: q.text.trim(), options, answer, marks });
    });
  }

  if (raw && Array.isArray(raw.theory)) {
    raw.theory.forEach(q => {
      if (!q || typeof q.text !== 'string' || !q.text.trim()) return;
      let marks = parseFloat(q.marks);
      if (!marks || marks <= 0) marks = 5;
      const guide = typeof q.guide === 'string' ? q.guide.trim() : '';
      out.theory.push({ text: q.text.trim(), guide, marks });
    });
  }

  out.objective = out.objective.slice(0, numObjective);
  out.theory    = out.theory.slice(0, numTheory);
  return out;
}

function buildPrompt({ subject, targetClass, topic, difficulty, numObjective, numTheory, session, term }) {
  return `You are an expert Nigerian secondary school exam-setter helping a teacher build an examination.

Generate exam questions for:
- Subject: ${subject}
- Class: ${targetClass}
- Topic / scope: ${topic || 'General coverage of the subject at this class level'}
- Difficulty: ${difficulty}
- Academic session: ${session || 'N/A'}, Term: ${term || 'N/A'}

Produce exactly ${numObjective} objective (multiple-choice) questions and exactly ${numTheory} theory/essay questions, appropriate for Nigerian ${targetClass} students studying ${subject}. Questions must be curriculum-appropriate, clearly worded, and unambiguous.

Respond with ONLY raw JSON (no markdown code fences, no commentary, no extra text) in exactly this shape:
{
  "objective": [
    { "text": "question text", "options": ["option A", "option B", "option C", "option D"], "answer": 0, "marks": 1 }
  ],
  "theory": [
    { "text": "question text", "guide": "short model-answer / marking guide for the teacher", "marks": 5 }
  ]
}

Rules:
- "answer" is the zero-based index (0-3) of the correct option in "options".
- Every objective question must have exactly 4 distinct, plausible options.
- "marks" must be a positive number.
- "guide" should briefly list the key points expected in a strong answer (teacher-only, students never see it).
- Do not repeat questions. Do not include an "answer key" section separately — only the JSON above.`;
}

/* ── POST /api/ai/generate-exam ─────────────────────────────
   body: { subject, targetClass, topic, difficulty, numObjective, numTheory, session, term } */
router.post('/generate-exam', aiGenerateLimiter, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const apiKey = getSecret('ANTHROPIC_API_KEY', '');
    if (!apiKey) {
      return res.status(503).json({
        message: 'AI question generation is not set up on this server yet. Ask the developer to add an ANTHROPIC_API_KEY environment variable.'
      });
    }

    const subject     = String(req.body.subject || '').trim();
    const targetClass = String(req.body.targetClass || '').trim();
    if (!subject)     return res.status(400).json({ message: 'Please select a Subject before generating questions.' });
    if (!targetClass) return res.status(400).json({ message: 'Please select a Target Class before generating questions.' });

    const topic      = String(req.body.topic || '').trim().slice(0, 300);
    const session     = String(req.body.session || '').trim();
    const term        = String(req.body.term || '').trim();
    const difficulty  = ['easy', 'medium', 'hard', 'mixed'].includes(String(req.body.difficulty || '').toLowerCase())
      ? String(req.body.difficulty).toLowerCase() : 'medium';

    const numObjective = clampInt(req.body.numObjective, 0, MAX_OBJECTIVE, 10);
    const numTheory     = clampInt(req.body.numTheory, 0, MAX_THEORY, 2);
    if (numObjective === 0 && numTheory === 0) {
      return res.status(400).json({ message: 'Please request at least one objective or theory question.' });
    }

    const model = getSecret('ANTHROPIC_MODEL', DEFAULT_MODEL);
    const prompt = buildPrompt({ subject, targetClass, topic, difficulty, numObjective, numTheory, session, term });

    let apiRes;
    try {
      apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })
      });
    } catch (netErr) {
      console.error('[AI exam gen] network error:', netErr.message);
      return res.status(502).json({ message: 'Could not reach the AI service. Please check your internet connection and try again.' });
    }

    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({}));
      console.error('[AI exam gen] Anthropic API error:', apiRes.status, errBody);
      if (apiRes.status === 401) {
        return res.status(503).json({ message: 'AI service is misconfigured (invalid API key). Please contact the developer.' });
      }
      if (apiRes.status === 429) {
        return res.status(429).json({ message: 'The AI service is busy right now. Please try again in a moment.' });
      }
      return res.status(502).json({ message: 'The AI service could not generate questions right now. Please try again.' });
    }

    const data = await apiRes.json();
    const textBlock = Array.isArray(data.content) ? data.content.find(b => b.type === 'text') : null;
    const jsonStr = extractJson(textBlock && textBlock.text);
    if (!jsonStr) {
      console.error('[AI exam gen] Could not extract JSON from model output.');
      return res.status(502).json({ message: 'The AI returned an unexpected response. Please try again.' });
    }

    let parsed;
    try { parsed = JSON.parse(jsonStr); }
    catch (parseErr) {
      console.error('[AI exam gen] JSON parse failed:', parseErr.message);
      return res.status(502).json({ message: 'The AI returned an unreadable response. Please try again.' });
    }

    const clean = sanitizeQuestions(parsed, numObjective, numTheory);
    if (clean.objective.length === 0 && clean.theory.length === 0) {
      return res.status(502).json({ message: 'The AI did not return any usable questions. Please try again or adjust your topic.' });
    }

    res.json({
      objective: clean.objective,
      theory: clean.theory,
      requested: { numObjective, numTheory },
      generated: { numObjective: clean.objective.length, numTheory: clean.theory.length }
    });
  } catch (err) {
    console.error('[AI exam gen] Unexpected error:', err.message);
    res.status(500).json({ message: 'Something went wrong generating questions. Please try again.' });
  }
});

module.exports = router;
