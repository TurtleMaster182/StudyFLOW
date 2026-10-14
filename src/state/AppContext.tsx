import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppState, Lesson, Settings, StudyPack, initialState, makeId } from '../domain/types';
import { parseSavedState, removeLesson, scoreAnswers } from '../domain/study';
import { sampleLesson } from '../domain/sample';
import { GenerationCoordinator, requestStudyPack } from '../services/generation';
import { PickedFile, deleteAttachments, prepareAttachments, readBase64 } from '../services/files';

const STATE_KEY = 'studyflow.library.v1';
const API_KEY = 'studyflow.openai.key';
type ContextValue = {
  state: AppState;
  apiKey: string;
  loading: boolean;
  loadError?: string;
  saveError?: string;
  busy: string[];
  reload: () => Promise<void>;
  update: (fn: (state: AppState) => AppState) => Promise<void>;
  saveSettings: (settings: Settings, key: string) => Promise<void>;
  importLesson: (
    files: PickedFile[],
    title: string,
    subject: string,
    note: string,
  ) => Promise<Lesson>;
  generate: (id: string) => Promise<StudyPack>;
  deleteLesson: (id: string) => Promise<void>;
  recordAttempt: (lessonId: string, answers: number[]) => Promise<void>;
  markRecap: (lessonId: string, index: number) => Promise<void>;
  addSample: () => Promise<string>;
};
const Context = createContext<ContextValue | null>(null);
export const useApp = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('App provider missing');
  return ctx;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const [busy, setBusy] = useState<string[]>([]);
  const current = useRef(state);
  const keyRef = useRef('');
  const coordinator = useRef(new GenerationCoordinator());
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  const reload = async () => {
    setLoading(true);
    setLoadError(undefined);
    try {
      const [raw, key] = await Promise.all([
        AsyncStorage.getItem(STATE_KEY),
        SecureStore.getItemAsync(API_KEY),
      ]);
      const loaded = parseSavedState(raw) ?? initialState;
      current.current = loaded;
      setState(loaded);
      keyRef.current = key ?? '';
      setApiKey(key ?? '');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not open your saved library.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload();
  }, []);

  const update = async (fn: (state: AppState) => AppState) => {
    const next = fn(current.current);
    current.current = next;
    setState(next);
    const serialized = JSON.stringify(next);
    const write = writeQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(STATE_KEY, serialized));
    writeQueue.current = write;
    try {
      await write;
      setSaveError(undefined);
    } catch {
      setSaveError('Changes could not be saved. Free up device storage, then tap Retry save.');
      throw new Error('Your changes are in memory but could not be saved to this device.');
    }
  };
  const saveSettings = async (settings: Settings, key: string) => {
    if (!settings.model.trim()) throw new Error('Enter a model name.');
    if (key.trim()) await SecureStore.setItemAsync(API_KEY, key.trim());
    else await SecureStore.deleteItemAsync(API_KEY);
    keyRef.current = key.trim();
    setApiKey(key.trim());
    await update((s) => ({ ...s, settings: { ...settings, model: settings.model.trim() } }));
  };
  const importLesson = async (
    files: PickedFile[],
    title: string,
    subject: string,
    note: string,
  ) => {
    const prepared = await prepareAttachments(files);
    const existing = current.current.lessons.find((l) => l.fingerprint === prepared.fingerprint);
    if (existing) {
      await deleteAttachments(prepared.attachments);
      return existing;
    }
    const lesson: Lesson = {
      id: makeId(),
      title: title.trim() || files[0].name.replace(/\.[^.]+$/, ''),
      subject: subject.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
      ...prepared,
      attempts: [],
      recapSeen: [],
    };
    await update((s) => ({ ...s, lessons: [lesson, ...s.lessons] }));
    return lesson;
  };
  const generate = (id: string): Promise<StudyPack> => {
    const lesson = current.current.lessons.find((l) => l.id === id);
    if (!lesson) return Promise.reject(new Error('This lesson is no longer in your library.'));
    if (!lesson.pack && !keyRef.current)
      return Promise.reject(new Error('Add your OpenAI API key in Settings first.'));
    const settings = { ...current.current.settings };
    return coordinator.current.generate(lesson, async () => {
      setBusy((ids) => [...ids, id]);
      try {
        const pack = await requestStudyPack(lesson, settings, keyRef.current, {
          fetch: globalThis.fetch,
          readBase64,
        });
        await update((s) => ({
          ...s,
          lessons: s.lessons.map((l) =>
            l.id === id
              ? {
                  ...l,
                  pack,
                  generatedAt: new Date().toISOString(),
                  model: settings.model,
                  error: undefined,
                }
              : l,
          ),
        }));
        return pack;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not generate a study pack.';
        await update((s) => ({
          ...s,
          lessons: s.lessons.map((l) => (l.id === id ? { ...l, error: message } : l)),
        })).catch(() => undefined);
        throw error;
      } finally {
        setBusy((ids) => ids.filter((value) => value !== id));
      }
    });
  };
  const deleteLesson = async (id: string) => {
    if (coordinator.current.isGenerating(id))
      throw new Error('Wait for this lesson to finish generating before deleting it.');
    const lesson = current.current.lessons.find((l) => l.id === id);
    await update((s) => removeLesson(s, id));
    if (lesson) await deleteAttachments(lesson.attachments);
  };
  const recordAttempt = async (id: string, answers: number[]) =>
    update((s) => ({
      ...s,
      lessons: s.lessons.map((l) =>
        l.id === id && l.pack
          ? {
              ...l,
              attempts: [
                ...l.attempts,
                {
                  id: makeId(),
                  at: new Date().toISOString(),
                  answers: [...answers],
                  correct: scoreAnswers(answers, l.pack),
                  total: l.pack.quiz.length,
                },
              ],
            }
          : l,
      ),
    }));
  const markRecap = async (id: string, index: number) =>
    update((s) => ({
      ...s,
      lessons: s.lessons.map((l) =>
        l.id === id ? { ...l, recapSeen: Array.from(new Set([...l.recapSeen, index])) } : l,
      ),
    }));
  const addSample = async () => {
    if (!current.current.lessons.some((l) => l.id === sampleLesson.id))
      await update((s) => ({
        ...s,
        lessons: [{ ...sampleLesson, createdAt: new Date().toISOString() }, ...s.lessons],
      }));
    return sampleLesson.id;
  };
  return (
    <Context.Provider
      value={{
        state,
        apiKey,
        loading,
        loadError,
        saveError,
        busy,
        reload,
        update,
        saveSettings,
        importLesson,
        generate,
        deleteLesson,
        recordAttempt,
        markRecap,
        addSample,
      }}
    >
      {children}
    </Context.Provider>
  );
}
