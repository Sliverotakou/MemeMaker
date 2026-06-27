import React, { useRef } from 'react';
import { StyleSheet, Text, Pressable, View, Animated, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { theme } from '../styles/theme';

interface BrutalButtonProps {
  onPress?: () => void;
  children?: React.ReactNode;
  title?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  shadowOffset?: number;
  borderRadius?: number;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({
  onPress,
  children,
  title,
  backgroundColor = theme.colors.yellow,
  style,
  contentStyle,
  textStyle,
  disabled = false,
  shadowOffset = theme.shadow.offset,
  borderRadius = theme.borders.radius,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.timing(animatedValue, {
      toValue: shadowOffset,
      duration: 60,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 60,
      useNativeDriver: true,
    }).start();
  };

  const activeBgColor = disabled ? theme.colors.gray : backgroundColor;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.container, style]}
    >
      {/* Shadow layer (does not move) */}
      <View
        style={[
          styles.shadow,
          {
            backgroundColor: disabled ? 'transparent' : theme.colors.black,
            borderRadius: borderRadius,
            transform: [{ translateX: shadowOffset }, { translateY: shadowOffset }],
          },
        ]}
      />
      {/* Content layer (slides down and right when pressed) */}
      <Animated.View
        style={[
          styles.content,
          {
            backgroundColor: activeBgColor,
            borderRadius: borderRadius,
            borderWidth: theme.borders.width,
            borderColor: theme.colors.black,
            transform: [
              { translateX: animatedValue },
              { translateY: animatedValue },
            ],
          },
          contentStyle,
        ]}
      >
        {children ? (
          children
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: theme.fonts.heading,
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.black,
    textTransform: 'uppercase',
  },
});
