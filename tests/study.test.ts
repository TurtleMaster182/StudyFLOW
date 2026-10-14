import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleLesson } from '../src/domain/sample';
import { initialState, Period } from '../src/domain/types';
import {
  dayOffset,
  localDate,
  parseSavedState,
  periodsForDate,
  removeLesson,
  scoreAnswers,
  validatePack,
  validatePeriod,
} from '../src/domain/study';

const period: Period = {
  id: 'math',
  subject: 'Math',
  room: '',
  days: [1, 3],
  start: '09:00',
  end: '10:00',
  color: '#648567',
};
const pack = sampleLesson.pack!;

test('validates a complete saved study pack', () => {
  assert.deepEqual(validatePack(pack, 5), pack);
});
test('rejects incorrect answer indices instead of showing a broken quiz', () => {
  assert.throws(
    () => validatePack({ ...pack, quiz: [{ ...pack.quiz[0], correctIndex: 4 }] }),
    /invalid quiz answer/,
  );
});
test('rejects incomplete AI output and duplicate options', () => {
  assert.throws(() => validatePack({ ...pack, quiz: [] }), /incomplete quiz/);
  assert.throws(
    () => validatePack({ ...pack, quiz: [{ ...pack.quiz[0], options: ['A', 'A', 'B', 'C'] }] }),
    /duplicate/,
  );
  assert.throws(() => validatePack({ ...pack, recap: [] }), /missing recap/);
  assert.throws(() => validatePack(pack, 10), /incomplete quiz/);
});
test('scores answer positions correctly, including unanswered questions', () => {
  assert.equal(
    scoreAnswers(
      pack.quiz.map((q) => q.correctIndex),
      pack,
    ),
    5,
  );
  assert.equal(scoreAnswers([], pack), 0);
  assert.equal(scoreAnswers([pack.quiz[0].correctIndex], pack), 1);
});
test('tomorrow rolls over months and years using local calendar dates', () => {
  assert.equal(localDate(dayOffset(new Date(2026, 11, 31, 23), 1)), '2027-01-01');
  assert.equal(localDate(dayOffset(new Date(2028, 1, 28, 12), 1)), '2028-02-29');
});
test('periods are filtered by weekday and sorted chronologically', () => {
  const periods = [
    period,
    { ...period, id: 'early', start: '08:00', end: '08:50' },
    { ...period, id: 'tuesday', days: [2] },
  ];
  assert.deepEqual(
    periodsForDate(periods, new Date(2026, 9, 19)).map((p) => p.id),
    ['early', 'math'],
  );
  assert.equal(periodsForDate(periods, new Date(2026, 9, 18)).length, 0);
});
test('period validation rejects invalid times, missing days, and overlaps', () => {
  assert.match(validatePeriod({ ...period, start: '25:00' }, [])!, /24-hour/);
  assert.match(validatePeriod({ ...period, end: '08:00' }, [])!, /after/);
  assert.match(validatePeriod({ ...period, days: [] }, [])!, /at least/);
  assert.match(validatePeriod({ ...period, subject: ' ' }, [])!, /subject/);
  assert.match(
    validatePeriod({ ...period, id: 'new', start: '09:30', end: '10:30' }, [period])!,
    /overlaps/,
  );
});
test('period editing permits its own times, adjacent classes, and other weekdays', () => {
  assert.equal(validatePeriod(period, [period]), undefined);
  assert.equal(
    validatePeriod({ ...period, id: 'adjacent', start: '10:00', end: '11:00' }, [period]),
    undefined,
  );
  assert.equal(validatePeriod({ ...period, id: 'other-day', days: [2] }, [period]), undefined);
});
test('deleting a lesson removes assignments without deleting other lessons or periods', () => {
  const state = {
    ...initialState,
    lessons: [sampleLesson, { ...sampleLesson, id: 'other' }],
    periods: [period],
    assignments: [
      { periodId: 'math', date: '2026-10-19', lessonId: sampleLesson.id },
      { periodId: 'math', date: '2026-10-21', lessonId: 'other' },
    ],
  };
  const next = removeLesson(state, sampleLesson.id);
  assert.deepEqual(
    next.lessons.map((l) => l.id),
    ['other'],
  );
  assert.equal(next.assignments.length, 1);
  assert.equal(next.periods.length, 1);
});
test('library round-trip preserves cached packs, attempts, recap progress, and dated assignments', () => {
  const state = {
    ...initialState,
    lessons: [
      {
        ...sampleLesson,
        recapSeen: [0, 2],
        attempts: [
          {
            id: 'attempt',
            at: '2026-10-14T12:00:00Z',
            answers: [1, 2, 0, 3, 1],
            correct: 5,
            total: 5,
          },
        ],
      },
    ],
    periods: [period],
    assignments: [{ periodId: 'math', date: '2026-10-19', lessonId: sampleLesson.id }],
  };
  assert.deepEqual(parseSavedState(JSON.stringify(state)), state);
  assert.equal(parseSavedState(null), undefined);
});
test('corrupt libraries fail visibly rather than silently starting an empty library', () => {
  assert.throws(() => parseSavedState('{broken'));
  assert.throws(() => parseSavedState(JSON.stringify({ version: 2 })));
  assert.throws(() =>
    parseSavedState(JSON.stringify({ ...initialState, lessons: [{ id: 'invalid' }] })),
  );
});

test('unreadable source material does not turn into a fabricated lesson', () => {
  assert.throws(
    () => validatePack({ sourceReadable: false, sourceIssue: 'Please use a clearer photo.' }),
    /clearer photo/,
  );
});
