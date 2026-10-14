export type Tab = 'study' | 'lessons' | 'recap' | 'schedule';
export type Attachment = {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  size: number;
  hash: string;
};
export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
export type RecapQuestion = { question: string; answer: string; hint: string };
export type StudyPack = {
  title: string;
  summary: string;
  keyPoints: string[];
  quiz: QuizQuestion[];
  recap: RecapQuestion[];
};
export type Attempt = { id: string; at: string; answers: number[]; correct: number; total: number };
export type Lesson = {
  id: string;
  title: string;
  subject: string;
  note: string;
  createdAt: string;
  fingerprint: string;
  attachments: Attachment[];
  pack?: StudyPack;
  generatedAt?: string;
  model?: string;
  error?: string;
  attempts: Attempt[];
  recapSeen: number[];
};
export type Period = {
  id: string;
  subject: string;
  room: string;
  days: number[];
  start: string;
  end: string;
  color: string;
};
export type Assignment = { periodId: string; date: string; lessonId: string };
export type Settings = { model: string; questionCount: 5 | 8 | 10 };
export type AppState = {
  version: 1;
  lessons: Lesson[];
  periods: Period[];
  assignments: Assignment[];
  settings: Settings;
};
export const initialState: AppState = {
  version: 1,
  lessons: [],
  periods: [],
  assignments: [],
  settings: { model: 'gpt-4.1-mini', questionCount: 5 },
};
export const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
