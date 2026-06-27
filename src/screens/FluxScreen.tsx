import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { BentoBox } from '../components/BentoBox';
import { BrutalButton } from '../components/BrutalButton';
import { memeApi, SavedMeme } from '../api/meme.api';
import { shareMeme } from '../utils/share';

export const FluxScreen = () => {
  const insets = useSafeAreaInsets();
  const [memes, setMemes] = useState<SavedMeme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedMemeIds, setLikedMemeIds] = useState<string[]>([]);

  const fetchMemes = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await memeApi.getMemeFeed();
      if (response.success && response.memes) {
        setMemes(response.memes);
      }
    } catch (error) {
      console.error('Error fetching memes:', error);
      Alert.alert('Erreur', 'Impossible de charger les mèmes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemes();
  }, []);

  const handleRefresh = () => {
    fetchMemes(true);
  };

  const handleLike = (id: string) => {
    if (likedMemeIds.includes(id)) {
      setLikedMemeIds(likedMemeIds.filter(itemId => itemId !== id));
    } else {
      setLikedMemeIds([...likedMemeIds, id]);
    }
  };

  const handleShare = async (item: SavedMeme) => {
    try {
      const fullUrl = memeApi.getImageUrl(item.imageUrl);
      const text = `Regarde ce mème créé avec MemeMaker !\n"${item.top_text} - ${item.bottom_text}"`;
      await shareMeme(fullUrl, text);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de partager ce mème.');
    }
  };

  const getStyleLabel = (style: string = '') => {
    switch (style.toLowerCase()) {
      case 'sarcastique': return 'Sarcastique';
      case 'absurde': return 'Absurde';
      case 'sombre': return 'Sombre';
      case 'geek': return 'Geek';
      case 'audio': return 'Vocal';
      case 'image': return 'Photo';
      default: return 'Général';
    }
  };

  const renderContent = () => {
    if (isLoading && memes.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.pink} />
          <Text style={styles.loadingText}>CHARGEMENT DU FLUX...</Text>
        </View>
      );
    }

    if (memes.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[theme.colors.pink]} />
          }
        >
          <View style={styles.emptyContainer}>
            <BentoBox backgroundColor={theme.colors.yellow} style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>RIEN D'INSCRIT ENCORE !</Text>
              <Text style={styles.emptySub}>
                L'historique est vide. Va sur l'accueil ou le Context Reader pour générer tes premiers mèmes puis clique sur "Sauver" !
              </Text>
            </BentoBox>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[theme.colors.pink]} />
        }
      >
        <View style={styles.feed}>
          {memes.map((item) => {
            const isLiked = likedMemeIds.includes(item.id);
            // Stable fake count based on ID string
            const baseLikes = Math.floor((parseInt(item.id.slice(-4), 10) || 123) % 400) + 12;
            const displayLikes = isLiked ? baseLikes + 1 : baseLikes;

            return (
              <BentoBox key={item.id} backgroundColor={theme.colors.white} style={styles.feedCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardAuthor}>@{item.author.replace(/\s+/g, '_')}</Text>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{getStyleLabel(item.style)}</Text>
                  </View>
                </View>

                {/* Meme Rendering (Image if available, fallback to canvas) */}
                {item.imageUrl ? (
                  <View style={styles.memeImageContainer}>
                    <Image
                      source={{ uri: memeApi.getImageUrl(item.imageUrl) }}
                      style={styles.memeImage}
                      resizeMode="cover"
                    />
                    {/* Meme text overlays on image */}
                    {item.top_text ? (
                      <View style={styles.overlayTextTop}>
                        <Text style={styles.overlayMemeText}>{item.top_text.toUpperCase()}</Text>
                      </View>
                    ) : null}
                    {item.bottom_text ? (
                      <View style={styles.overlayTextBottom}>
                        <Text style={styles.overlayMemeText}>{item.bottom_text.toUpperCase()}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.memeCanvas}>
                    <Text style={styles.memeText}>{item.top_text.toUpperCase()}</Text>
                    <View style={styles.memeDivider} />
                    <Text style={styles.memeText}>{item.bottom_text.toUpperCase()}</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  {item.explanation ? (
                    <Text style={styles.cardExplanation}>
                      Context: {item.explanation}
                    </Text>
                  ) : null}
                  <View style={styles.interactionRow}>
                    <BrutalButton
                      title={`❤️ ${displayLikes}`}
                      backgroundColor={isLiked ? theme.colors.pink : theme.colors.white}
                      onPress={() => handleLike(item.id)}
                      style={styles.likeBtn}
                      textStyle={styles.btnText}
                    />
                    <BrutalButton
                      title="Partager"
                      backgroundColor={theme.colors.yellow}
                      onPress={() => handleShare(item)}
                      style={styles.shareBtn}
                      textStyle={styles.btnText}
                    />
                  </View>
                </View>
              </BentoBox>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Fixed top header bar */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.brandTitle}>FLUX</Text>
      </View>
      {renderContent()}
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
  feed: {
    gap: 24,
  },
  feedCard: {
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAuthor: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.black,
  },
  tag: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: theme.colors.yellow,
  },
  tagText: {
    fontFamily: theme.fonts.heading,
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.black,
  },
  memeCanvas: {
    backgroundColor: '#222222',
    borderWidth: 3,
    borderColor: theme.colors.black,
    borderRadius: 8,
    padding: 16,
    aspectRatio: 1.1,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memeImageContainer: {
    width: '100%',
    aspectRatio: 1.1,
    borderWidth: 3,
    borderColor: theme.colors.black,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#E5E5E5',
  },
  memeImage: {
    width: '100%',
    height: '100%',
  },
  memeText: {
    fontFamily: theme.fonts.heading,
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.white,
    textAlign: 'center',
  },
  memeDivider: {
    height: 1,
    backgroundColor: theme.colors.white,
    width: '40%',
    opacity: 0.3,
  },
  cardFooter: {
    marginTop: 8,
  },
  cardExplanation: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.darkGray,
    lineHeight: 18,
    marginBottom: 16,
  },
  interactionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  likeBtn: {
    flex: 1,
  },
  shareBtn: {
    flex: 1,
  },
  btnText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.black,
    marginTop: 16,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    padding: 20,
  },
  emptyTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.black,
    lineHeight: 20,
    textAlign: 'center',
  },
  overlayTextTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  overlayTextBottom: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  overlayMemeText: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.white,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: theme.colors.black,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    elevation: 3,
  },
});
