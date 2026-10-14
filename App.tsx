import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/state/AppContext';
import { Tab } from './src/domain/types';
import { Button, ErrorMessage, Icon, IconButton, IconName } from './src/ui/components';
import { colors, styles as s } from './src/ui/theme';
import { StudyScreen } from './src/screens/StudyScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { LessonScreen } from './src/screens/LessonScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { RecapScreen } from './src/screens/RecapScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ImportSheet } from './src/screens/ImportSheet';

type Route =
  { type: 'tabs' } | { type: 'lesson' | 'quiz' | 'recap'; id: string } | { type: 'settings' };
const TABS: { id: Tab; title: string; icon: IconName; activeIcon: IconName }[] = [
  { id: 'study', title: 'Study', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { id: 'lessons', title: 'Lessons', icon: 'documents-outline', activeIcon: 'documents' },
  { id: 'recap', title: 'Recap', icon: 'repeat-outline', activeIcon: 'repeat' },
  { id: 'schedule', title: 'Periods', icon: 'calendar-outline', activeIcon: 'calendar' },
];

function AppShell() {
  const { loading, loadError, saveError, reload, update } = useApp();
  const [tab, setTab] = useState<Tab>('study');
  const [routes, setRoutes] = useState<Route[]>([{ type: 'tabs' }]);
  const [importing, setImporting] = useState(false);
  const route = routes[routes.length - 1];
  const push = (next: Route) => setRoutes((stack) => [...stack, next]);
  const pop = () => setRoutes((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  const goBack = () => {
    if (route.type === 'quiz')
      Alert.alert('Leave this quiz?', 'This attempt will not be recorded until you finish.', [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Leave quiz', onPress: pop },
      ]);
    else pop();
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (importing) return false;
      if (routes.length > 1) {
        goBack();
        return true;
      }
      if (tab !== 'study') {
        setTab('study');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [routes, tab, importing]);
  const open = (id: string) => push({ type: 'lesson', id });
  const upload = () => setImporting(true);

  if (loading)
    return (
      <SafeAreaView style={[s.page, { justifyContent: 'center', alignItems: 'center', gap: 16 }]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={s.muted}>Opening your study space…</Text>
      </SafeAreaView>
    );
  if (loadError)
    return (
      <SafeAreaView style={[s.page, { justifyContent: 'center', padding: 26, gap: 20 }]}>
        <Text style={s.title}>Your library is still here.</Text>
        <ErrorMessage message={loadError} />
        <Text style={s.muted}>We haven’t replaced your saved data. Try reopening it.</Text>
        <Button title="Try again" onPress={() => void reload()} />
      </SafeAreaView>
    );

  let content: React.ReactNode;
  if (route.type === 'lesson')
    content = (
      <LessonScreen
        id={route.id}
        onQuiz={() => push({ type: 'quiz', id: route.id })}
        onRecap={() => push({ type: 'recap', id: route.id })}
        onSettings={() => push({ type: 'settings' })}
        onDeleted={() => setRoutes([{ type: 'tabs' }])}
      />
    );
  else if (route.type === 'quiz')
    content = <QuizScreen key={route.id} id={route.id} onDone={pop} />;
  else if (route.type === 'recap')
    content = <RecapScreen key={route.id} initialLessonId={route.id} onUpload={upload} />;
  else if (route.type === 'settings') content = <SettingsScreen onSaved={pop} />;
  else if (tab === 'lessons') content = <LibraryScreen onOpen={open} onUpload={upload} />;
  else if (tab === 'recap') content = <RecapScreen onUpload={upload} />;
  else if (tab === 'schedule') content = <ScheduleScreen onOpen={open} onUpload={upload} />;
  else
    content = (
      <StudyScreen
        onUpload={upload}
        onOpen={open}
        onSchedule={() => setTab('schedule')}
        onSettings={() => push({ type: 'settings' })}
      />
    );

  return (
    <SafeAreaView style={s.page}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            s.between,
            {
              paddingHorizontal: 16,
              minHeight: 62,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
            },
          ]}
        >
          {route.type === 'tabs' ? (
            <View style={[s.row, { paddingLeft: 8, gap: 7 }]}>
              <Icon name="sparkles" color={colors.accent} size={18} />
              <Text
                style={{ color: colors.ink, fontSize: 20, fontWeight: '600', letterSpacing: -0.7 }}
              >
                study <Text style={{ fontWeight: '400', color: colors.accent }}>flow</Text>
                <Text style={{ color: colors.accent }}>.</Text>
              </Text>
            </View>
          ) : (
            <View style={s.row}>
              <IconButton name="arrow-back-outline" label="Go back" onPress={goBack} />
              <Text style={{ fontSize: 15, color: colors.ink, fontWeight: '500' }}>
                {route.type === 'quiz'
                  ? 'A little practice'
                  : route.type === 'settings'
                    ? 'Settings'
                    : route.type === 'recap'
                      ? 'Recap'
                      : 'Your lesson'}
              </Text>
            </View>
          )}
          {route.type !== 'settings' && route.type !== 'quiz' && (
            <IconButton
              name="options-outline"
              label="Open Settings"
              onPress={() => push({ type: 'settings' })}
            />
          )}
        </View>
        {saveError && (
          <View style={{ padding: 12, gap: 8 }}>
            <ErrorMessage message={saveError} />
            <Button
              title="Retry save"
              secondary
              onPress={() => void update((state) => state).catch(() => undefined)}
            />
          </View>
        )}
        <View style={s.flex}>{content}</View>
        {route.type === 'tabs' && (
          <View
            accessibilityRole="tablist"
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderTopColor: colors.line,
              backgroundColor: colors.bg,
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            {TABS.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityLabel={item.title}
                accessibilityState={{ selected: tab === item.id }}
                onPress={() => setTab(item.id)}
                style={{
                  flex: 1,
                  minHeight: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 5,
                    borderRadius: 14,
                    backgroundColor: tab === item.id ? colors.accentLight : 'transparent',
                  }}
                >
                  <Icon
                    name={tab === item.id ? item.activeIcon : item.icon}
                    color={tab === item.id ? colors.accent : colors.muted}
                    size={21}
                  />
                </View>
                <Text
                  style={{
                    color: tab === item.id ? colors.accent : colors.muted,
                    fontSize: 10,
                    fontWeight: tab === item.id ? '600' : '400',
                  }}
                >
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <ImportSheet visible={importing} onClose={() => setImporting(false)} onCreated={open} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
