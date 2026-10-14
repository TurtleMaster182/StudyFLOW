import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { Settings } from '../domain/types';
import { Button, Chip, ErrorMessage, Field, Icon, Page } from '../ui/components';
import { colors, styles as s } from '../ui/theme';

export function SettingsScreen({ onSaved }: { onSaved: () => void }) {
  const { state, apiKey, saveSettings } = useApp();
  const [key, setKey] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [model, setModel] = useState(state.settings.model);
  const [count, setCount] = useState<Settings['questionCount']>(state.settings.questionCount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await saveSettings({ model, questionCount: count }, key);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Page>
      <Text style={s.title}>Make it yours</Text>
      <Text style={s.muted}>Your key. Your pace. Your study space.</Text>
      <Text style={s.label}>AI connection</Text>
      <View style={s.card}>
        <View style={s.row}>
          <Icon name="key-outline" color={colors.accent} />
          <Text style={s.heading}>OpenAI</Text>
        </View>
        <Text style={s.muted}>
          Add your own API key to turn lesson photos and PDFs into practice.
        </Text>
        <Field
          label="API key"
          placeholder="sk-…"
          value={key}
          onChangeText={setKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!show}
          maxLength={512}
          editable={!saving}
        />
        <View style={s.between}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShow((v) => !v)}
            style={{ paddingVertical: 8 }}
          >
            <Text style={{ color: colors.accent, fontSize: 13 }}>
              {show ? 'Hide key' : 'Show key'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void Linking.openURL('https://platform.openai.com/api-keys').catch(() =>
                setError('Open platform.openai.com/api-keys in your browser.'),
              )
            }
          >
            <Text style={{ color: colors.accent, fontSize: 13 }}>Get an API key ↗</Text>
          </Pressable>
        </View>
        <Text style={[s.muted, { fontSize: 12 }]}>
          Stored in your device’s secure storage. Used directly with OpenAI; no Study flow account
          needed. Leave the field blank to remove it.
        </Text>
      </View>
      <Field
        label="Model"
        value={model}
        onChangeText={setModel}
        placeholder="gpt-4.1-mini"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={100}
        editable={!saving}
      />
      <Text style={[s.muted, { fontSize: 12, marginTop: -12 }]}>
        Use an OpenAI model that supports images, PDF inputs, and structured output. gpt-4.1-mini is
        the default.
      </Text>
      <View style={{ gap: 12 }}>
        <Text style={s.label}>Questions per quiz</Text>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          {([5, 8, 10] as const).map((value) => (
            <Chip
              key={value}
              title={`${value} questions`}
              active={count === value}
              onPress={() => setCount(value)}
            />
          ))}
        </View>
        <Text style={[s.muted, { fontSize: 12 }]}>
          Applies to new study packs. Each includes five recap questions.
        </Text>
      </View>
      <View style={[s.card, { backgroundColor: colors.accentLight, borderColor: 'transparent' }]}>
        <View style={s.row}>
          <Icon name="leaf-outline" color={colors.accent} />
          <Text style={[s.heading, { fontSize: 16 }]}>A little lighter on tokens</Text>
        </View>
        <Text style={s.muted}>
          We create a quiz and recap together, once per lesson. Practicing, retaking a quiz, and
          revealing answers use the saved set. Identical files reuse the existing lesson.
        </Text>
      </View>
      <ErrorMessage message={error} />
      <Button title="Save settings" loading={saving} onPress={() => void save()} />
      <Text style={[s.muted, { fontSize: 12 }]}>
        Generation sends attached sources and your focus note to OpenAI and uses your API billing.
        Lessons and practice history stay on this device. Generated answers should be checked
        against the source.
      </Text>
    </Page>
  );
}
