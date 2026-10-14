import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { useToday } from '../state/useToday';
import { Period, makeId } from '../domain/types';
import { dayOffset, localDate, periodsForDate, validatePeriod } from '../domain/study';
import {
  Badge,
  Button,
  Chip,
  Empty,
  ErrorMessage,
  Field,
  Icon,
  IconButton,
  Page,
  Sheet,
} from '../ui/components';
import { colors, styles as s } from '../ui/theme';

const DAY_OPTIONS = [
  { label: 'M', day: 1, name: 'Monday' },
  { label: 'T', day: 2, name: 'Tuesday' },
  { label: 'W', day: 3, name: 'Wednesday' },
  { label: 'T', day: 4, name: 'Thursday' },
  { label: 'F', day: 5, name: 'Friday' },
  { label: 'S', day: 6, name: 'Saturday' },
  { label: 'S', day: 0, name: 'Sunday' },
];
const PALETTE = ['#648567', '#7B81A2', '#B28A62', '#679AA0', '#A4778E', '#858C72'];
const blankPeriod = (): Period => ({
  id: makeId(),
  subject: '',
  room: '',
  days: [1, 2, 3, 4, 5],
  start: '09:00',
  end: '10:00',
  color: PALETTE[0],
});

function PeriodEditor({ period, onClose }: { period: Period; onClose: () => void }) {
  const { state, update } = useApp();
  const [draft, setDraft] = useState(period);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const exists = state.periods.some((p) => p.id === period.id);
  const save = async () => {
    const validation = validatePeriod(draft, state.periods);
    setError(validation);
    if (validation) return;
    setSaving(true);
    try {
      await update((s) => ({
        ...s,
        periods: [
          ...s.periods.filter((p) => p.id !== draft.id),
          { ...draft, subject: draft.subject.trim(), room: draft.room.trim() },
        ],
      }));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this period.');
    } finally {
      setSaving(false);
    }
  };
  const remove = () =>
    Alert.alert(
      'Remove this period?',
      'This removes the recurring period and its lesson assignments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            void update((s) => ({
              ...s,
              periods: s.periods.filter((p) => p.id !== draft.id),
              assignments: s.assignments.filter((a) => a.periodId !== draft.id),
            }))
              .then(onClose)
              .catch((e) => setError(e.message)),
        },
      ],
    );
  return (
    <Sheet
      visible
      title={exists ? 'Edit period' : 'A new period'}
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <Text style={s.muted}>Set your weekly rhythm. Attach a different lesson for each day.</Text>
      <Field
        label="Subject"
        placeholder="e.g. Mathematics"
        value={draft.subject}
        onChangeText={(subject) => setDraft((d) => ({ ...d, subject }))}
        maxLength={80}
      />
      <Field
        label="Room or teacher (optional)"
        placeholder="e.g. Room 204"
        value={draft.room}
        onChangeText={(room) => setDraft((d) => ({ ...d, room }))}
        maxLength={80}
      />
      <Text style={s.label}>Repeats on</Text>
      <View style={[s.row, { gap: 7, flexWrap: 'wrap' }]}>
        {DAY_OPTIONS.map(({ day, label, name }) => (
          <Pressable
            key={day}
            accessibilityRole="checkbox"
            accessibilityLabel={name}
            accessibilityState={{ checked: draft.days.includes(day) }}
            onPress={() =>
              setDraft((d) => ({
                ...d,
                days: d.days.includes(day) ? d.days.filter((v) => v !== day) : [...d.days, day],
              }))
            }
            style={{
              width: 37,
              height: 43,
              borderRadius: 13,
              backgroundColor: draft.days.includes(day) ? colors.ink : colors.faint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{ color: draft.days.includes(day) ? '#FFFFFF' : colors.muted, fontSize: 13 }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.row}>
        <View style={s.flex}>
          <Field
            label="Starts (24-hour)"
            value={draft.start}
            onChangeText={(start) => setDraft((d) => ({ ...d, start }))}
            placeholder="09:00"
            maxLength={5}
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={s.flex}>
          <Field
            label="Ends (24-hour)"
            value={draft.end}
            onChangeText={(end) => setDraft((d) => ({ ...d, end }))}
            placeholder="10:00"
            maxLength={5}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>
      <Text style={s.label}>A touch of color</Text>
      <View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}>
        {PALETTE.map((color) => (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityLabel={`Period color ${PALETTE.indexOf(color) + 1}`}
            accessibilityState={{ selected: draft.color === color }}
            onPress={() => setDraft((d) => ({ ...d, color }))}
            style={{ minWidth: 40, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
          >
            <View
              style={{
                width: 33,
                height: 33,
                borderRadius: 17,
                backgroundColor: color,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {draft.color === color && <Icon name="checkmark-outline" color="#FFFFFF" size={20} />}
            </View>
          </Pressable>
        ))}
      </View>
      <ErrorMessage message={error} />
      <Button title="Save period" onPress={() => void save()} loading={saving} />
      {exists && (
        <Button title="Remove period" danger secondary onPress={remove} disabled={saving} />
      )}
    </Sheet>
  );
}

export function ScheduleScreen({
  onOpen,
  onUpload,
}: {
  onOpen: (id: string) => void;
  onUpload: () => void;
}) {
  const { state, update } = useApp();
  const [offset, setOffset] = useState(1);
  const [editing, setEditing] = useState<Period>();
  const [assigning, setAssigning] = useState<Period>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const today = useToday();
  const date = dayOffset(today, offset);
  const dateKey = localDate(date);
  const periods = periodsForDate(state.periods, date);
  const ready = periods.filter((p) => {
    const assignment = state.assignments.find((a) => a.periodId === p.id && a.date === dateKey);
    return state.lessons.some((l) => l.id === assignment?.lessonId && l.pack);
  }).length;
  const assign = async (lessonId?: string) => {
    if (!assigning) return;
    setSaving(true);
    setError(undefined);
    try {
      await update((s) => ({
        ...s,
        assignments: [
          ...s.assignments.filter((a) => !(a.periodId === assigning.id && a.date === dateKey)),
          ...(lessonId ? [{ periodId: assigning.id, date: dateKey, lessonId }] : []),
        ],
      }));
      setAssigning(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign this lesson.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Page>
        <View style={s.between}>
          <View style={{ gap: 5 }}>
            <Text style={s.title}>Your rhythm</Text>
            <Text style={s.muted}>Tomorrow feels better with a plan.</Text>
          </View>
          <IconButton
            name="add-outline"
            label="Add a recurring period"
            onPress={() => setEditing(blankPeriod())}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {Array.from({ length: 7 }, (_, n) => (
            <Chip
              key={n}
              title={
                n === 0
                  ? 'Today'
                  : n === 1
                    ? 'Tomorrow'
                    : dayOffset(today, n).toLocaleDateString(undefined, {
                        weekday: 'short',
                        day: 'numeric',
                      })
              }
              active={offset === n}
              onPress={() => setOffset(n)}
            />
          ))}
        </ScrollView>
        <View style={s.between}>
          <View>
            <Text style={s.heading}>{date.toLocaleDateString(undefined, { weekday: 'long' })}</Text>
            <Text style={s.muted}>
              {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </Text>
          </View>
          {periods.length > 0 && <Badge text={`${ready} / ${periods.length} prepared`} />}
        </View>
        {periods.map((period, index) => {
          const assignment = state.assignments.find(
            (a) => a.periodId === period.id && a.date === dateKey,
          );
          const lesson = state.lessons.find((l) => l.id === assignment?.lessonId);
          return (
            <View key={period.id} style={[s.row, { alignItems: 'stretch', gap: 14 }]}>
              <View style={{ alignItems: 'center', width: 43, paddingTop: 20 }}>
                <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '500' }}>
                  {period.start}
                </Text>
                <Text style={[s.muted, { fontSize: 10 }]}>{period.end}</Text>
                {index !== periods.length - 1 && (
                  <View
                    style={{ flex: 1, width: 1, backgroundColor: colors.line, marginTop: 12 }}
                  />
                )}
              </View>
              <View
                style={[
                  s.card,
                  s.flex,
                  { borderLeftWidth: 3, borderLeftColor: period.color, padding: 17, gap: 11 },
                ]}
              >
                <View style={s.between}>
                  <View style={s.flex}>
                    <Text style={s.heading}>{period.subject}</Text>
                    {Boolean(period.room) && (
                      <Text style={[s.muted, { fontSize: 12 }]}>{period.room}</Text>
                    )}
                  </View>
                  <IconButton
                    name="ellipsis-horizontal"
                    label={`Edit ${period.subject} period`}
                    onPress={() => setEditing(period)}
                  />
                </View>
                {lesson ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onOpen(lesson.id)}
                      style={[
                        s.row,
                        { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
                      ]}
                    >
                      <Icon
                        name={lesson.pack ? 'checkmark-circle-outline' : 'document-outline'}
                        color={lesson.pack ? colors.accent : colors.muted}
                        size={18}
                      />
                      <View style={s.flex}>
                        <Text numberOfLines={2} style={{ fontSize: 14, color: colors.ink }}>
                          {lesson.title}
                        </Text>
                        <Text style={[s.muted, { fontSize: 11 }]}>
                          {lesson.pack ? 'Study pack ready' : 'Attached · awaiting generation'}
                        </Text>
                      </View>
                      <Icon name="chevron-forward-outline" size={14} color={colors.muted} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setError(undefined);
                        setAssigning(period);
                      }}
                    >
                      <Text style={{ color: colors.accent, fontSize: 12, paddingVertical: 5 }}>
                        Change lesson
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setError(undefined);
                      setAssigning(period);
                    }}
                    style={[
                      s.row,
                      { backgroundColor: colors.faint, borderRadius: 10, padding: 12 },
                    ]}
                  >
                    <Icon name="add-outline" size={16} color={colors.accent} />
                    <Text style={{ color: colors.accent, fontSize: 13 }}>Attach a lesson</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
        {!periods.length && (
          <Empty
            icon="calendar-outline"
            title={state.periods.length ? 'A little breathing room' : 'Set your weekly rhythm'}
            description={
              state.periods.length
                ? 'No classes on this day. Add a period or enjoy the room to catch up.'
                : 'Add your subjects, class times, and the days they repeat. Then attach lessons for tomorrow.'
            }
          />
        )}
        <Button
          title="Customize periods"
          icon="options-outline"
          secondary
          onPress={() => setEditing(blankPeriod())}
        />
        {state.periods.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={s.label}>Weekly periods</Text>
            {[...state.periods]
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((period) => (
                <Pressable
                  key={period.id}
                  accessibilityRole="button"
                  onPress={() => setEditing(period)}
                  style={[
                    s.between,
                    { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
                  ]}
                >
                  <View style={[s.row, s.flex]}>
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: period.color,
                      }}
                    />
                    <View style={s.flex}>
                      <Text style={{ color: colors.ink, fontSize: 14 }}>{period.subject}</Text>
                      <Text style={[s.muted, { fontSize: 11 }]}>
                        {DAY_OPTIONS.filter((d) => period.days.includes(d.day))
                          .map((d) => d.name.slice(0, 2))
                          .join(' · ')}{' '}
                        · {period.start}–{period.end}
                      </Text>
                    </View>
                  </View>
                  <Icon name="create-outline" size={18} color={colors.muted} />
                </Pressable>
              ))}
          </View>
        )}
      </Page>
      {editing && (
        <PeriodEditor key={editing.id} period={editing} onClose={() => setEditing(undefined)} />
      )}
      <Sheet
        visible={Boolean(assigning)}
        title={`Lesson for ${assigning?.subject ?? 'class'}`}
        onClose={() => {
          if (!saving) setAssigning(undefined);
        }}
      >
        <Text style={s.muted}>
          Choose a lesson for{' '}
          {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}.
          This assignment is just for this day.
        </Text>
        {state.lessons.map((lesson) => (
          <Pressable
            key={lesson.id}
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void assign(lesson.id)}
            style={s.card}
          >
            <Text style={s.heading}>{lesson.title}</Text>
            <Text style={s.muted}>
              {lesson.subject || 'General'} ·{' '}
              {lesson.pack ? 'Study pack ready' : 'Not generated yet'}
            </Text>
          </Pressable>
        ))}
        {!state.lessons.length && (
          <Empty title="Add a lesson first" description="Your attached lessons will appear here.">
            <Button
              title="Attach a new lesson"
              onPress={() => {
                setAssigning(undefined);
                onUpload();
              }}
            />
          </Empty>
        )}
        <ErrorMessage message={error} />
        {state.lessons.length > 0 && (
          <Button
            title="Remove lesson assignment"
            secondary
            disabled={saving}
            onPress={() => void assign()}
          />
        )}
      </Sheet>
    </>
  );
}
