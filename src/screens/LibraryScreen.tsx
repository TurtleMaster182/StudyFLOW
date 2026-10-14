import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { Badge, Button, Chip, Empty, Icon, Page } from '../ui/components';
import { colors, styles as s } from '../ui/theme';

export function LibraryScreen({
  onOpen,
  onUpload,
}: {
  onOpen: (id: string) => void;
  onUpload: () => void;
}) {
  const { state, busy } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const lessons = state.lessons.filter(
    (l) =>
      `${l.title} ${l.subject}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'All' || (filter === 'Ready' ? Boolean(l.pack) : !l.pack)),
  );
  return (
    <Page>
      <View style={s.between}>
        <View style={{ gap: 5 }}>
          <Text style={s.title}>Your lessons</Text>
          <Text style={s.muted}>A small library. A lot of possibility.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add lesson"
          onPress={onUpload}
          style={{ backgroundColor: colors.ink, borderRadius: 14, padding: 12 }}
        >
          <Icon name="add-outline" color="#FFFFFF" />
        </Pressable>
      </View>
      <View style={[s.row, s.field, { paddingVertical: 0 }]}>
        <Icon name="search-outline" color={colors.muted} size={18} />
        <TextInput
          accessibilityLabel="Search lessons"
          placeholder="Find a lesson or subject"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, minHeight: 50, fontSize: 15, color: colors.ink }}
        />
      </View>
      <View style={s.row}>
        {['All', 'Ready', 'Waiting'].map((f) => (
          <Chip key={f} title={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      {lessons.map((lesson) => (
        <Pressable
          key={lesson.id}
          accessibilityRole="button"
          onPress={() => onOpen(lesson.id)}
          style={s.card}
        >
          <View style={s.between}>
            <Badge text={lesson.subject || 'General'} muted />
            <Icon name="arrow-forward-outline" size={17} color={colors.muted} />
          </View>
          <Text style={s.heading}>{lesson.title}</Text>
          <Text numberOfLines={2} style={s.muted}>
            {lesson.pack?.summary ??
              (busy.includes(lesson.id)
                ? 'Making your study pack…'
                : lesson.error
                  ? 'Needs another look. Open to retry.'
                  : 'Your lesson is attached and ready to generate.')}
          </Text>
          <View
            style={[s.between, { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.line }]}
          >
            <Text style={[s.muted, { fontSize: 12 }]}>
              {lesson.pack
                ? `${lesson.pack.quiz.length} quiz · ${lesson.pack.recap.length} recap`
                : `${lesson.attachments.length} source file${lesson.attachments.length === 1 ? '' : 's'}`}
            </Text>
            <Text style={{ color: lesson.pack ? colors.accent : colors.muted, fontSize: 12 }}>
              {lesson.attempts.length
                ? `${Math.round((100 * lesson.attempts.at(-1)!.correct) / lesson.attempts.at(-1)!.total)}% last quiz`
                : lesson.pack
                  ? 'Ready to practice'
                  : busy.includes(lesson.id)
                    ? 'Generating'
                    : 'Waiting'}
            </Text>
          </View>
        </Pressable>
      ))}
      {!lessons.length && (
        <Empty
          icon="documents-outline"
          title={state.lessons.length ? 'No lessons found' : 'Your next lesson starts here'}
          description={
            state.lessons.length
              ? 'Try a different search or filter.'
              : 'Attach lesson photos or a PDF. We’ll help turn them into practice.'
          }
        >
          {!state.lessons.length && <Button title="Add your first lesson" onPress={onUpload} />}
        </Empty>
      )}
    </Page>
  );
}
