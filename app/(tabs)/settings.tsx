import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface SettingRowProps {
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (val: boolean) => void;
  rightLabel?: string;
  onPress?: () => void;
  iconName?: keyof typeof Feather.glyphMap;
  iconColor?: string;
}

function SettingRow({ label, description, value, onValueChange, rightLabel, onPress, iconName, iconColor }: SettingRowProps) {
  const content = (
    <View style={styles.settingRow}>
      {iconName && (
        <View style={[styles.settingIcon, { backgroundColor: (iconColor || Colors.tint) + '18' }]}>
          <Feather name={iconName} size={16} color={iconColor || Colors.tint} />
        </View>
      )}
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {onValueChange !== undefined && value !== undefined ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.border, true: Colors.tint + '80' }}
          thumbColor={value ? Colors.tint : Colors.textTertiary}
          ios_backgroundColor={Colors.border}
        />
      ) : rightLabel ? (
        <Text style={styles.rightLabel}>{rightLabel}</Text>
      ) : (
        <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const [breakingOnly, setBreakingOnly] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showPrimary, setShowPrimary] = useState(true);
  const [showWire, setShowWire] = useState(true);
  const [showReporting, setShowReporting] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showDisputed, setShowDisputed] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 0 : insets.top + 8 }]}>
        <Text style={styles.title}>SETTINGS</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.section}>
          <SettingRow
            label="Breaking Only"
            description="Notify only for breaking-level facts"
            value={breakingOnly}
            onValueChange={setBreakingOnly}
            iconName="bell"
            iconColor={Colors.breaking}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="Notification Frequency"
            rightLabel="Real-time"
            iconName="clock"
            iconColor={Colors.tint}
          />
        </View>

        <SectionHeader title="DISPLAY" />
        <View style={styles.section}>
          <SettingRow
            label="Compact Cards"
            description="Show less context per fact in feed"
            value={compactMode}
            onValueChange={setCompactMode}
            iconName="layout"
            iconColor={Colors.medium}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="Theme"
            rightLabel="Dark"
            iconName="moon"
            iconColor={Colors.textSecondary}
          />
        </View>

        <SectionHeader title="SOURCE TIERS" />
        <View style={styles.section}>
          <SettingRow
            label="Primary Sources"
            description="Official statements, government data"
            value={showPrimary}
            onValueChange={setShowPrimary}
            iconName="award"
            iconColor={Colors.confirmed}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="Wire Services"
            description="AP, Reuters"
            value={showWire}
            onValueChange={setShowWire}
            iconName="radio"
            iconColor={Colors.tint}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="Reporting"
            description="NYT, WSJ, Bloomberg"
            value={showReporting}
            onValueChange={setShowReporting}
            iconName="file-text"
            iconColor={Colors.high}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="Analysis"
            description="Expert commentary, clearly labeled"
            value={showAnalysis}
            onValueChange={setShowAnalysis}
            iconName="edit-3"
            iconColor={Colors.low}
          />
        </View>

        <SectionHeader title="CONFIDENCE FILTERS" />
        <View style={styles.section}>
          <SettingRow
            label="Show Disputed Facts"
            description="Facts with conflicting source reports"
            value={showDisputed}
            onValueChange={setShowDisputed}
            iconName="alert-triangle"
            iconColor={Colors.disputed}
          />
        </View>

        <SectionHeader title="ABOUT" />
        <View style={styles.section}>
          <SettingRow
            label="Fact Extraction Model"
            rightLabel="Claude Sonnet"
            iconName="cpu"
            iconColor={Colors.technology}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="Data Sources"
            rightLabel="11 active"
            iconName="database"
            iconColor={Colors.tint}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="Version"
            rightLabel="1.0.0"
            iconName="info"
            iconColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.disclaimer}>
          <Feather name="shield" size={13} color={Colors.textTertiary} />
          <Text style={styles.disclaimerText}>
            Ledger extracts and structures facts. It does not editorialize, predict, or add commentary beyond source-grounded context.
          </Text>
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
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  content: {
    padding: 16,
    gap: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  rightLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 62,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
