import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ImportanceLevel } from '@/lib/types';
import Colors from '@/constants/colors';

interface Props {
  level: ImportanceLevel;
}

const LABELS: Record<ImportanceLevel, string> = {
  breaking: 'BREAKING',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

const BADGE_COLORS: Record<ImportanceLevel, string> = {
  breaking: Colors.breaking,
  high: Colors.high,
  medium: Colors.medium,
  low: Colors.low,
};

export function ImportanceBadge({ level }: Props) {
  const color = BADGE_COLORS[level];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      {level === 'breaking' && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.label, { color }]}>{LABELS[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
});
