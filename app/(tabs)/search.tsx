import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { searchFacts, MOCK_FACTS } from '@/lib/mockData';
import { FactCard } from '@/components/FactCard';
import { Fact, ConfidenceLevel } from '@/lib/types';

const CONFIDENCE_FILTERS: { id: 'all' | ConfidenceLevel; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'developing', label: 'Developing' },
  { id: 'disputed', label: 'Disputed' },
];

const CONFIDENCE_COLORS: Record<string, string> = {
  all: Colors.tint,
  confirmed: Colors.confirmed,
  developing: Colors.developing,
  disputed: Colors.disputed,
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | ConfidenceLevel>('all');

  let results: Fact[] = query.trim().length > 1
    ? searchFacts(query.trim())
    : MOCK_FACTS;

  if (confidenceFilter !== 'all') {
    results = results.filter(f => f.confidence === confidenceFilter);
  }

  const trendingFacts = [...MOCK_FACTS]
    .sort((a, b) => b.timeline.length - a.timeline.length)
    .slice(0, 3);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 0 : insets.top + 8 }]}>
        <Text style={styles.title}>SEARCH</Text>

        <View style={styles.inputWrapper}>
          <Feather name="search" size={16} color={Colors.textTertiary} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search facts, topics, sources..."
            placeholderTextColor={Colors.textTertiary}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x-circle" size={16} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>

        <View style={styles.filterRow}>
          {CONFIDENCE_FILTERS.map(f => {
            const active = confidenceFilter === f.id;
            const color = CONFIDENCE_COLORS[f.id];
            return (
              <Pressable
                key={f.id}
                onPress={() => setConfidenceFilter(f.id)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: color + '20', borderColor: color },
                ]}
              >
                <Text style={[styles.filterLabel, { color: active ? color : Colors.textTertiary }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FactCard fact={item} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        scrollEnabled={!!results.length}
        ListHeaderComponent={
          !query ? (
            <View style={styles.trendingSection}>
              <View style={styles.trendingHeader}>
                <Feather name="trending-up" size={13} color={Colors.textTertiary} />
                <Text style={styles.trendingTitle}>MOST REVISED</Text>
              </View>
              {trendingFacts.map(fact => (
                <Pressable key={fact.id} style={styles.trendingRow}>
                  <View>
                    <Text style={styles.trendingFactHeadline} numberOfLines={1}>
                      {fact.headline}
                    </Text>
                    <Text style={styles.trendingRevisions}>
                      {fact.timeline.length} revisions
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={Colors.textTertiary} />
                </Pressable>
              ))}
              <View style={styles.divider} />
              <Text style={styles.allResultsLabel}>ALL FACTS</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No facts found for "{query}"</Text>
            <Text style={styles.emptySubtext}>Try different keywords</Text>
          </View>
        }
      />
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    padding: 12,
    gap: 8,
  },
  trendingSection: {
    marginBottom: 12,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  trendingTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  trendingFactHeadline: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    flex: 1,
  },
  trendingRevisions: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  allResultsLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});
