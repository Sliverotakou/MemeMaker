import { Platform } from 'react-native';

export const theme = {
  colors: {
    bg: '#FCF8F2',        // Cream background
    black: '#0C0C0C',     // Solid deep black
    white: '#FFFFFF',     // Pure white
    yellow: '#FFE600',    // Neon yellow
    pink: '#FF5EF2',      // Hot pink
    cyan: '#00F0FF',      // Rebellious cyan
    green: '#4ADE80',     // Lime green
    gray: '#DFDFDF',      // Disabled/inactive background
    darkGray: '#7E7E7E',  // Subtext color
  },
  borders: {
    width: 3,
    color: '#0C0C0C',
    radius: 12,
    radiusLarge: 16,
    radiusSmall: 8,
  },
  shadow: {
    offset: 4,
  },
  fonts: {
    // Rebellious thick fonts using system fallbacks
    heading: Platform.select({
      ios: 'Arial Rounded MT Bold',
      android: 'sans-serif-condensed',
      default: 'System',
    }),
    body: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'Courier-Bold',
      android: 'monospace',
      default: 'monospace',
    }),
  },
};
