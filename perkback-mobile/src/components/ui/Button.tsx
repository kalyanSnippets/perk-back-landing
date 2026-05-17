import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PB, FONTS } from '../../constants/theme';

type ButtonKind = 'primary' | 'gold' | 'ghost' | 'dark' | 'glass';

interface ButtonProps {
  children: React.ReactNode;
  kind?: ButtonKind;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  height?: number;
}

export function Button({
  children,
  kind = 'primary',
  onPress,
  style,
  textStyle,
  disabled,
  loading,
  icon,
  iconRight,
  height = 52,
}: ButtonProps) {
  const isGold = kind === 'gold';

  const containerStyle: ViewStyle = {
    height,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    ...(kind === 'ghost' && {
      borderWidth: 1,
      borderColor: PB.border,
      backgroundColor: PB.card,
    }),
    ...(kind === 'primary' && { backgroundColor: PB.primary }),
    ...(kind === 'dark' && { backgroundColor: '#0b0d12' }),
    ...(kind === 'glass' && {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    }),
    ...style,
  };

  const textColor =
    kind === 'ghost'
      ? PB.fg
      : kind === 'gold'
        ? PB.primary
        : '#ffffff';

  const inner = (
    <>
      {icon && !loading && icon}
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }, textStyle]}>
          {children}
        </Text>
      )}
      {iconRight && !loading && iconRight}
    </>
  );

  if (isGold) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85} style={{ borderRadius: 14, overflow: 'hidden', ...style }}>
        <LinearGradient
          colors={['#ffd07a', '#f7b94a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[containerStyle, { backgroundColor: 'transparent' }, style]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {icon && !loading && icon}
            {loading ? (
              <ActivityIndicator color={textColor} />
            ) : (
              <Text style={[styles.label, { color: textColor }, textStyle]}>
                {children}
              </Text>
            )}
            {iconRight && !loading && iconRight}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={containerStyle}
    >
      {inner}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
