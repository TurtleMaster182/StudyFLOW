import React from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { Badge, BotMark, Button, Empty, ErrorMessage, Icon, Page } from '../ui/components';
import { colors, styles as s } from '../ui/theme';

export function LessonScreen({
  id,
  onQuiz,
  onRecap,
  onSettings,
  onDeleted,
}: {
  id: string;
  onQuiz: () => void;
  onRecap: () => void;
  onSettings: () => void;
  onDeleted: () => void;
}) {
  const { state, busy, apiKey, generate, deleteLesson } = useApp();
  const lesson = state.lessons.find((l) => l.id === id);
  const working = busy.includes(id);
  if (!lesson)
    return (
      <Page>
        <Empty title="Lesson unavailable" description="This lesson is no longer in your library." />
      </Page>
    );
  const generatePack = () =>
    void generate(id).catch((e) =>
      Alert.alert(
        'Couldn’t create a study pack',
        e instanceof Error ? e.message : 'Please try again.',
      ),
    );
  const remove = () =>
    Alert.alert(
      'Delete this lesson?',
      'Its source files, saved questions, and quiz history will be removed from this device.',
      [
        { text: 'Keep lesson', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            void deleteLesson(id)
              .then(onDeleted)
              .catch((e) => Alert.alert('Couldn’t delete lesson', e.message)),
        },
      ],
    );
  return (
    <Page>
      <Badge text={lesson.subject || 'Your lesson'} />
      <Text style={s.title}>{lesson.title}</Text>
      {lesson.pack ? (
        <>
          <View style={[s.row, { flexWrap: 'wrap' }]}>
            <Badge
              text={
                lesson.id.startsWith('sample-')
                  ? 'Built-in sample · no tokens used'
                  : 'Saved on your device'
              }
            />
            <Text style={[s.muted, { fontSize: 12 }]}>
              {lesson.pack.quiz.length} quiz · {lesson.pack.recap.length} recap
            </Text>
          </View>
          <View style={s.card}>
            <View style={s.row}>
              <BotMark small />
              <Text style={s.label}>The big picture</Text>
            </View>
            <Text selectable style={s.body}>
              {lesson.pack.summary}
            </Text>
          </View>
          <Button
            title={lesson.attempts.length ? 'Take the quiz again' : 'Start your quiz'}
            icon="arrow-forward-outline"
            onPress={onQuiz}
          />
          <Button title="A quick recap" icon="repeat-outline" secondary onPress={onRecap} />
          <Text style={s.label}>Worth remembering</Text>
          {lesson.pack.keyPoints.map((point, index) => (
            <View key={index} style={[s.row, { alignItems: 'flex-start' }]}>
              <Text style={{ color: colors.accent, fontSize: 13, marginTop: 5 }}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text selectable style={[s.body, s.flex]}>
                {point}
              </Text>
            </View>
          ))}
          {lesson.attempts.length > 0 && (
            <>
              <Text style={s.label}>Your progress</Text>
              <View style={s.card}>
                {lesson.attempts
                  .slice(-5)
                  .reverse()
                  .map((attempt) => (
                    <View key={attempt.id} style={s.between}>
                      <Text style={s.muted}>
                        {new Date(attempt.at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>
                        {attempt.correct} / {attempt.total} ·{' '}
                        {Math.round((attempt.correct / attempt.total) * 100)}%
                      </Text>
                    </View>
                  ))}
              </View>
            </>
          )}
          <Text style={[s.muted, { fontSize: 12 }]}>
            Your saved quiz and recap are reused every time you practice. AI answers can be
            imperfect; check them against your lesson.
          </Text>
        </>
      ) : (
        <View style={s.card}>
          <BotMark />
          <Text style={s.heading}>
            {working ? 'A little thinking time…' : 'Let’s make this lesson stick.'}
          </Text>
          <Text style={s.muted}>
            {working
              ? 'Reading your sources and making one quiz and recap set. You can keep browsing while it finishes.'
              : 'We’ll turn your sources into a summary, a quiz, and five recap questions in one request.'}
          </Text>
          {working ? (
            <ActivityIndicator color={colors.accent} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <>
              <ErrorMessage message={lesson.error} />
              <Button
                title={
                  apiKey
                    ? lesson.error
                      ? 'Retry generation'
                      : 'Create study pack'
                    : 'Add API key in Settings'
                }
                onPress={apiKey ? generatePack : onSettings}
                icon={apiKey ? 'sparkles-outline' : 'key-outline'}
              />
            </>
          )}
        </View>
      )}
      {lesson.note && (
        <View style={{ gap: 8 }}>
          <Text style={s.label}>Your focus</Text>
          <Text style={s.muted}>{lesson.note}</Text>
        </View>
      )}
      {lesson.attachments.length > 0 && (
        <>
          <Text style={s.label}>Attached sources</Text>
          {lesson.attachments.map((a) => (
            <View key={a.id} style={s.row}>
              <Icon
                name={a.mimeType === 'application/pdf' ? 'document-text-outline' : 'image-outline'}
                color={colors.muted}
              />
              <Text numberOfLines={1} style={[s.muted, s.flex]}>
                {a.name}
              </Text>
              <Text style={[s.muted, { fontSize: 11 }]}>
                {(a.size / 1024 / 1024).toFixed(1)} MB
              </Text>
            </View>
          ))}
        </>
      )}
      <Button title="Delete lesson" danger secondary disabled={working} onPress={remove} />
    </Page>
  );
}
