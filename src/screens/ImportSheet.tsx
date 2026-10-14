import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { PickedFile, pickDocuments, pickPhotos, MAX_FILES } from '../services/files';
import { Button, ErrorMessage, Field, Icon, IconButton, Sheet } from '../ui/components';
import { colors, styles as s } from '../ui/theme';

export function ImportSheet({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { importLesson, apiKey, generate } = useApp();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [working, setWorking] = useState(false);
  const pick = async (type: 'files' | 'photos' | 'camera') => {
    setError(undefined);
    try {
      const added = type === 'files' ? await pickDocuments() : await pickPhotos(type === 'camera');
      if (added.length + files.length > MAX_FILES)
        throw new Error(`Attach up to ${MAX_FILES} files per lesson.`);
      setFiles((existing) => [...existing, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open that file.');
    }
  };
  const close = () => {
    if (!working) {
      setFiles([]);
      setTitle('');
      setSubject('');
      setNote('');
      setError(undefined);
      onClose();
    }
  };
  const submit = async () => {
    setWorking(true);
    setError(undefined);
    try {
      const lesson = await importLesson(files, title, subject, note);
      setFiles([]);
      setTitle('');
      setSubject('');
      setNote('');
      onClose();
      onCreated(lesson.id);
      if (apiKey && !lesson.pack) void generate(lesson.id).catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your lesson.');
    } finally {
      setWorking(false);
    }
  };
  return (
    <Sheet visible={visible} title="A new lesson" onClose={close}>
      <Text style={s.muted}>A few photos. A PDF. One less thing to worry about.</Text>
      <View
        style={[
          s.card,
          {
            borderStyle: 'dashed',
            backgroundColor: 'transparent',
            paddingVertical: 28,
            alignItems: 'center',
          },
        ]}
      >
        <Icon name="documents-outline" size={30} color={colors.accent} />
        <Text style={s.heading}>Bring your lesson here</Text>
        <Text style={[s.muted, { textAlign: 'center' }]}>
          PDF, JPEG, PNG or WebP · up to 8 files{'\n'}20 MB total per lesson
        </Text>
        <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
          {(['files', 'photos', 'camera'] as const).map((type) => (
            <Pressable
              key={type}
              accessibilityRole="button"
              disabled={working}
              onPress={() => void pick(type)}
              style={{ backgroundColor: colors.faint, borderRadius: 10, padding: 12 }}
            >
              <Text style={{ color: colors.accent, fontWeight: '500' }}>
                {type === 'files' ? 'Files' : type === 'photos' ? 'Photos' : 'Camera'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {files.map((file, i) => (
        <View key={`${file.uri}-${i}`} style={s.row}>
          <Icon
            name={
              file.name.toLowerCase().endsWith('.pdf') ? 'document-text-outline' : 'image-outline'
            }
            color={colors.muted}
          />
          <Text numberOfLines={1} style={[s.muted, s.flex]}>
            {file.name}
          </Text>
          <IconButton
            name="close-circle-outline"
            label={`Remove ${file.name}`}
            disabled={working}
            onPress={() => setFiles((f) => f.filter((_, index) => index !== i))}
          />
        </View>
      ))}
      <Field
        label="Lesson title"
        placeholder="e.g. Cell division"
        value={title}
        onChangeText={setTitle}
        editable={!working}
        maxLength={120}
      />
      <Field
        label="Subject"
        placeholder="e.g. Biology"
        value={subject}
        onChangeText={setSubject}
        editable={!working}
        maxLength={80}
      />
      <Field
        label="Anything to focus on? (optional)"
        placeholder="e.g. Include practice with equations"
        value={note}
        onChangeText={setNote}
        multiline
        editable={!working}
        maxLength={1000}
      />
      <ErrorMessage message={error} />
      <Button
        title={apiKey ? 'Add lesson & make study pack' : 'Add lesson'}
        icon="arrow-up-outline"
        disabled={!files.length}
        loading={working}
        onPress={() => void submit()}
      />
      <Text style={[s.muted, { fontSize: 12, textAlign: 'center' }]}>
        {apiKey
          ? 'Sources are sent to OpenAI to create one quiz and recap set. Future practice reuses the saved questions.'
          : 'You can add your OpenAI key in Settings when you’re ready to generate.'}
      </Text>
    </Sheet>
  );
}
