import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { theme } from '../styles/theme';

interface BrutalAILoaderProps {
  message?: string;
}

export const BrutalAILoader: React.FC<BrutalAILoaderProps> = ({
  message = "L'IA analyse le dossier...",
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim1 = useRef(new Animated.Value(0.8)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.8)).current;
  const scaleAnim3 = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  const scanAnim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    // 1. Rotation loop for the sparkles
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Pulsing opacity for the text
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Staggered pulsing scale for the three sparkles
    const createPulse = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createPulse(scaleAnim1, 0),
      createPulse(scaleAnim2, 200),
      createPulse(scaleAnim3, 400),
    ]).start();

    // 4. Matrix scan line sweeping back and forth
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 150,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: -80,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [rotateAnim, scaleAnim1, scaleAnim2, scaleAnim3, opacityAnim, scanAnim]);

  // Interpolate rotation to degrees
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Sparkles Group */}
      <View style={styles.sparkleContainer}>
        <Animated.Text
          style={[
            styles.sparkle,
            { color: theme.colors.pink, transform: [{ scale: scaleAnim1 }, { rotate: spin }] },
          ]}
        >
          ✦
        </Animated.Text>
        <Animated.Text
          style={[
            styles.sparkleLarge,
            { color: theme.colors.yellow, transform: [{ scale: scaleAnim2 }, { rotate: spin }] },
          ]}
        >
          ✦
        </Animated.Text>
        <Animated.Text
          style={[
            styles.sparkle,
            { color: theme.colors.cyan, transform: [{ scale: scaleAnim3 }, { rotate: spin }] },
          ]}
        >
          ✦
        </Animated.Text>
      </View>

      {/* Pulsing message */}
      <Animated.Text style={[styles.loadingText, { opacity: opacityAnim }]}>
        {message.toUpperCase()}
      </Animated.Text>

      {/* Brutalist AI Progress Bar */}
      <View style={styles.scanBarContainer}>
        <Animated.View
          style={[
            styles.scanBar,
            {
              transform: [{ translateX: scanAnim }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    width: '100%',
  },
  sparkleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 20,
    marginBottom: 16,
  },
  sparkle: {
    fontSize: 32,
    fontWeight: '900',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0.1,
  },
  sparkleLarge: {
    fontSize: 48,
    fontWeight: '900',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0.1,
    marginTop: -8,
  },
  loadingText: {
    fontFamily: theme.fonts.heading,
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.black,
    textAlign: 'center',
    letterSpacing: 1,
  },
  scanBarContainer: {
    width: 150,
    height: 8,
    backgroundColor: '#000000',
    borderRadius: 4,
    marginTop: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000000',
  },
  scanBar: {
    width: 60,
    height: '100%',
    backgroundColor: theme.colors.pink,
    borderRadius: 2,
  },
});
