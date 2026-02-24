import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getFactById, formatTimeAgo, MOCK_FACTS } from '@/lib/mockData';
import { ImportanceBadge } from '@/components/ImportanceBadge';
import { CategoryPill, CATEGORY_COLORS } from '@/components/CategoryPill';
import { ConfidenceBar } from '@/components/ConfidenceBar';
import { FactRevision, RevisionType } from '@/lib/types';

const REVISION_TYPE_LABELS: Record<RevisionType, string> = {
  initial: 'INITIAL',
  update: 'UPDATE',
  correction: 'CORRECTION',
  escalation: 'ESCALATION',
  resolution: 'RESOLVED',
};

const REVISION_TYPE_COLORS: Record<RevisionType, string> = {
  initial: Colors.textTertiary,
  update: Colors.tint,
  correction: Colors.disputed,
  escalation: Colors.high,
  resolution: Colors.confirmed,
};

interface TimelineNodeProps {
  revision: FactRevision;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineNode({ revision, isFirst, isLast }: TimelineNodeProps) {
  const [expanded, setExpanded] = useState(isFirst);
  const typeColor = REVISION_TYPE_COLORS[revision.revisionType];
  const typeLabel = REVISION_TYPE_LABELS[revision.revisionType];

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setExpanded(e => !e);
  };

  return (
    <View style={styles.nodeRow}>
      <View style={styles.nodeLeft}>
        <View style={[styles.nodeDot, { backgroundColor: typeColor }]} />
        {!isLast && <View style={styles.nodeLine} />}
      </View>

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.nodeCard,
          isFirst && styles.nodeCardFirst,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.nodeHeader}>
          <View style={[styles.revisionBadge, { borderColor: typeColor }]}>
            <Text style={[styles.revisionBadgeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
          <Text style={styles.nodeTime}>
            {revision.timestamp.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textTertiary}
          />
        </View>

        <Text style={styles.newValue}>{revision.newValue}</Text>

        {expanded && (
          <>
            {revision.previousValue && (
              <View style={styles.diffBlock}>
                <View style={[styles.diffRow, { backgroundColor: Colors.diffOld }]}>
                  <Feather name="minus" size={10} color={Colors.diffOldText} />
                  <Text style={[styles.diffText, { color: Colors.diffOldText }]}>
                    {revision.previousValue}
                  </Text>
                </View>
                <View style={[styles.diffRow, { backgroundColor: Colors.diffNew }]}>
                  <Feather name="plus" size={10} color={Colors.diffNewText} />
                  <Text style={[styles.diffText, { color: Colors.diffNewText }]}>
                    {revision.newValue}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.deltaText}>{revision.delta}</Text>

            <View style={styles.whyBox}>
              <View style={styles.whyHeader}>
                <Feather name="info" size={11} color={Colors.tint} />
                <Text style={styles.whyLabel}>WHY IT MATTERS</Text>
              </View>
              <Text style={styles.whyText}>{revision.whyItMatters}</Text>
            </View>

            <Pressable
              style={styles.sourceLink}
              onPress={() => Linking.openURL(revision.source.url).catch(() => {})}
            >
              <Feather name="external-link" size={11} color={Colors.tint} />
              <Text style={styles.sourceLinkText}>{revision.source.name}</Text>
              <Text style={styles.sourceTier}>{revision.source.tier.toUpperCase()}</Text>
            </Pressable>
          </>
        )}
      </Pressable>
    </View>
  );
}

export default function FactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const fact = getFactById(id);

  if (!fact) {
    return (
      <View style={[styles.container, styles.notFound]}>
        <Feather name="alert-circle" size={40} color={Colors.textTertiary} />
        <Text style={styles.notFoundText}>Fact not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const relatedFacts = fact.relatedFacts
    .map(rid => MOCK_FACTS.find(f => f.id === rid))
    .filter(Boolean) as typeof MOCK_FACTS;

  const categoryColor = CATEGORY_COLORS[fact.category];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
      <View style={[styles.navBar, { paddingTop: Platform.OS === 'web' ? 0 : insets.top + 4 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.navMeta}>
          <CategoryPill category={fact.category} />
        </View>
        <Pressable style={styles.shareButton}>
          <Feather name="share" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroSection, { borderLeftColor: categoryColor }]}>
          <View style={styles.heroHeader}>
            <ImportanceBadge level={fact.importance} />
            <Text style={styles.timeAgo}>{formatTimeAgo(fact.lastUpdated)}</Text>
          </View>

          <Text style={styles.headline}>{fact.headline}</Text>

          <View style={styles.currentValueBox}>
            <Text style={styles.currentValueLabel}>CURRENT</Text>
            <Text style={styles.currentValue}>{fact.currentValue}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>CONFIDENCE</Text>
              <View style={styles.confidenceContainer}>
                <ConfidenceBar level={fact.confidence} showLabel />
              </View>
            </View>
          </View>

          <View style={styles.sourcesList}>
            {fact.sources.map((source, i) => (
              <Pressable
                key={i}
                style={styles.sourceChip}
                onPress={() => Linking.openURL(source.url).catch(() => {})}
              >
                <Feather name="link-2" size={10} color={Colors.textTertiary} />
                <Text style={styles.sourceChipText}>{source.name}</Text>
                <View style={[styles.tierBadge]}>
                  <Text style={styles.tierBadgeText}>{source.tier[0].toUpperCase()}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Feather name="clock" size={13} color={Colors.textTertiary} />
            <Text style={styles.timelineTitle}>EVOLUTION TIMELINE</Text>
            <Text style={styles.revisionCount}>{fact.timeline.length} revisions</Text>
          </View>

          <View style={styles.timeline}>
            {fact.timeline.map((revision, index) => (
              <TimelineNode
                key={revision.id}
                revision={revision}
                isFirst={index === 0}
                isLast={index === fact.timeline.length - 1}
              />
            ))}
          </View>
        </View>

        {relatedFacts.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Feather name="git-branch" size={13} color={Colors.textTertiary} />
              <Text style={styles.relatedTitle}>RELATED FACTS</Text>
            </View>

            {relatedFacts.map(related => (
              <Pressable
                key={related.id}
                style={({ pressed }) => [
                  styles.relatedRow,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  router.push({ pathname: '/fact/[id]', params: { id: related.id } });
                }}
              >
                <View style={[styles.relatedDot, { backgroundColor: CATEGORY_COLORS[related.category] }]} />
                <View style={styles.relatedInfo}>
                  <Text style={styles.relatedHeadline}>{related.headline}</Text>
                  <Text style={styles.relatedValue} numberOfLines={1}>{related.currentValue}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.tagsSection}>
          <View style={styles.tagsRow}>
            {fact.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
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
  notFound: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.tint,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navMeta: {
    flex: 1,
    alignItems: 'center',
  },
  shareButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  heroSection: {
    gap: 12,
    borderLeftWidth: 3,
    paddingLeft: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },
  headline: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  currentValueBox: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  currentValueLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  currentValue: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  metaRow: {
    gap: 8,
  },
  metaItem: {
    gap: 6,
  },
  metaLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  confidenceContainer: {
    paddingRight: 4,
  },
  sourcesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  tierBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.tint + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: Colors.tint,
  },
  timelineSection: {
    gap: 14,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    flex: 1,
  },
  revisionCount: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  timeline: {
    gap: 0,
  },
  nodeRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 50,
  },
  nodeLeft: {
    alignItems: 'center',
    width: 16,
    paddingTop: 14,
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  nodeLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  nodeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 8,
  },
  nodeCardFirst: {
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revisionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
  },
  revisionBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  nodeTime: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  newValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  diffBlock: {
    gap: 2,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  diffText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 17,
  },
  deltaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  whyBox: {
    backgroundColor: Colors.tint + '10',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.tint + '20',
    gap: 5,
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  whyLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.tint,
    letterSpacing: 1,
  },
  whyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 2,
  },
  sourceLinkText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.tint,
    flex: 1,
  },
  sourceTier: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  relatedSection: {
    gap: 10,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  relatedTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  relatedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  relatedInfo: {
    flex: 1,
    gap: 2,
  },
  relatedHeadline: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  relatedValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  tagsSection: {
    paddingTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});
