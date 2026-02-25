import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Fact } from '@/lib/types';
import { formatTimeAgo } from '@/lib/api';
import Colors from '@/constants/colors';
import { ImportanceBadge } from './ImportanceBadge';
import { CategoryPill, CATEGORY_COLORS } from './CategoryPill';
import { ConfidenceBar } from './ConfidenceBar';

interface Props {
  fact: Fact;
}

export function FactCard({ fact }: Props) {
  const latestRevision = fact.timeline[0];
  const categoryColor = CATEGORY_COLORS[fact.category];

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push({ pathname: '/fact/[id]', params: { id: fact.id } });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <View style={[styles.categoryStripe, { backgroundColor: categoryColor }]} />

      <View style={styles.inner}>
        <View style={styles.header}>
          <ImportanceBadge level={fact.importance} />
          <View style={{ flex: 1 }} />
          <CategoryPill category={fact.category} />
        </View>

        <Text style={styles.headline} numberOfLines={2}>
          {fact.headline}
        </Text>

        <Text style={styles.currentValue} numberOfLines={1}>
          {fact.currentValue}
        </Text>

        {latestRevision?.previousValue && (
          <View style={styles.diffContainer}>
            <View style={styles.deltaHeader}>
              <Feather name="git-merge" size={11} color={Colors.textTertiary} />
              <Text style={styles.deltaLabel}>CHANGE</Text>
            </View>
            <View style={styles.diffRows}>
              <View style={[styles.diffRow, { backgroundColor: Colors.diffOld }]}>
                <Feather name="minus" size={10} color={Colors.diffOldText} />
                <Text style={[styles.diffText, { color: Colors.diffOldText }]} numberOfLines={1}>
                  {latestRevision.previousValue}
                </Text>
              </View>
              <View style={[styles.diffRow, { backgroundColor: Colors.diffNew }]}>
                <Feather name="plus" size={10} color={Colors.diffNewText} />
                <Text style={[styles.diffText, { color: Colors.diffNewText }]} numberOfLines={1}>
                  {latestRevision.newValue}
                </Text>
              </View>
            </View>
          </View>
        )}

        {latestRevision?.whyItMatters && (
          <Text style={styles.whyText} numberOfLines={2}>
            {latestRevision.whyItMatters}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Feather name="link" size={11} color={Colors.textTertiary} />
            <Text style={styles.sourceText} numberOfLines={1}>
              {fact.sources[0]?.name}
            </Text>
            <Text style={styles.divider}>·</Text>
            <Text style={styles.timeText}>{formatTimeAgo(fact.lastUpdated)}</Text>
          </View>
          <Feather name="chevron-right" size={14} color={Colors.textTertiary} />
        </View>

        <View style={styles.confidenceRow}>
          <ConfidenceBar level={fact.confidence} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
  },
  categoryStripe: {
    width: 3,
  },
  inner: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headline: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  currentValue: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: -4,
  },
  diffContainer: {
    gap: 4,
  },
  deltaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deltaLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  diffRows: {
    gap: 2,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  diffText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  whyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textTertiary,
  },
  divider: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  confidenceRow: {
    marginTop: -2,
  },
});
