import { AppState, Period, StudyPack } from './types';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`The AI returned an invalid ${label}. Please retry this lesson.`);
  return value.trim();
}
export function validatePack(value: unknown, questionCount?: number): StudyPack {
  if (!record(value))
    throw new Error('The AI did not return a study pack. Please retry this lesson.');
  if (value.sourceReadable === false)
    throw new Error(
      typeof value.sourceIssue === 'string' && value.sourceIssue.trim()
        ? value.sourceIssue.trim().slice(0, 400)
        : 'The lesson could not be read. Try clearer photos or another PDF.',
    );
  if (!Array.isArray(value.keyPoints) || value.keyPoints.length < 1 || value.keyPoints.length > 10)
    throw new Error('The study pack is missing key points.');
  if (
    !Array.isArray(value.quiz) ||
    value.quiz.length < 1 ||
    value.quiz.length > 20 ||
    (questionCount && value.quiz.length !== questionCount)
  )
    throw new Error('The AI returned an incomplete quiz. Please retry this lesson.');
  if (!Array.isArray(value.recap) || value.recap.length < 1 || value.recap.length > 12)
    throw new Error('The study pack is missing recap questions.');
  if (questionCount && value.recap.length !== 5)
    throw new Error('The AI returned an incomplete recap. Please retry this lesson.');
  return {
    title: text(value.title, 'title'),
    summary: text(value.summary, 'summary'),
    keyPoints: value.keyPoints.map((v) => text(v, 'key point')),
    quiz: value.quiz.map((q) => {
      if (
        !record(q) ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !Number.isInteger(q.correctIndex) ||
        (q.correctIndex as number) < 0 ||
        (q.correctIndex as number) > 3
      )
        throw new Error('The AI returned an invalid quiz answer. Please retry this lesson.');
      const options = q.options.map((v) => text(v, 'answer option'));
      if (new Set(options).size !== 4)
        throw new Error('The AI returned duplicate answer options. Please retry this lesson.');
      return {
        question: text(q.question, 'question'),
        options,
        correctIndex: q.correctIndex as number,
        explanation: text(q.explanation, 'explanation'),
      };
    }),
    recap: value.recap.map((q) => {
      if (!record(q)) throw new Error('The AI returned an invalid recap question.');
      return {
        question: text(q.question, 'recap question'),
        answer: text(q.answer, 'recap answer'),
        hint: text(q.hint, 'hint'),
      };
    }),
  };
}

export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayOffset(date: Date, offset: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + offset);
  return copy;
}
export function periodsForDate(periods: Period[], date: Date): Period[] {
  return periods
    .filter((p) => p.days.includes(date.getDay()))
    .sort((a, b) => a.start.localeCompare(b.start));
}
export function validTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function validatePeriod(period: Period, others: Period[]): string | undefined {
  if (!period.subject.trim()) return 'Give this period a subject.';
  if (!period.days.length) return 'Choose at least one day.';
  if (!validTime(period.start) || !validTime(period.end))
    return 'Use 24-hour times, for example 09:00.';
  if (period.start >= period.end) return 'The end time must be after the start time.';
  if (
    others.some(
      (p) =>
        p.id !== period.id &&
        p.days.some((d) => period.days.includes(d)) &&
        p.start < period.end &&
        period.start < p.end,
    )
  )
    return 'This period overlaps another class on a selected day.';
  return undefined;
}
export function removeLesson(state: AppState, id: string): AppState {
  return {
    ...state,
    lessons: state.lessons.filter((l) => l.id !== id),
    assignments: state.assignments.filter((a) => a.lessonId !== id),
  };
}
export function scoreAnswers(answers: number[], pack: StudyPack): number {
  return pack.quiz.reduce(
    (score, q, index) => score + (answers[index] === q.correctIndex ? 1 : 0),
    0,
  );
}
export function parseSavedState(raw: string | null): AppState | undefined {
  if (!raw) return undefined;
  const data: unknown = JSON.parse(raw);
  if (
    !record(data) ||
    data.version !== 1 ||
    !Array.isArray(data.lessons) ||
    !Array.isArray(data.periods) ||
    !Array.isArray(data.assignments) ||
    !record(data.settings)
  )
    throw new Error('Your saved library could not be read. Your files have been kept.');
  if (
    typeof data.settings.model !== 'string' ||
    !data.settings.model.trim() ||
    ![5, 8, 10].includes(data.settings.questionCount as number)
  )
    throw new Error('Your saved settings could not be read. Your files have been kept.');
  // Validate generated data again on hydration before rendering questions.
  for (const lesson of data.lessons) {
    if (
      !record(lesson) ||
      typeof lesson.id !== 'string' ||
      typeof lesson.title !== 'string' ||
      !Array.isArray(lesson.attachments) ||
      !Array.isArray(lesson.attempts) ||
      !Array.isArray(lesson.recapSeen)
    )
      throw new Error('A saved lesson could not be read. Your files have been kept.');
    if (
      typeof lesson.subject !== 'string' ||
      typeof lesson.note !== 'string' ||
      typeof lesson.fingerprint !== 'string'
    )
      throw new Error('A saved lesson is missing its details. Your files have been kept.');
    for (const a of lesson.attachments) {
      if (
        !record(a) ||
        typeof a.id !== 'string' ||
        typeof a.uri !== 'string' ||
        typeof a.name !== 'string' ||
        typeof a.mimeType !== 'string' ||
        typeof a.size !== 'number' ||
        typeof a.hash !== 'string'
      )
        throw new Error('A saved attachment could not be read. Your files have been kept.');
    }
    for (const attempt of lesson.attempts) {
      if (
        !record(attempt) ||
        typeof attempt.id !== 'string' ||
        typeof attempt.at !== 'string' ||
        !Array.isArray(attempt.answers) ||
        typeof attempt.correct !== 'number' ||
        typeof attempt.total !== 'number' ||
        attempt.total < 1
      )
        throw new Error('Your quiz history could not be read. Your files have been kept.');
    }
    if (!lesson.recapSeen.every((i) => Number.isInteger(i) && i >= 0))
      throw new Error('Your recap history could not be read. Your files have been kept.');
    if (lesson.pack) validatePack(lesson.pack);
  }
  for (const period of data.periods) {
    if (
      !record(period) ||
      typeof period.id !== 'string' ||
      typeof period.subject !== 'string' ||
      typeof period.room !== 'string' ||
      typeof period.start !== 'string' ||
      typeof period.end !== 'string' ||
      !validTime(period.start) ||
      !validTime(period.end) ||
      typeof period.color !== 'string' ||
      !Array.isArray(period.days) ||
      !period.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    )
      throw new Error('Your saved periods could not be read. Your files have been kept.');
  }
  for (const assignment of data.assignments) {
    if (
      !record(assignment) ||
      typeof assignment.periodId !== 'string' ||
      typeof assignment.lessonId !== 'string' ||
      typeof assignment.date !== 'string'
    )
      throw new Error('Your lesson assignments could not be read. Your files have been kept.');
  }
  return data as unknown as AppState;
}
