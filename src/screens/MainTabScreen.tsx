import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../styles/theme';
import { HomeScreen } from './HomeScreen';
import { TextMemeScreen } from './TextMemeScreen';
import { FluxScreen } from './FluxScreen';
import { MoiScreen } from './MoiScreen';

// Custom Material SVG Icons
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path fill={color} d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </Svg>
);

const HeartIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
    />
  </Svg>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  </Svg>
);

export const MainTabScreen = () => {
  const [activeTab, setActiveTab] = useState<'atelier' | 'flux' | 'moi'>('atelier');
  const [atelierScreen, setAtelierScreen] = useState<'bento' | 'text-meme'>('bento');
  const insets = useSafeAreaInsets();

  // Render current active screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'atelier':
        if (atelierScreen === 'text-meme') {
          return <TextMemeScreen onBack={() => setAtelierScreen('bento')} />;
        }
        return (
          <HomeScreen
            onNavigate={(screen: string) => {
              if (screen === 'TextMeme') setAtelierScreen('text-meme');
            }}
          />
        );
      case 'flux':
        return <FluxScreen />;
      case 'moi':
        return <MoiScreen isVisible={activeTab === 'moi'} />;
      default:
        return (
          <HomeScreen
            onNavigate={(screen: string) => {
              if (screen === 'TextMeme') setAtelierScreen('text-meme');
            }}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>{renderScreen()}</View>

      {/* Persistent Bottom Bar */}
      <View
        style={[
          styles.bottomNav,
          {
            height: (Platform.OS === 'ios' ? 56 : 60) + insets.bottom,
          },
        ]}
      >
        {/* Atelier Tab */}
        <Pressable
          style={[
            styles.navItem,
            activeTab === 'atelier' && styles.navItemActive,
            { paddingBottom: insets.bottom },
          ]}
          onPress={() => {
            setActiveTab('atelier');
            if (activeTab === 'atelier') {
              setAtelierScreen('bento');
            }
          }}
        >
          <HomeIcon color={activeTab === 'atelier' ? theme.colors.black : theme.colors.white} />
          <Text style={[styles.navText, activeTab === 'atelier' && styles.navTextActive]}>Home</Text>
        </Pressable>

        {/* Flux Tab */}
        <Pressable
          style={[
            styles.navItem,
            activeTab === 'flux' && styles.navItemActive,
            { paddingBottom: insets.bottom },
          ]}
          onPress={() => setActiveTab('flux')}
        >
          <HeartIcon color={activeTab === 'flux' ? theme.colors.black : theme.colors.white} />
          <Text style={[styles.navText, activeTab === 'flux' && styles.navTextActive]}>Flux</Text>
        </Pressable>

        {/* Moi Tab */}
        <Pressable
          style={[
            styles.navItem,
            { borderRightWidth: 0 },
            activeTab === 'moi' && styles.navItemActive,
            { paddingBottom: insets.bottom },
          ]}
          onPress={() => setActiveTab('moi')}
        >
          <ProfileIcon color={activeTab === 'moi' ? theme.colors.black : theme.colors.white} />
          <Text style={[styles.navText, activeTab === 'moi' && styles.navTextActive]}>Moi</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  contentArea: {
    flex: 1,
  },
  bottomNav: {
    backgroundColor: theme.colors.black,
    borderTopWidth: 4,
    borderColor: theme.colors.black,
    flexDirection: 'row',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 2,
    borderColor: '#222222',
    gap: 1,
    paddingTop: 6,
  },
  navItemActive: {
    backgroundColor: theme.colors.yellow,
  },
  navText: {
    fontFamily: theme.fonts.body,
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.white,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  navTextActive: {
    color: theme.colors.black,
  },
});
