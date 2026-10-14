import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { useToday } from '../state/useToday';
import { dayOffset, localDate, periodsForDate } from '../domain/study';
import { Badge, BotMark, Button, Icon, Page } from '../ui/components';
import { colors, styles as s } from '../ui/theme';

export function StudyScreen({
  onUpload,
  onOpen,
  onSchedule,
  onSettings,
}: {
  onUpload: () => void;
  onOpen: (id: string) => void;
  onSchedule: () => void;
  onSettings: () => void;
}) {
  const { state, apiKey, busy, addSample } = useApp();
  const tomorrow = dayOffset(useToday(), 1);
  const periods = periodsForDate(state.periods, tomorrow);
  const ready = state.lessons.filter((l) => l.pack).length;
  return (
    <View style={s.flex}>
      <ScrollView contentContainerStyle={[s.content, { flexGrow: 1, paddingBottom: 24 }]}>
        <View style={s.between}>
          <Text style={s.label}>A calmer way to study</Text>
          <Badge text={`${ready} lesson${ready === 1 ? '' : 's'} ready`} muted />
        </View>
        <View style={{ paddingTop: state.lessons.length ? 10 : 34, paddingBottom: 12, gap: 18 }}>
          <BotMark />
          <Text style={[s.title, { fontSize: 36, lineHeight: 44, letterSpacing: -1.4 }]}>
            A little prep.{'\n'}A clearer tomorrow.
          </Text>
          <Text style={[s.muted, { maxWidth: 300, fontSize: 16, lineHeight: 25 }]}>
            Bring your lessons. Leave with a quiz,{'\n'}a quick recap, and a plan.
          </Text>
        </View>
        {!apiKey && (
          <Pressable
            accessibilityRole="button"
            onPress={onSettings}
            style={[s.row, { backgroundColor: colors.accentLight, borderRadius: 14, padding: 16 }]}
          >
            <Icon name="key-outline" size={19} color={colors.accent} />
            <View style={s.flex}>
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }}>
                Make it your study space
              </Text>
              <Text style={[s.muted, { fontSize: 12 }]}>Add your OpenAI key to get started.</Text>
            </View>
            <Icon name="arrow-forward-outline" color={colors.accent} size={18} />
          </Pressable>
        )}
        {state.lessons.length > 0 && (
          <View style={{ gap: 16 }}>
            <Text style={s.label}>Your recent lessons</Text>
            {state.lessons.slice(0, 3).map((lesson) => (
              <View key={lesson.id} style={{ gap: 10 }}>
                <View
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '85%',
                    borderRadius: 17,
                    borderBottomRightRadius: 5,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: colors.faint,
                  }}
                >
                  <Text style={{ color: colors.ink, fontSize: 15 }}>{lesson.title}</Text>
                  {lesson.attachments.length > 0 && (
                    <Text style={[s.muted, { fontSize: 11 }]}>
                      {lesson.attachments.length} attached file
                      {lesson.attachments.length === 1 ? '' : 's'}
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${lesson.title}`}
                  onPress={() => onOpen(lesson.id)}
                  style={[s.card, { borderTopLeftRadius: 5, marginRight: 12 }]}
                >
                  <View style={s.row}>
                    <BotMark small />
                    <Text style={[s.muted, { fontSize: 12 }]}>Study flow</Text>
                  </View>
                  <Text style={s.body}>
                    {busy.includes(lesson.id)
                      ? 'Reading your lesson and putting your study pack together…'
                      : lesson.pack
                        ? `Your study pack is ready. ${lesson.pack.quiz.length} questions and a quick recap, whenever you are.`
                        : 'Your lesson is here. Let’s turn it into something you can practice.'}
                  </Text>
                  <View style={s.row}>
                    <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }}>
                      {lesson.pack ? 'Let’s study' : 'Open lesson'}
                    </Text>
                    <Icon name="arrow-forward-outline" size={16} color={colors.accent} />
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <View style={{ gap: 14, marginTop: 8 }}>
          <View style={s.between}>
            <Text style={s.label}>Tomorrow, sorted</Text>
            <Text style={[s.muted, { fontSize: 12 }]}>
              {tomorrow.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onSchedule} style={[s.card, { gap: 15 }]}>
            {periods.length ? (
              periods.slice(0, 3).map((period) => {
                const assigned = state.assignments.find(
                  (a) => a.periodId === period.id && a.date === localDate(tomorrow),
                );
                const lesson = state.lessons.find((l) => l.id === assigned?.lessonId);
                return (
                  <View key={period.id} style={s.row}>
                    <View
                      style={{
                        width: 3,
                        height: 35,
                        borderRadius: 2,
                        backgroundColor: period.color,
                      }}
                    />
                    <View style={s.flex}>
                      <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '500' }}>
                        {period.subject}
                      </Text>
                      <Text style={[s.muted, { fontSize: 12 }]}>
                        {period.start} · {lesson?.title ?? 'Attach a lesson to prepare'}
                      </Text>
                    </View>
                    {lesson?.pack && (
                      <Icon name="checkmark-circle" size={19} color={colors.accent} />
                    )}
                  </View>
                );
              })
            ) : (
              <View style={s.row}>
                <Icon name="calendar-outline" color={colors.accent} />
                <View style={s.flex}>
                  <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '500' }}>
                    {state.periods.length
                      ? 'A little breathing room'
                      : 'Give tomorrow a head start'}
                  </Text>
                  <Text style={[s.muted, { fontSize: 12 }]}>
                    {state.periods.length
                      ? 'No classes scheduled tomorrow.'
                      : 'Customize your class periods.'}
                  </Text>
                </View>
                <Icon name="chevron-forward" color={colors.muted} size={17} />
              </View>
            )}
          </Pressable>
        </View>
        {!state.lessons.length && (
          <Button
            title="Try a sample lesson"
            secondary
            onPress={() =>
              void addSample()
                .then(onOpen)
                .catch(() => undefined)
            }
          />
        )}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attach lesson photos or PDFs"
          onPress={onUpload}
          style={[
            s.between,
            {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 25,
              padding: 8,
              paddingLeft: 16,
            },
          ]}
        >
          <View style={s.row}>
            <Icon name="add-outline" color={colors.muted} />
            <Text style={[s.muted, { fontSize: 15 }]}>Attach a lesson…</Text>
          </View>
          <View style={{ padding: 10, backgroundColor: colors.ink, borderRadius: 18 }}>
            <Icon name="arrow-up" size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
