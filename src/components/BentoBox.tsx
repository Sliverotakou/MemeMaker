import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../styles/theme';

interface BentoBoxProps {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  shadowColor?: string;
  shadowOffset?: number;
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
}

export const BentoBox: React.FC<BentoBoxProps> = ({
  children,
  backgroundColor = theme.colors.white,
  style,
  contentStyle,
  shadowColor = theme.colors.black,
  shadowOffset = theme.shadow.offset,
  borderRadius = theme.borders.radius,
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Shadow layer */}
      <View
        style={[
          styles.shadow,
          {
            backgroundColor: shadowColor,
            borderRadius: borderRadius,
            borderTopLeftRadius: borderTopLeftRadius,
            borderTopRightRadius: borderTopRightRadius,
            borderBottomLeftRadius: borderBottomLeftRadius,
            borderBottomRightRadius: borderBottomRightRadius,
            transform: [{ translateX: shadowOffset }, { translateY: shadowOffset }],
          },
        ]}
      />
      {/* Content layer */}
      <View
        style={[
          styles.content,
          {
            backgroundColor: backgroundColor,
            borderRadius: borderRadius,
            borderTopLeftRadius: borderTopLeftRadius,
            borderTopRightRadius: borderTopRightRadius,
            borderBottomLeftRadius: borderBottomLeftRadius,
            borderBottomRightRadius: borderBottomRightRadius,
            borderWidth: theme.borders.width,
            borderColor: theme.colors.black,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.black,
  },
  content: {
    padding: 16,
  },
});
