import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, Pressable, Modal, ActivityIndicator, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import { theme } from '../styles/theme';
import { BentoBox } from '../components/BentoBox';
import { BrutalButton } from '../components/BrutalButton';
import { memeApi, BASE_URL } from '../api/meme.api';
import { shareMeme } from '../utils/share';
import { startRecording, stopRecording, cleanupRecorder } from '../utils/audioRecorder';

// Custom Microphone Icon in SVG
const MicIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
    />
  </Svg>
);

// Custom Camera / Image Icon in SVG
const CameraIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
    />
  </Svg>
);

// Custom Plus Icon in SVG (converts to X when rotated 135deg)
const PlusIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path fill={color} d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </Svg>
);

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

interface ImageMemeResult {
  originalImage: string;
  description: string;
  topText: string;
  bottomText: string;
  explanation: string;
  caption: string;
}

interface VoiceMemeResult {
  transcription: string;
  emotionDetected: string;
  topText: string;
  bottomText: string;
  templateSuggestion: string;
  explanation: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [listeningMode, setListeningMode] = useState<'none' | 'hold' | 'permanent'>('none');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMemeResult, setVoiceMemeResult] = useState<VoiceMemeResult | null>(null);
  const recordingPathRef = useRef<string | null>(null);

  // Image Meme States
  const [imageMemeResult, setImageMemeResult] = useState<ImageMemeResult | null>(null);
  const [showImageResultsModal, setShowImageResultsModal] = useState(false);

  // Saved States
  const [isVoiceMemeSaved, setIsVoiceMemeSaved] = useState(false);
  const [isVoiceSaving, setIsVoiceSaving] = useState(false);
  const [isImageMemeSaved, setIsImageMemeSaved] = useState(false);
  const [isImageSaving, setIsImageSaving] = useState(false);

  // FAB Menu States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;

  const pressStartTime = useRef<number>(0);

  // Animated values for voice waves & pulse
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const pulseHeight = useRef(new Animated.Value(1)).current;

  // Set up voice capture animations
  useEffect(() => {
    if (isListening) {
      wave1.setValue(0);
      wave2.setValue(0);
      pulseHeight.setValue(1);

      Animated.loop(
        Animated.timing(wave1, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(wave2, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseHeight, {
            toValue: 1.25,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(pulseHeight, {
            toValue: 0.95,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(pulseHeight, {
            toValue: 1.15,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(pulseHeight, {
            toValue: 1.0,
            duration: 180,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      wave1.stopAnimation();
      wave2.stopAnimation();
      pulseHeight.stopAnimation();
      wave1.setValue(0);
      wave2.setValue(0);
      pulseHeight.setValue(1);
    }
  }, [isListening, wave1, wave2, pulseHeight]);

  // Clean up recorder on unmount
  useEffect(() => {
    return () => {
      cleanupRecorder();
    };
  }, []);

  // FAB Menu Toggle
  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    setIsMenuOpen(!isMenuOpen);
    Animated.spring(menuAnimation, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Start actual audio recording
  const beginRecording = async () => {
    try {
      const path = await startRecording();
      recordingPathRef.current = path;
      setIsRecording(true);
    } catch (err: any) {
      console.error('[HomeScreen] Failed to start recording:', err);
      if (err.message === 'RECORD_AUDIO permission denied') {
        Alert.alert(
          'Permission refusée',
          "MemeMaker a besoin du microphone pour la fonction Voice-to-Meme. Active la permission dans les paramètres.",
        );
      }
      setIsListening(false);
      setListeningMode('none');
    }
  };

  // Stop recording and send audio to backend
  const endRecordingAndAnalyze = async () => {
    if (!isRecording) return;
    try {
      const audioPath = await stopRecording();
      setIsRecording(false);
      recordingPathRef.current = null;

      setVoiceMemeResult(null);
      setIsVoiceMemeSaved(false);
      setIsAnalyzing(true);

      const res = await memeApi.generateFromAudio(
        audioPath,
        'audio/mp4',
        'voice-meme.mp4',
      );

      if (res.success && res.meme) {
        setVoiceMemeResult({
          transcription: res.meme.transcription,
          emotionDetected: res.meme.emotion_detected,
          topText: res.meme.top_text,
          bottomText: res.meme.bottom_text,
          templateSuggestion: res.meme.template_suggestion,
          explanation: res.meme.explanation,
        });
        setShowResultsModal(true);
      } else {
        Alert.alert('Erreur', "L'analyse audio n'a pas retourné de résultats.");
      }
    } catch (error: any) {
      console.error('[HomeScreen] Audio analysis error:', error);
      Alert.alert('Erreur', "Impossible d'analyser l'audio. Vérifie la connexion au serveur.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Hold-to-Talk and Tap-to-Toggle STT Triggers
  const handlePressIn = () => {
    pressStartTime.current = Date.now();
    setIsListening(true);
    setListeningMode('hold');
    beginRecording();
  };

  const handlePressOut = () => {
    const duration = Date.now() - pressStartTime.current;
    if (duration < 350) {
      // Short tap - toggle permanent listening
      if (listeningMode === 'permanent') {
        // Was permanent, user toggled off -> stop & analyze
        setIsListening(false);
        setListeningMode('none');
        endRecordingAndAnalyze();
      } else {
        // Start permanent listening (recording already started via handlePressIn)
        setIsListening(true);
        setListeningMode('permanent');
        if (isMenuOpen) toggleMenu();
      }
    } else {
      // Long press release - stop listening & analyze
      setIsListening(false);
      setListeningMode('none');
      if (isMenuOpen) toggleMenu();
      endRecordingAndAnalyze();
    }
  };

  const handleSTTAction = () => {
    // Close menu first
    toggleMenu();
    // Toggle permanent listening + start recording
    setIsListening(true);
    setListeningMode('permanent');
    beginRecording();
  };

  // Select image and upload to server for analysis
  const handleSelectImage = () => {
    // Close the menu
    toggleMenu();

    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        console.error('ImagePicker error:', response.errorMessage);
        return;
      }
      const asset = response.assets?.[0];
      if (!asset || !asset.uri) return;

      setIsAnalyzing(true);
      setIsImageMemeSaved(false);
      try {
        const res = await memeApi.generateFromImage(
          asset.uri,
          asset.type || 'image/jpeg',
          asset.fileName || 'meme-photo.jpg'
        );

        if (res.success) {
          setImageMemeResult({
            originalImage: memeApi.getImageUrl(res.imageUrl),
            description: res.meme.image_description,
            topText: res.meme.top_text,
            bottomText: res.meme.bottom_text,
            explanation: res.meme.explanation,
            caption: res.meme.caption,
          });
          setShowImageResultsModal(true);
        }
      } catch (error) {
        console.error('Error generating image meme:', error);
      } finally {
        setIsAnalyzing(false);
      }
    });
  };

  const handleGenerateImage = async () => {
    if (!voiceMemeResult) return;
    setIsGeneratingImage(true);
    try {
      const prompt = `${voiceMemeResult.templateSuggestion} meme, funny 2D web comic style`;
      const response = await memeApi.generateMemeImage(
        prompt,
        voiceMemeResult.topText,
        voiceMemeResult.bottomText,
      );
      if (response.success) {
        setGeneratedImageUrl(memeApi.getImageUrl(response.imageUrl));
      }
    } catch (error) {
      console.error('[Voice-to-Meme Image] Erreur:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCloseModal = () => {
    setShowResultsModal(false);
    setGeneratedImageUrl(null);
    setIsGeneratingImage(false);
    setIsVoiceMemeSaved(false);
    setVoiceMemeResult(null);
  };

  const handleShareMeme = async (url: string, message: string) => {
    try {
      await shareMeme(url, message);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de partager le mème.');
    }
  };

  const handleSaveVoiceMeme = async () => {
    if (!generatedImageUrl || !voiceMemeResult || isVoiceMemeSaved || isVoiceSaving) return;
    setIsVoiceSaving(true);
    try {
      const relativeUrl = generatedImageUrl.replace(BASE_URL, '');
      await memeApi.saveMeme({
        author: 'MemeMaker User',
        top_text: voiceMemeResult.topText,
        bottom_text: voiceMemeResult.bottomText,
        imageUrl: relativeUrl,
        explanation: voiceMemeResult.explanation,
        template_suggestion: voiceMemeResult.templateSuggestion,
        style: 'audio',
      });
      setIsVoiceMemeSaved(true);
      Alert.alert('Succès ! 🎉', 'Mème sauvegardé avec succès.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de sauvegarder le mème.');
    } finally {
      setIsVoiceSaving(false);
    }
  };

  const handleSaveImageMeme = async () => {
    if (!imageMemeResult || isImageMemeSaved || isImageSaving) return;
    setIsImageSaving(true);
    try {
      const relativeUrl = imageMemeResult.originalImage.replace(BASE_URL, '');
      await memeApi.saveMeme({
        author: 'MemeMaker User',
        top_text: imageMemeResult.topText,
        bottom_text: imageMemeResult.bottomText,
        imageUrl: relativeUrl,
        explanation: imageMemeResult.explanation,
        template_suggestion: 'Remix Photo',
        style: 'image',
      });
      setIsImageMemeSaved(true);
      Alert.alert('Succès ! 🎉', 'Mème sauvegardé avec succès.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de sauvegarder le mème.');
    } finally {
      setIsImageSaving(false);
    }
  };

  // Interpolations for FAB Menu
  const rotation = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  const sub1TranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -65],
  });

  const sub1Scale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });

  const sub2TranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -125],
  });

  const sub2Scale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });

  // Interpolate voice pulse translateY (H/2 = 28)
  const pulseTranslateY = pulseHeight.interpolate({
    inputRange: [0.5, 1.5],
    outputRange: [-14, 14],
  });

  return (
    <View style={styles.container}>
      {/* Listening / Analyzing Banner Overlays */}
      {isListening && (
        <View style={[styles.listeningBanner, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.listeningBannerText}>
            {listeningMode === 'permanent' ? '🎙️ ÉCOUTE PERMANENTE ACTIVÉE' : '🎙️ CAPTURE AUDIO EN COURS...'}
          </Text>
        </View>
      )}

      {isAnalyzing && (
        <View style={[styles.listeningBanner, { backgroundColor: theme.colors.yellow, paddingTop: insets.top + 12 }]}>
          <Text style={styles.listeningBannerText}>⚡ ANALYSE DE L\'IMAGE / AUDIO...</Text>
        </View>
      )}

      {/* Fixed top header bar */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.brandTitle}>MEMEMAKER</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Bento Grid */}
        <View style={styles.grid}>
          {/* Context Reader - TEXT (Active) */}
          <BentoBox backgroundColor={theme.colors.pink} style={styles.gridItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Context Reader</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIF ⚡</Text>
              </View>
            </View>
            <Text style={styles.itemDescription}>
              Copie-colle un extrait de chat ou décris une situation. L\'IA trouve la punchline et génère le mème parfait !
            </Text>
            <BrutalButton
              title="C\'est parti ➔"
              backgroundColor={theme.colors.white}
              onPress={() => onNavigate('TextMeme')}
              style={styles.itemButton}
            />
          </BentoBox>

          {/* Voice-to-Meme - AUDIO (Active now via FAB Menu!) */}
          <BentoBox backgroundColor={theme.colors.cyan} style={styles.gridItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Voice-to-Meme</Text>
              <View style={[styles.activeBadge, { backgroundColor: theme.colors.pink }]}>
                <Text style={[styles.activeBadgeText, { color: theme.colors.white }]}>ACTIF 🎙️</Text>
              </View>
            </View>
            <Text style={styles.itemDescription}>
              Active l\'écoute permanente ou maintiens le micro magique en bas à droite pour transformer tes paroles en mème instantané !
            </Text>
            {listeningMode === 'permanent' && (
              <BrutalButton
                title="Arrêter l\'écoute"
                backgroundColor={theme.colors.white}
                onPress={() => {
                  setIsListening(false);
                  setListeningMode('none');
                  endRecordingAndAnalyze();
                }}
                style={styles.itemButton}
              />
            )}
          </BentoBox>
        </View>

        {/* Footer Credit */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MEMEMAKER v1.0.0 • PROJET IA 🧠</Text>
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) Menu (bottom-right) */}
      <View style={styles.fabMenuContainer} pointerEvents="box-none">
        
        {/* Radar Waves Behind (when capturing audio) */}
        {isListening && (
          <>
            <Animated.View
              style={[
                styles.fabWave,
                {
                  transform: [
                    { scale: wave1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.0] }) },
                  ],
                  opacity: wave1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.fabWave,
                {
                  transform: [
                    { scale: wave2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.0] }) },
                  ],
                  opacity: wave2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                },
              ]}
            />
          </>
        )}

        {/* Sub-FAB 2: Image Upload (Pink) */}
        <Animated.View
          style={[
            styles.subFabWrapper,
            {
              transform: [
                { translateY: sub2TranslateY },
                { scale: sub2Scale }
              ],
              opacity: menuAnimation,
            }
          ]}
          pointerEvents={isMenuOpen ? 'auto' : 'none'}
        >
          <View style={styles.subFabShadow} />
          <Pressable
            style={[styles.subFab, { backgroundColor: theme.colors.pink }]}
            onPress={handleSelectImage}
          >
            <CameraIcon color={theme.colors.white} />
          </Pressable>
        </Animated.View>

        {/* Sub-FAB 1: STT Microphone (Yellow) */}
        <Animated.View
          style={[
            styles.subFabWrapper,
            {
              transform: [
                { translateY: sub1TranslateY },
                { scale: sub1Scale }
              ],
              opacity: menuAnimation,
            }
          ]}
          pointerEvents={isMenuOpen ? 'auto' : 'none'}
        >
          <View style={styles.subFabShadow} />
          <Pressable
            style={[styles.subFab, { backgroundColor: theme.colors.yellow }]}
            onPress={handleSTTAction}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <MicIcon color={theme.colors.black} />
          </Pressable>
        </Animated.View>

        {/* Main FAB Shadow (rotates with the icon) */}
        <Animated.View style={[styles.mainFabShadow, { transform: [{ rotate: rotation }] }]} />

        {/* Main FAB Trigger */}
        <Pressable
          style={styles.mainFabPressable}
          onPress={toggleMenu}
        >
          <Animated.View
            style={[
              styles.mainFabContent,
              {
                backgroundColor: isMenuOpen ? theme.colors.black : (isListening ? theme.colors.pink : theme.colors.cyan),
                transform: [
                  { rotate: rotation },
                  // If listening, apply the voice pulse deformation translateY & scaleY!
                  { scaleY: isListening ? pulseHeight : 1.0 },
                  { translateY: isListening ? pulseTranslateY : 0 }
                ],
              }
            ]}
          >
            <PlusIcon color={isMenuOpen ? theme.colors.white : (isListening ? theme.colors.white : theme.colors.black)} />
          </Animated.View>
        </Pressable>
      </View>

      {/* Voice Results Modal */}
      <Modal
        visible={showResultsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <BentoBox
            backgroundColor={theme.colors.bg}
            style={styles.modalCard}
            borderTopLeftRadius={24}
            borderBottomRightRadius={24}
          >
            <Text style={styles.modalTitle}>MÈMERIE AUDIO PROVENANT DU FUTUR 🎙️</Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                {voiceMemeResult && (
                  <>
                    {/* Transcription */}
                    <View style={styles.resultField}>
                      <Text style={styles.fieldLabel}>CE QUE TU AS DIT :</Text>
                      <Text style={styles.fieldValue}>
                        « {voiceMemeResult.transcription} »
                      </Text>
                    </View>

                    {/* Emotion */}
                    <View style={styles.resultField}>
                      <Text style={styles.fieldLabel}>ÉMOTION DÉTECTÉE :</Text>
                      <Text style={[styles.fieldValue, { color: theme.colors.pink, fontWeight: '900' }]}>
                        {voiceMemeResult.emotionDetected}
                      </Text>
                    </View>

                    {/* Meme Text Box */}
                    <View style={styles.memeResultBox}>
                      <Text style={styles.memeTextHeader}>{voiceMemeResult.templateSuggestion}</Text>
                      <View style={styles.memeTextDivider} />
                      <Text style={styles.memeTextContent}>{voiceMemeResult.topText}</Text>
                      <View style={styles.memeTextSubDivider} />
                      <Text style={styles.memeTextContent}>{voiceMemeResult.bottomText}</Text>
                    </View>
                  </>
                )}

                {/* Generated Image Frame */}
                {isGeneratingImage && (
                  <View style={styles.imageLoadingBox}>
                    <ActivityIndicator size="large" color={theme.colors.pink} />
                    <Text style={styles.loadingText}>Génération de l\'image...</Text>
                  </View>
                )}

                {generatedImageUrl && (
                  <View style={styles.polaroidFrame}>
                    <Image source={{ uri: generatedImageUrl }} style={styles.polaroidImage} />
                    <Text style={styles.polaroidCaption}>{voiceMemeResult?.templateSuggestion ?? 'VOICE MEME'} (POLLINATIONS.AI)</Text>
                  </View>
                )}

                {/* Explanation */}
                {voiceMemeResult && !isGeneratingImage && !generatedImageUrl && (
                  <Text style={styles.explanationText}>
                    Explication : {voiceMemeResult.explanation}
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {!generatedImageUrl ? (
                <>
                  <BrutalButton
                    title="Générer l'Image 🎨"
                    backgroundColor={theme.colors.yellow}
                    onPress={handleGenerateImage}
                    disabled={isGeneratingImage}
                    style={styles.modalBtn}
                  />
                  <BrutalButton
                    title="Fermer"
                    backgroundColor={theme.colors.white}
                    onPress={handleCloseModal}
                    style={styles.modalBtn}
                  />
                </>
              ) : (
                <>
                  <BrutalButton
                    title="Partager 🚀"
                    backgroundColor={theme.colors.yellow}
                    onPress={() => handleShareMeme(
                      generatedImageUrl,
                      `Regarde le mème audio que je viens de créer ! 🎙️🚀\n"${voiceMemeResult?.topText ?? ''} - ${voiceMemeResult?.bottomText ?? ''}"`
                    )}
                    style={styles.modalBtn}
                  />
                  <BrutalButton
                    title={isVoiceMemeSaved ? "Sauvé ✓" : "Sauver 💾"}
                    backgroundColor={isVoiceMemeSaved ? theme.colors.green : theme.colors.cyan}
                    onPress={handleSaveVoiceMeme}
                    disabled={isVoiceMemeSaved || isVoiceSaving}
                    style={styles.modalBtn}
                  />
                  <BrutalButton
                    title="Fermer"
                    backgroundColor={theme.colors.white}
                    onPress={handleCloseModal}
                    style={styles.modalBtn}
                  />
                </>
              )}
            </View>
          </BentoBox>
        </View>
      </Modal>

      {/* Image Meme Results Modal */}
      <Modal
        visible={showImageResultsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BentoBox
            backgroundColor={theme.colors.bg}
            style={styles.modalCard}
            borderTopLeftRadius={24}
            borderBottomRightRadius={24}
          >
            <Text style={styles.modalTitle}>REMIX PHOTO CRÉÉ 🎨</Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                
                {/* Asymmetric Polaroid Frame with Overlay Text (Meme style) */}
                {imageMemeResult && (
                  <View style={styles.polaroidFrame}>
                    <View style={styles.memeImageContainer}>
                      <Image
                        source={{ uri: imageMemeResult.originalImage }}
                        style={styles.polaroidImage}
                        resizeMode="cover"
                      />
                      
                      {/* Top text overlay */}
                      <View style={styles.overlayTextContainerTop}>
                        <Text style={styles.overlayMemeText}>{imageMemeResult.topText}</Text>
                      </View>
                      
                      {/* Bottom text overlay */}
                      <View style={styles.overlayTextContainerBottom}>
                        <Text style={styles.overlayMemeText}>{imageMemeResult.bottomText}</Text>
                      </View>
                    </View>
                    <Text style={styles.polaroidCaption}>REMIX PHOTO PAR IA 🧠</Text>
                  </View>
                )}

                {imageMemeResult && (
                  <>
                    {/* Scene description */}
                    <View style={styles.resultField}>
                      <Text style={styles.fieldLabel}>ANALYSE DE LA SCÈNE :</Text>
                      <Text style={styles.fieldValue}>{imageMemeResult.description}</Text>
                    </View>

                    {/* Explanation */}
                    <View style={styles.resultField}>
                      <Text style={styles.fieldLabel}>POURQUOI C\'EST DRÔLE :</Text>
                      <Text style={styles.fieldValue}>{imageMemeResult.explanation}</Text>
                    </View>

                    {/* Caption for socials */}
                    <View style={styles.resultField}>
                      <Text style={styles.fieldLabel}>LÉGENDE DE PARTAGE :</Text>
                      <Text style={[styles.fieldValue, { fontStyle: 'italic' }]}>{imageMemeResult.caption}</Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {imageMemeResult && (
                <>
                  <BrutalButton
                    title="Partager 🚀"
                    backgroundColor={theme.colors.yellow}
                    onPress={() => handleShareMeme(
                      imageMemeResult.originalImage,
                      `${imageMemeResult.caption}\n\nCréé avec MemeMaker 🎨🚀`
                    )}
                    style={styles.modalBtn}
                  />
                  <BrutalButton
                    title={isImageMemeSaved ? "Sauvé ✓" : "Sauver 💾"}
                    backgroundColor={isImageMemeSaved ? theme.colors.green : theme.colors.cyan}
                    onPress={handleSaveImageMeme}
                    disabled={isImageMemeSaved || isImageSaving}
                    style={styles.modalBtn}
                  />
                </>
              )}
              <BrutalButton
                title="Fermer"
                backgroundColor={theme.colors.white}
                onPress={() => setShowImageResultsModal(false)}
                style={styles.modalBtn}
              />
            </View>
          </BentoBox>
        </View>
      </Modal>
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
    zIndex: 5,
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
    paddingBottom: 110,
  },
  grid: {
    gap: 20,
  },
  gridItem: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.black,
  },
  itemDescription: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.black,
    lineHeight: 20,
    marginBottom: 16,
  },
  activeBadge: {
    backgroundColor: theme.colors.yellow,
    borderWidth: 2,
    borderColor: theme.colors.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.black,
  },
  itemButton: {
    alignSelf: 'flex-start',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    color: theme.colors.darkGray,
  },
  // Floating voice button / FAB Menu container (bottom-right)
  fabMenuContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mainFabShadow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 3,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.black,
    transform: [
      { translateX: theme.shadow.offset },
      { translateY: theme.shadow.offset },
    ],
  },
  mainFabPressable: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  mainFabContent: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 3,
    borderColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subFabWrapper: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subFabShadow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.black,
    transform: [
      { translateX: 3 },
      { translateY: 3 },
    ],
  },
  subFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWave: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.pink,
    backgroundColor: 'transparent',
  },
  // Overlays
  listeningBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.pink,
    borderBottomWidth: 3,
    borderColor: theme.colors.black,
    alignItems: 'center',
    zIndex: 100,
    paddingBottom: 10,
  },
  listeningBannerText: {
    fontFamily: theme.fonts.heading,
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.black,
    textTransform: 'uppercase',
  },
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.black,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  modalScroll: {
    maxHeight: '70%',
    marginBottom: 16,
  },
  modalContent: {
    gap: 12,
  },
  resultField: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    padding: 10,
  },
  fieldLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.darkGray,
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.black,
    lineHeight: 18,
  },
  memeResultBox: {
    borderWidth: 3,
    borderColor: theme.colors.black,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#222',
  },
  memeTextHeader: {
    fontFamily: theme.fonts.heading,
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.yellow,
  },
  memeTextDivider: {
    height: 2,
    backgroundColor: theme.colors.yellow,
    width: '30%',
    marginVertical: 6,
  },
  memeTextContent: {
    fontFamily: theme.fonts.heading,
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.white,
    textAlign: 'center',
  },
  memeTextSubDivider: {
    height: 1,
    backgroundColor: theme.colors.white,
    width: '20%',
    marginVertical: 4,
    opacity: 0.3,
  },
  polaroidFrame: {
    backgroundColor: theme.colors.white,
    borderWidth: 3,
    borderColor: theme.colors.black,
    padding: 10,
    paddingBottom: 16,
    alignItems: 'center',
    marginTop: 8,
    transform: [{ rotate: '1deg' }],
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 1.2,
    borderWidth: 3,
    borderColor: theme.colors.black,
  },
  polaroidCaption: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.black,
    marginTop: 10,
  },
  imageLoadingBox: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 3,
    borderColor: theme.colors.black,
    borderRadius: 8,
    marginTop: 8,
  },
  loadingText: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.black,
    marginTop: 8,
  },
  explanationText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.darkGray,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
  },
  // Overlay meme styles
  memeImageContainer: {
    width: '100%',
    aspectRatio: 1.2,
    borderWidth: 3,
    borderColor: theme.colors.black,
    position: 'relative',
    overflow: 'hidden',
  },
  overlayTextContainerTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  overlayTextContainerBottom: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  overlayMemeText: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
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
