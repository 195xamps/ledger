import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useCategoryStats } from '@/lib/api';
import { CATEGORIES } from '@/lib/mockData';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/components/CategoryPill';
import { Category } from '@/lib/types';

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  economy: 'bar-chart-2',
  geopolitics: 'globe',
  technology: 'cpu',
  science: 'zap',
  health: 'heart',
  climate: 'thermometer',
  legal: 'briefcase',
  security: 'shield',
};

export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const { data: categoryStats, isLoading } = useCategoryStats();

  // Build a lookup from API data
  const statsMap = new Map(
    (categoryStats ?? []).map(s => [s.category, s])
  );

  const totalUpdates = (categoryStats ?? []).reduce(
    (acc, s) => acc + s.updatesToday, 0
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 0 : insets.top + 8 }]}>
        <Text style={styles.title}>TOPICS</Text>
        <Text style={styles.subtitle}>
          {isLoading ? 'Loading...' : `${totalUpdates} updates today across all categories`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.tint} size="small" />
          </View>
        ) : (
          <View style={styles.grid}>
            {CATEGORIES.map(cat => {
              const color = CATEGORY_COLORS[cat.id as Category];
              const stats = statsMap.get(cat.id);
              const updateCount = stats?.updatesToday ?? 0;
              const factCount = stats?.count ?? 0;
              const iconName = CATEGORY_ICONS[cat.id];

              return (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [
                    styles.card,
                    { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                >
                  <View style={[styles.cardIconBg, { backgroundColor: color + '15' }]}>
                    <Feather name={iconName} size={22} color={color} />
                  </View>

                  <Text style={styles.cardLabel}>{CATEGORY_LABELS[cat.id as Category]}</Text>

                  <View style={styles.cardStats}>
                    <Text style={styles.factCount}>{factCount} facts</Text>
                    {updateCount > 0 ? (
                      <View style={[styles.updateBadge, { backgroundColor: color + '20' }]}>
                        <View style={[styles.updateDot, { backgroundColor: color }]} />
                        <Text style={[styles.updateText, { color }]}>
                          {updateCount} today
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noUpdateText}>No updates</Text>
                    )}
                  </View>

                  <View style={[styles.cardBorder, { backgroundColor: color }]} />
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SIGNAL SOURCES</Text>
          <Text style={styles.sectionSubtitle}>
            Facts are sourced from primary, wire, and reporting-tier outlets
          </Text>

          {[
            { tier: 'Primary', desc: 'Government data, official statements', color: Colors.confirmed },
            { tier: 'Wire', desc: 'AP, Reuters — corroboration required', color: Colors.tint },
            { tier: 'Reporting', desc: 'NYT, WSJ, Bloomberg', color: Colors.high },
            { tier: 'Analysis', desc: 'Expert interpretation, labeled separately', color: Colors.low },
          ].map(source => (
            <View key={source.tier} style={styles.sourceRow}>
              <View style={[styles.tierDot, { backgroundColor: source.color }]} />
              <View style={styles.sourceInfo}>
                <Text style={styles.tierLabel}>{source.tier}</Text>
                <Text style={styles.tierDesc}>{source.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    letterSpacing: 0.2,
  },
  content: {
    padding: 12,
    gap: 20,
  },
  loading: {
    paddingTop: 40,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    overflow: 'hidden',
  },
  cardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  cardStats: {
    gap: 5,
  },
  factCount: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  updateDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  updateText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  noUpdateText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  cardBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: -4,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  sourceInfo: {
    flex: 1,
    gap: 2,
  },
  tierLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  tierDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});
