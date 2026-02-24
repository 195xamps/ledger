import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { FactCard } from '@/components/FactCard';
import { MOCK_FACTS, getFactsForCategory } from '@/lib/mockData';
import { Category } from '@/lib/types';

const FILTERS: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'economy', label: 'Economy' },
  { id: 'geopolitics', label: 'Geopolitics' },
  { id: 'technology', label: 'Technology' },
  { id: 'climate', label: 'Climate' },
  { id: 'health', label: 'Health' },
];

const CATEGORY_FILTER_COLORS: Record<string, string> = {
  all: Colors.tint,
  economy: Colors.economy,
  geopolitics: Colors.geopolitics,
  technology: Colors.technology,
  climate: Colors.climate,
  health: Colors.health,
};

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<'all' | Category>('all');
  const [refreshing, setRefreshing] = useState(false);

  const facts = getFactsForCategory(activeFilter);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const breakingCount = MOCK_FACTS.filter(f => f.importance === 'breaking').length;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 0 : insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.logo}>LEDGER</Text>
            <Text style={styles.logoSub}>Evolving Facts</Text>
          </View>
          <View style={styles.headerRight}>
            {breakingCount > 0 && (
              <View style={styles.breakingBadge}>
                <View style={styles.breakingDot} />
                <Text style={styles.breakingCount}>{breakingCount} breaking</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(filter => {
            const active = activeFilter === filter.id;
            const color = CATEGORY_FILTER_COLORS[filter.id];
            return (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: color + '22', borderColor: color },
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    { color: active ? color : Colors.textTertiary },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={facts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FactCard fact={item} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.tint}
            colors={[Colors.tint]}
          />
        }
        scrollEnabled={!!facts.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No facts in this category</Text>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  logoSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  breakingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.breaking + '18',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.breaking + '40',
  },
  breakingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.breaking,
  },
  breakingCount: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.breaking,
  },
  filterRow: {
    gap: 6,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    padding: 12,
  },
  separator: {
    height: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});
