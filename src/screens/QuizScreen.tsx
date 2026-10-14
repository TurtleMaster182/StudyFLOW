import React, { useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { scoreAnswers } from '../domain/study';
import { Badge, BotMark, Button, Empty, Icon, Page } from '../ui/components';
import { colors, styles as s } from '../ui/theme';

export function QuizScreen({ id, onDone }: { id: string; onDone: () => void }) {
  const { state, recordAttempt } = useApp();
  const lesson = state.lessons.find((l) => l.id === id);
  const pack = lesson?.pack;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number>();
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const recorded = useRef(false);
  const checkedRef = useRef(false);
  if (!pack || !lesson)
    return (
      <Page>
        <Empty title="No quiz yet" description="Generate a study pack for this lesson first." />
      </Page>
    );
  const question = pack.quiz[index];
  const check = () => {
    if (selected !== undefined && !checkedRef.current) {
      checkedRef.current = true;
      setAnswers((a) => [...a, selected]);
      setChecked(true);
    }
  };
  const next = async () => {
    if (!checkedRef.current) return;
    if (index < pack.quiz.length - 1) {
      checkedRef.current = false;
      setIndex((i) => i + 1);
      setSelected(undefined);
      setChecked(false);
      return;
    }
    if (recorded.current) return;
    recorded.current = true;
    setSaving(true);
    try {
      await recordAttempt(id, answers);
    } catch (e) {
      Alert.alert(
        'Progress not saved to disk',
        e instanceof Error ? e.message : 'Free some device storage and retry saving.',
      );
    } finally {
      setDone(true);
      setSaving(false);
    }
  };
  const restart = () => {
    setIndex(0);
    setAnswers([]);
    setSelected(undefined);
    setChecked(false);
    setDone(false);
    recorded.current = false;
    checkedRef.current = false;
  };
  if (done) {
    const score = scoreAnswers(answers, pack);
    return (
      <Page>
        <View style={{ gap: 15, alignItems: 'center', paddingVertical: 25 }}>
          <BotMark />
          <Badge text="One lesson, a little clearer" />
          <Text style={{ fontSize: 65, color: colors.ink, fontWeight: '500', letterSpacing: -4 }}>
            {score}
            <Text style={{ fontSize: 30, color: colors.muted }}> / {pack.quiz.length}</Text>
          </Text>
          <Text style={s.heading}>
            {score === pack.quiz.length
              ? 'You’ve got this.'
              : score >= pack.quiz.length / 2
                ? 'It’s coming together.'
                : 'A good place to grow.'}
          </Text>
          <Text style={[s.muted, { textAlign: 'center' }]}>
            {score === pack.quiz.length
              ? 'Keep it fresh with a quick recap later.'
              : 'A second look makes the next try easier.'}
          </Text>
        </View>
        <Button title="Back to lesson" onPress={onDone} />
        <Button title="Practice the same questions again" secondary onPress={restart} />
        <Text style={s.label}>Your answers</Text>
        {pack.quiz.map((q, i) => (
          <View key={i} style={s.card}>
            <View style={[s.row, { alignItems: 'flex-start' }]}>
              <Icon
                name={
                  answers[i] === q.correctIndex
                    ? 'checkmark-circle-outline'
                    : 'close-circle-outline'
                }
                color={answers[i] === q.correctIndex ? colors.accent : colors.error}
              />
              <Text style={[s.body, s.flex]}>{q.question}</Text>
            </View>
            {answers[i] !== q.correctIndex && (
              <Text style={[s.muted, { color: colors.error }]}>
                Your answer: {q.options[answers[i]]}
              </Text>
            )}
            <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>
              {q.options[q.correctIndex]}
            </Text>
            <Text selectable style={s.muted}>
              {q.explanation}
            </Text>
          </View>
        ))}
      </Page>
    );
  }
  return (
    <Page>
      <View style={s.between}>
        <Badge text={lesson.subject || 'Practice'} />
        <Text style={s.muted}>
          {index + 1} of {pack.quiz.length}
        </Text>
      </View>
      <View
        style={{ height: 4, backgroundColor: colors.line, borderRadius: 3, overflow: 'hidden' }}
      >
        <View
          style={{
            height: 4,
            width: `${((index + (checked ? 1 : 0)) / pack.quiz.length) * 100}%`,
            backgroundColor: colors.accent,
          }}
        />
      </View>
      <Text style={[s.muted, { fontSize: 12 }]}>{lesson.title}</Text>
      <Text style={[s.title, { fontSize: 26, lineHeight: 35 }]}>{question.question}</Text>
      <Text style={s.muted}>Take your time. Choose one answer.</Text>
      <View style={{ gap: 12 }}>
        {question.options.map((option, i) => {
          const correct = checked && i === question.correctIndex;
          const wrong = checked && i === selected && i !== question.correctIndex;
          const active = i === selected;
          return (
            <Pressable
              key={i}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled: checked }}
              disabled={checked}
              onPress={() => setSelected(i)}
              style={[
                s.row,
                {
                  padding: 18,
                  minHeight: 64,
                  borderWidth: 1,
                  borderRadius: 17,
                  borderColor: correct
                    ? colors.accent
                    : wrong
                      ? colors.error
                      : active
                        ? colors.ink
                        : colors.line,
                  backgroundColor: correct
                    ? colors.accentLight
                    : wrong
                      ? colors.errorLight
                      : colors.surface,
                },
              ]}
            >
              <View
                style={{
                  width: 27,
                  height: 27,
                  borderRadius: 9,
                  backgroundColor: active ? colors.ink : colors.faint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: active ? '#FFFFFF' : colors.muted, fontSize: 12 }}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={[s.body, s.flex, { fontSize: 15 }]}>{option}</Text>
              {correct && <Icon name="checkmark-circle" color={colors.accent} size={20} />}
              {wrong && <Icon name="close-circle" color={colors.error} size={20} />}
            </Pressable>
          );
        })}
      </View>
      {checked && (
        <View
          accessibilityLiveRegion="polite"
          style={[s.card, { backgroundColor: colors.accentLight, borderColor: 'transparent' }]}
        >
          <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>
            {selected === question.correctIndex ? 'That’s right.' : 'Here’s the idea.'}
          </Text>
          <Text selectable style={s.body}>
            {question.explanation}
          </Text>
        </View>
      )}
      <Button
        title={
          checked
            ? index === pack.quiz.length - 1
              ? 'See how you did'
              : 'Next question'
            : 'Check answer'
        }
        icon={checked ? 'arrow-forward-outline' : undefined}
        disabled={selected === undefined}
        loading={saving}
        onPress={checked ? () => void next() : check}
      />
      <Text style={[s.muted, { fontSize: 12, textAlign: 'center' }]}>
        Saved questions · no API calls while you practice
      </Text>
    </Page>
  );
}
