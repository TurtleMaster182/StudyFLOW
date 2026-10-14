import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { Badge, BotMark, Button, Chip, Empty, Icon, Page } from '../ui/components';
import { colors, styles as s } from '../ui/theme';

export function RecapScreen({
  initialLessonId,
  onUpload,
}: {
  initialLessonId?: string;
  onUpload: () => void;
}) {
  const { state, markRecap } = useApp();
  const lessons = state.lessons.filter((l) => l.pack);
  const [lessonId, setLessonId] = useState(initialLessonId ?? lessons[0]?.id);
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const [answer, setAnswer] = useState('');
  const [completed, setCompleted] = useState(false);
  const resetCard = () => {
    setRevealed(false);
    setHint(false);
    setAnswer('');
  };
  const changeLesson = (id: string) => {
    setLessonId(id);
    setIndex(0);
    setCompleted(false);
    resetCard();
  };
  if (!lesson?.pack)
    return (
      <Page>
        <Text style={s.title}>A quick recap</Text>
        <Text style={s.muted}>A little recall goes a long way.</Text>
        <Empty
          icon="repeat-outline"
          title="Make room for what you remember"
          description="Create a study pack for an attached lesson, then come back for short questions and practice problems."
        >
          <Button title="Attach a lesson" onPress={onUpload} />
        </Empty>
      </Page>
    );
  const question = lesson.pack.recap[index];
  const next = () => {
    if (!lesson.recapSeen.includes(index))
      void markRecap(lesson.id, index).catch((e) =>
        Alert.alert('Progress could not be saved', e.message),
      );
    if (index === lesson.pack!.recap.length - 1) {
      setCompleted(true);
    } else {
      setIndex((i) => i + 1);
      resetCard();
    }
  };
  return (
    <Page>
      <Text style={s.title}>A quick recap</Text>
      <Text style={s.muted}>A little recall goes a long way.</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {lessons.map((l) => (
          <Chip
            key={l.id}
            title={l.title}
            active={l.id === lesson.id}
            onPress={() => changeLesson(l.id)}
          />
        ))}
      </ScrollView>
      {completed ? (
        <View style={[s.card, { paddingVertical: 30 }]}>
          <BotMark />
          <Text style={s.heading}>A little more locked in.</Text>
          <Text style={s.muted}>
            You’ve worked through this lesson’s recap. These questions will be here whenever you
            need them.
          </Text>
          <Button
            title="Go through it again"
            onPress={() => {
              setCompleted(false);
              setIndex(0);
              resetCard();
            }}
          />
        </View>
      ) : (
        <>
          <View style={s.between}>
            <Badge text="Recall, then reveal" />
            <Text style={s.muted}>
              {index + 1} / {lesson.pack.recap.length}
            </Text>
          </View>
          <View style={[s.card, { padding: 24, gap: 20 }]}>
            <BotMark small />
            <Text style={[s.heading, { fontSize: 23, lineHeight: 32 }]}>{question.question}</Text>
            <TextInput
              accessibilityLabel="Your recap answer"
              multiline
              placeholder="Think it through, or jot your answer here…"
              placeholderTextColor="#8A968C"
              value={answer}
              onChangeText={setAnswer}
              style={{
                minHeight: 110,
                padding: 0,
                textAlignVertical: 'top',
                fontSize: 15,
                lineHeight: 24,
                color: colors.ink,
              }}
            />
            <View style={s.divider} />
            <Pressable accessibilityRole="button" onPress={() => setHint((v) => !v)} style={s.row}>
              <Icon name="bulb-outline" size={18} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '500' }}>
                {hint ? 'Hide hint' : 'A little hint?'}
              </Text>
            </Pressable>
            {hint && <Text style={s.muted}>{question.hint}</Text>}
          </View>
          {revealed ? (
            <View
              accessibilityLiveRegion="polite"
              style={[s.card, { backgroundColor: colors.accentLight, borderColor: 'transparent' }]}
            >
              <Text style={[s.label, { color: colors.accent }]}>One way to answer</Text>
              <Text selectable style={s.body}>
                {question.answer}
              </Text>
              <Text style={[s.muted, { fontSize: 12 }]}>
                Compare the idea with your answer. Different wording is fine.
              </Text>
            </View>
          ) : (
            <Button
              title="Reveal answer"
              secondary
              icon="eye-outline"
              onPress={() => setRevealed(true)}
            />
          )}
          {revealed && (
            <Button
              title={index === lesson.pack.recap.length - 1 ? 'Finish recap' : 'Next question'}
              icon="arrow-forward-outline"
              onPress={next}
            />
          )}
        </>
      )}
      <View style={[s.row, { justifyContent: 'center' }]}>
        <Icon name="checkmark-circle-outline" size={15} color={colors.muted} />
        <Text style={[s.muted, { fontSize: 12 }]}>
          {lesson.recapSeen.length} of {lesson.pack.recap.length} reviewed · saved questions
        </Text>
      </View>
    </Page>
  );
}
