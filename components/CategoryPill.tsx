import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category } from '@/lib/types';
import Colors from '@/constants/colors';

interface Props {
  category: Category;
}

const CATEGORY_COLORS: Record<Category, string> = {
  economy: Colors.economy,
  geopolitics: Colors.geopolitics,
  technology: Colors.technology,
  science: Colors.science,
  health: Colors.health,
  climate: Colors.climate,
  legal: Colors.legal,
  security: Colors.security,
};

const CATEGORY_LABELS: Record<Category, string> = {
  economy: 'Economy',
  geopolitics: 'Geopolitics',
  technology: 'Technology',
  science: 'Science',
  health: 'Health',
  climate: 'Climate',
  legal: 'Legal',
  security: 'Security',
};

export function CategoryPill({ category }: Props) {
  const color = CATEGORY_COLORS[category];
  return (
    <View style={[styles.pill, { backgroundColor: color + '18' }]}>
      <Text style={[styles.label, { color }]}>{CATEGORY_LABELS[category]}</Text>
    </View>
  );
}

export { CATEGORY_COLORS, CATEGORY_LABELS };

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
});
