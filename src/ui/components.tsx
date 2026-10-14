import React, { ComponentProps } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, styles as s } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  size = 21,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function IconButton({
  name,
  label,
  onPress,
  disabled,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: pressed ? colors.faint : 'transparent',
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary,
  disabled,
  loading,
  danger,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
}) {
  const foreground = secondary ? (danger ? colors.error : colors.ink) : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: 15,
        paddingHorizontal: 18,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 9,
        backgroundColor: secondary ? colors.faint : danger ? colors.error : colors.ink,
        opacity: disabled || loading ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : icon ? (
        <Icon name={icon} size={18} color={foreground} />
      ) : null}
      <Text style={{ color: foreground, fontSize: 15, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}
export function Chip({
  title,
  active,
  onPress,
}: {
  title: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 42,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.line,
        backgroundColor: active ? colors.accentLight : colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: active ? colors.accent : colors.muted,
          fontSize: 13,
          fontWeight: active ? '600' : '400',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[s.muted, { color: colors.ink, fontWeight: '500' }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#97A096"
        {...props}
        style={[
          s.field,
          props.multiline && { minHeight: 90, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function Badge({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: muted ? colors.faint : colors.accentLight,
      }}
    >
      <Text
        style={{ color: muted ? colors.muted : colors.accent, fontSize: 11, fontWeight: '500' }}
      >
        {text}
      </Text>
    </View>
  );
}
export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      style={{
        padding: 14,
        backgroundColor: colors.errorLight,
        borderRadius: 12,
        flexDirection: 'row',
        gap: 9,
      }}
    >
      <Icon name="alert-circle-outline" size={19} color={colors.error} />
      <Text selectable style={{ color: colors.error, fontSize: 14, lineHeight: 21, flex: 1 }}>
        {message}
      </Text>
    </View>
  );
}
export function BotMark({ small = false }: { small?: boolean }) {
  return (
    <View
      style={{
        width: small ? 29 : 48,
        height: small ? 29 : 48,
        borderRadius: small ? 10 : 17,
        backgroundColor: colors.accentLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="sparkles-outline" size={small ? 16 : 25} color={colors.accent} />
    </View>
  );
}
export function Empty({
  icon = 'leaf-outline',
  title,
  description,
  children,
}: {
  icon?: IconName;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 14 }}>
      <View style={{ padding: 18, backgroundColor: colors.faint, borderRadius: 24 }}>
        <Icon name={icon} size={28} color={colors.accent} />
      </View>
      <Text style={[s.heading, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[s.muted, { textAlign: 'center', maxWidth: 300 }]}>{description}</Text>
      {children && <View style={{ marginTop: 6, width: '100%' }}>{children}</View>}
    </View>
  );
}
export function Page({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.page}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.between, { paddingHorizontal: 22, paddingVertical: 10 }]}>
            <Text style={s.heading}>{title}</Text>
            <IconButton name="close-outline" label="Close" onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
export const ui = StyleSheet.create({
  sectionLabel: { marginTop: 8, marginBottom: -2 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '600' },
});
