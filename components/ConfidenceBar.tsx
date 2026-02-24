import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConfidenceLevel } from '@/lib/types';
import Colors from '@/constants/colors';

interface Props {
  level: ConfidenceLevel;
  showLabel?: boolean;
}

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string; fill: number }> = {
  confirmed: { label: 'Confirmed', color: Colors.confirmed, fill: 1.0 },
  developing: { label: 'Developing', color: Colors.developing, fill: 0.55 },
  disputed: { label: 'Disputed', color: Colors.disputed, fill: 0.35 },
  retracted: { label: 'Retracted', color: Colors.retracted, fill: 0.1 },
};

export function ConfidenceBar({ level, showLabel = true }: Props) {
  const config = CONFIDENCE_CONFIG[level];
  return (
    <View style={styles.container}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { backgroundColor: config.color, flex: config.fill }]} />
        <View style={{ flex: 1 - config.fill }} />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
});
