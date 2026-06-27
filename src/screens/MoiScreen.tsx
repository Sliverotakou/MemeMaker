import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { BentoBox } from '../components/BentoBox';
import { BrutalButton } from '../components/BrutalButton';
import { memeApi } from '../api/meme.api';

interface MoiScreenProps {
  isVisible?: boolean;
}

export const MoiScreen: React.FC<MoiScreenProps> = ({ isVisible = true }) => {
  const insets = useSafeAreaInsets();
  const [memeCount, setMemeCount] = useState<number | null>(null);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [absurdite, setAbsurdite] = useState<number>(0);
  const [rankTitle, setRankTitle] = useState("Novice");
  const [rankEmoji, setRankEmoji] = useState("🐣");

  const fetchStats = async () => {
    try {
      const response = await memeApi.getMemeFeed();
      if (response.success && response.memes) {
        const count = response.memes.length;
        setMemeCount(count);

        // Sum up the stable fake likes
        const likes = response.memes.reduce((sum, item) => {
          const itemLikes = Math.floor((parseInt(item.id.slice(-4), 10) || 123) % 400) + 12;
          return sum + itemLikes;
        }, 0);
        setTotalLikes(likes);

        // Calculate dynamic absurdity
        if (count > 0) {
          const absurdeCount = response.memes.filter(m => m.style?.toLowerCase() === 'absurde').length;
          const calculatedAbsurdite = Math.min(100, 15 + Math.round((absurdeCount / count) * 85));
          setAbsurdite(calculatedAbsurdite);
        } else {
          setAbsurdite(0);
        }

        // Determine rank
        if (count === 0) {
          setRankTitle("Novice");
          setRankEmoji("🐣");
        } else if (count <= 3) {
          setRankTitle("Créateur");
          setRankEmoji("🎨");
        } else if (count <= 7) {
          setRankTitle("Mémologue");
          setRankEmoji("🧠");
        } else {
          setRankTitle("Meme Lord");
          setRankEmoji("👑");
        }
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      // Set defaults on error so we don't stay stuck on loading
      if (memeCount === null) {
        setMemeCount(0);
      }
    }
  };

  // Fetch stats on mount and whenever the tab becomes visible
  useEffect(() => {
    if (isVisible) {
      fetchStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const isLoading = memeCount === null;

  // Helper to render a stat value or a loader
  const renderStatValue = (value: string | number) => {
    if (isLoading) {
      return (
        <View style={styles.statLoadingWrapper}>
          <ActivityIndicator size="small" color={theme.colors.black} />
        </View>
      );
    }
    return <Text style={styles.statNumber}>{value}</Text>;
  };

  return (
    <View style={styles.container}>
      {/* Fixed top header bar */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.brandTitle}>MON PROFIL</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <BentoBox
          backgroundColor={theme.colors.white}
          style={styles.profileCard}
          borderTopLeftRadius={36}
          borderBottomRightRadius={36}
          borderTopRightRadius={12}
          borderBottomLeftRadius={12}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>🕶️</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>MemeLord_99</Text>
              <Text style={styles.userBio}>« L'IA me fatigue mais je continue à générer du rire. »</Text>
            </View>
          </View>
        </BentoBox>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <BentoBox
              backgroundColor={theme.colors.yellow}
              style={styles.statBox}
              borderTopLeftRadius={24}
              borderBottomRightRadius={24}
              borderTopRightRadius={4}
              borderBottomLeftRadius={4}
            >
              {renderStatValue(memeCount ?? 0)}
              <Text style={styles.statLabel}>Mèmes créés</Text>
            </BentoBox>
            <BentoBox
              backgroundColor={theme.colors.cyan}
              style={styles.statBox}
              borderTopRightRadius={24}
              borderBottomLeftRadius={24}
              borderTopLeftRadius={4}
              borderBottomRightRadius={4}
            >
              {renderStatValue(
                totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes
              )}
              <Text style={styles.statLabel}>Likes reçus</Text>
            </BentoBox>
          </View>

          <View style={styles.statsRow}>
            <BentoBox
              backgroundColor={theme.colors.green}
              style={styles.statBox}
              borderTopLeftRadius={24}
              borderTopRightRadius={24}
              borderBottomLeftRadius={4}
              borderBottomRightRadius={4}
            >
              {renderStatValue(`${absurdite}%`)}
              <Text style={styles.statLabel}>Absurdité</Text>
            </BentoBox>
            <BentoBox
              backgroundColor={theme.colors.white}
              style={styles.statBox}
              borderBottomLeftRadius={24}
              borderBottomRightRadius={24}
              borderTopLeftRadius={4}
              borderTopRightRadius={4}
            >
              {renderStatValue(rankEmoji)}
              <Text style={styles.statLabel}>Rang : {rankTitle}</Text>
            </BentoBox>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <BrutalButton title="Modifier mon profil" backgroundColor={theme.colors.white} style={styles.actionBtn} />
          <BrutalButton title="Se déconnecter" backgroundColor={theme.colors.gray} style={styles.actionBtn} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  headerRow: {
    backgroundColor: theme.colors.bg,
    borderBottomWidth: theme.borders.width,
    borderColor: theme.colors.black,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.black,
    letterSpacing: -0.5,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 110, // Avoid bottom bar overlap
  },
  profileCard: {
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 3,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 4,
  },
  userBio: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.darkGray,
    lineHeight: 16,
  },
  statsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 2,
    textAlign: 'center',
  },
  statLoadingWrapper: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.darkGray,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  actionContainer: {
    gap: 16,
  },
  actionBtn: {
    width: '100%',
  },
});
