import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { BentoBox } from '../components/BentoBox';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalInput } from '../components/BrutalInput';
import { BrutalAILoader } from '../components/BrutalAILoader';
import { memeApi, GenerateTextMemeResponse, BASE_URL } from '../api/meme.api';
import { shareMeme } from '../utils/share';

const STYLES = [
  { id: 'humour général', label: 'Général' },
  { id: 'sarcastique', label: 'Sarcastique' },
  { id: 'absurde', label: 'Absurde' },
  { id: 'sombre', label: 'Sombre' },
  { id: 'geek', label: 'Geek' },
];

const FILTERS = [
  { id: 'normal', name: 'Normal', color: theme.colors.white },
  { id: 'grayscale', name: 'N&B', color: '#e0e0e0' },
  { id: 'sepia', name: 'Sépia', color: '#d2b48c' },
  { id: 'invert', name: 'Négatif', color: '#333333' },
  { id: 'blur', name: 'Flou', color: '#b0c4de' },
  { id: 'vibrant', name: 'Vibrant', color: '#ff69b4' },
  { id: 'cool', name: 'Froid', color: '#87ceeb' },
];

interface TextMemeScreenProps {
  onBack: () => void;
}

export const TextMemeScreen: React.FC<TextMemeScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('humour général');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result states
  const [memeData, setMemeData] = useState<GenerateTextMemeResponse['meme'] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filter States
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [displayedMemeUrl, setDisplayedMemeUrl] = useState<string | null>(null);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);

  const handleGenerateMemeText = async () => {
    if (!inputText.trim()) {
      Alert.alert('Oups !', "Rentre un texte ou colle une discussion pour que l'IA puisse travailler.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMemeData(null);
    setImageUrl(null);
    setIsSaved(false);

    try {
      const response = await memeApi.generateFromText(inputText, selectedStyle);
      if (response.success && response.meme) {
        setMemeData(response.meme);
      } else {
        setError('Impossible de générer le mème.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message ||
        'Erreur inconnue';
      setError(`Erreur lors de la génération : ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMemeImage = async () => {
    if (!memeData) return;

    setIsGeneratingImage(true);
    setError(null);
    setIsSaved(false);

    try {
      const response = await memeApi.generateMemeImage(
        memeData.image_prompt,
        memeData.top_text,
        memeData.bottom_text
      );
      if (response.success && response.imageUrl) {
        const fullUrl = response.imageUrl;
        setImageUrl(fullUrl);
        setDisplayedMemeUrl(memeApi.getImageUrl(fullUrl));
        setSelectedFilter('normal');
      } else {
        setError("Erreur lors de la génération d'image.");
      }
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message ||
        'Erreur inconnue';
      setError(`Erreur image : ${errMsg}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleApplyFilter = async (filterType: string) => {
    if (!imageUrl) return;
    setIsApplyingFilter(true);
    setSelectedFilter(filterType);
    try {
      const res = await memeApi.applyFilter(imageUrl, filterType);
      if (res.success) {
        setDisplayedMemeUrl(memeApi.getImageUrl(res.imageUrl));
      }
    } catch (err) {
      console.error('[TextFilter] Erreur:', err);
      Alert.alert('Erreur', "Impossible d'appliquer le filtre.");
    } finally {
      setIsApplyingFilter(false);
    }
  };

  const handleShareMeme = async () => {
    const activeUrl = displayedMemeUrl || (imageUrl && memeApi.getImageUrl(imageUrl));
    if (!activeUrl) return;
    try {
      const text = `Regarde le mème que je viens de créer avec MemeMaker !\n"${memeData?.top_text} - ${memeData?.bottom_text}"`;
      await shareMeme(activeUrl, text);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de partager le mème.');
    }
  };

  const handleSaveMeme = async () => {
    const activeUrl = displayedMemeUrl || (imageUrl && memeApi.getImageUrl(imageUrl));
    if (!memeData || !activeUrl || isSaved || isSaving) return;
    setIsSaving(true);
    try {
      const relativeUrl = activeUrl.replace(BASE_URL, '');
      await memeApi.saveMeme({
        author: 'MemeMaker User',
        top_text: memeData.top_text,
        bottom_text: memeData.bottom_text,
        imageUrl: relativeUrl,
        explanation: memeData.explanation,
        template_suggestion: memeData.template_suggestion,
        style: selectedStyle,
      });
      setIsSaved(true);
      Alert.alert('Succès !', 'Mème sauvegardé avec succès.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de sauvegarder le mème.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header - flows all the way to the status bar with white background */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 10 }]}>
        <BrutalButton
          onPress={onBack}
          style={styles.backBtn}
          contentStyle={styles.backBtnContent}
          backgroundColor={theme.colors.white}
          shadowOffset={3}
          borderRadius={8}
        >
          <Text style={styles.backText}>‹</Text>
        </BrutalButton>
        <Text style={styles.navTitle}>Context Reader</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Input Box */}
          <BentoBox backgroundColor={theme.colors.white} style={styles.section}>
            <Text style={styles.label}>Qu'est-ce qui s'est passé ?</Text>
            <Text style={styles.subLabel}>
              Colle un extrait de conversation, un message ou raconte ta situation en quelques mots.
            </Text>
            <BrutalInput
              multiline
              numberOfLines={4}
              placeholder="Ex: 'Moi: J'ai exam demain à 8h. \nLui: Et tu fais quoi là ? \nMoi: Je regarde des vidéos de castors à 3h du matin...'"
              value={inputText}
              onChangeText={setInputText}
              style={styles.textInputStyle}
            />
          </BentoBox>

          {/* Style Selector */}
          <View style={styles.styleContainer}>
            <Text style={styles.labelSmall}>Style d'humour :</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stylesScroll}
            >
              {STYLES.map((style) => {
                const isActive = selectedStyle === style.id;
                return (
                  <BrutalButton
                    key={style.id}
                    title={style.label}
                    backgroundColor={isActive ? theme.colors.yellow : theme.colors.white}
                    onPress={() => setSelectedStyle(style.id)}
                    style={styles.styleBtn}
                    contentStyle={styles.styleBtnContent}
                    shadowOffset={isActive ? 2 : 3}
                    borderRadius={8}
                  />
                );
              })}
            </ScrollView>
          </View>

          {/* Generate Button */}
          <BrutalButton
            title="GÉNÉRER LE MÈME"
            backgroundColor={theme.colors.pink}
            onPress={handleGenerateMemeText}
            disabled={isLoading || isGeneratingImage}
            style={styles.submitBtn}
          />

          {/* Staggered rotating AI Loading state */}
          {isLoading && (
            <BentoBox backgroundColor={theme.colors.yellow} style={styles.loadingContainer}>
              <BrutalAILoader message="L'IA déchiffre le contexte..." />
            </BentoBox>
          )}

          {/* Error Message */}
          {error && (
            <BentoBox backgroundColor="#FFD1D1" style={styles.errorContainer} shadowColor={theme.colors.black}>
              <Text style={styles.errorTitle}>ERREUR !</Text>
              <Text style={styles.errorText}>{error}</Text>
            </BentoBox>
          )}

          {/* Results Box */}
          {memeData && !isLoading && (
            <BentoBox backgroundColor={theme.colors.cyan} style={styles.resultContainer}>
              <Text style={styles.resultHeader}>MÈME SUGGÉRÉ</Text>

              {/* Template Suggestion */}
              <View style={styles.templateTagContainer}>
                <Text style={styles.templateTagLabel}>TEMPLATE SUGGÉRÉ :</Text>
                <View style={styles.templateTag}>
                  <Text style={styles.templateTagText}>{memeData.template_suggestion}</Text>
                </View>
              </View>

              {/* Simulated text meme display */}
              <View style={styles.textMemeDisplay}>
                <Text style={styles.textMemeTitle}>[ TEXTE DU MÈME ]</Text>
                <View style={styles.memeTextBox}>
                  <Text style={styles.memeTextImpact}>{memeData.top_text.toUpperCase()}</Text>
                  <View style={styles.memeTextDivider} />
                  <Text style={styles.memeTextImpact}>{memeData.bottom_text.toUpperCase()}</Text>
                </View>
              </View>

              {/* Short explanation */}
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>Pourquoi c'est drôle :</Text>
                <Text style={styles.explanationText}>{memeData.explanation}</Text>
              </View>

              {/* Generate Image Button / Preview */}
              {!imageUrl ? (
                <View style={styles.imageActionBox}>
                  <Text style={styles.imageActionText}>
                    Prêt à matérialiser ce mème en image ?
                  </Text>
                  {!isGeneratingImage ? (
                    <BrutalButton
                      title="GÉNÉRER L'IMAGE IA"
                      backgroundColor={theme.colors.pink}
                      onPress={handleGenerateMemeImage}
                      style={styles.imageBtn}
                    />
                  ) : (
                    <View style={styles.imageLoadingWrapper}>
                      <BrutalAILoader message="L'IA peint la toile..." />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.polaroidContainer}>
                  <BentoBox
                    backgroundColor={theme.colors.white}
                    contentStyle={styles.polaroidFrameContent}
                    style={styles.polaroidFrameOuter}
                  >
                    <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                      <Image
                        source={{ uri: displayedMemeUrl || memeApi.getImageUrl(imageUrl) }}
                        style={styles.polaroidImage}
                        resizeMode="cover"
                      />
                      {isApplyingFilter && (
                        <View style={[StyleSheet.absoluteFill, styles.filterLoadingOverlay]}>
                          <ActivityIndicator size="small" color={theme.colors.black} />
                        </View>
                      )}
                    </View>
                    <View style={styles.polaroidCaption}>
                      <Text style={styles.polaroidCaptionText}>
                        {memeData.template_suggestion} Remixed
                      </Text>
                    </View>
                  </BentoBox>

                  {/* Visual Filters Carousel */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>EFFETS VISUELS :</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView} contentContainerStyle={styles.filterScrollContent}>
                      {FILTERS.map((f) => (
                        <Pressable
                          key={f.id}
                          onPress={() => handleApplyFilter(f.id)}
                          style={[
                            styles.filterChip,
                            { backgroundColor: f.color },
                            selectedFilter === f.id && styles.filterChipSelected
                          ]}
                          disabled={isApplyingFilter}
                        >
                          <Text style={[styles.filterChipText, selectedFilter === f.id && styles.filterChipTextSelected]}>
                            {f.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {!isGeneratingImage ? (
                    <View style={styles.polaroidActions}>
                      <BrutalButton
                        title="Refaire"
                        backgroundColor={theme.colors.white}
                        onPress={handleGenerateMemeImage}
                        style={styles.polaroidActionBtn}
                      />
                      <BrutalButton
                        title="Partager"
                        backgroundColor={theme.colors.yellow}
                        onPress={handleShareMeme}
                        style={styles.polaroidActionBtn}
                      />
                      <BrutalButton
                        title={isSaved ? "Sauvé" : "Sauver"}
                        backgroundColor={isSaved ? theme.colors.green : theme.colors.cyan}
                        onPress={handleSaveMeme}
                        disabled={isSaved || isSaving}
                        style={styles.polaroidActionBtn}
                      />
                    </View>
                  ) : (
                    <View style={styles.imageLoadingWrapper}>
                      <BrutalAILoader message="Régénération du visuel..." />
                    </View>
                  )}
                </View>
              )}
            </BentoBox>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: theme.borders.width,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.white,
  },
  backBtn: {
    marginRight: 16,
  },
  backBtnContent: {
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  backText: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: -4,
    color: theme.colors.black,
  },
  navTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.black,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 120, // Avoid bottom bar overlap
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 4,
  },
  subLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.darkGray,
    lineHeight: 18,
    marginBottom: 16,
  },
  textInputStyle: {
    height: 100,
    textAlignVertical: 'top',
  },
  styleContainer: {
    marginBottom: 20,
  },
  labelSmall: {
    fontFamily: theme.fonts.heading,
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 10,
    marginLeft: 4,
  },
  stylesScroll: {
    paddingLeft: 4,
    paddingRight: 16,
    gap: 12,
    paddingBottom: 8,
  },
  styleBtn: {
    marginRight: 8,
  },
  styleBtnContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  submitBtn: {
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 16,
    fontWeight: '900',
    color: '#D32F2F',
    marginBottom: 4,
  },
  errorText: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    color: theme.colors.black,
  },
  resultContainer: {
    marginBottom: 24,
  },
  resultHeader: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  templateTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  templateTagLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.black,
    marginRight: 8,
  },
  templateTag: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  templateTagText: {
    fontFamily: theme.fonts.heading,
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.black,
  },
  textMemeDisplay: {
    marginBottom: 20,
  },
  textMemeTitle: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 8,
  },
  memeTextBox: {
    backgroundColor: theme.colors.black,
    borderWidth: 2,
    borderColor: theme.colors.black,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  memeTextDivider: {
    height: 1,
    backgroundColor: theme.colors.white,
    width: '30%',
    marginVertical: 4,
    opacity: 0.3,
  },
  memeTextImpact: {
    color: theme.colors.white,
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  explanationBox: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.black,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  explanationTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 4,
  },
  explanationText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.black,
    lineHeight: 18,
  },
  imageActionBox: {
    borderTopWidth: 2,
    borderColor: theme.colors.black,
    paddingTop: 16,
    alignItems: 'center',
  },
  imageActionText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  imageBtn: {
    width: '100%',
  },
  imageLoadingWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  polaroidContainer: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  polaroidFrameOuter: {
    width: '100%',
    aspectRatio: 0.9,
    marginBottom: 16,
  },
  polaroidFrameContent: {
    padding: 12,
    paddingBottom: 20,
    flex: 1,
  },
  polaroidImage: {
    width: '100%',
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.black,
    backgroundColor: '#E5E5E5',
  },
  polaroidCaption: {
    marginTop: 12,
    alignItems: 'center',
  },
  polaroidCaptionText: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.black,
  },
  retryBtn: {
    width: '100%',
  },
  polaroidActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  polaroidActionBtn: {
    flex: 1,
  },
  filterSection: {
    marginTop: 8,
    marginBottom: 16,
    width: '100%',
  },
  filterSectionTitle: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.black,
    marginBottom: 4,
  },
  filterScrollView: {
    marginVertical: 4,
  },
  filterScrollContent: {
    paddingHorizontal: 2,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: theme.colors.black,
    borderRadius: 4,
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  filterChipSelected: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    shadowOffset: { width: 0, height: 0 },
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    fontWeight: '900',
    color: theme.colors.black,
  },
  filterChipTextSelected: {
    color: theme.colors.black,
  },
  filterLoadingOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
