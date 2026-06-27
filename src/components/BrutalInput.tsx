import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../styles/theme';

interface BrutalInputProps extends TextInputProps {
  style?: StyleProp<ViewStyle>;
  inputStyle?: any;
  containerStyle?: StyleProp<ViewStyle>;
  shadowColor?: string;
  shadowOffset?: number;
  borderRadius?: number;
}

export const BrutalInput: React.FC<BrutalInputProps> = ({
  style,
  inputStyle,
  containerStyle,
  shadowColor = theme.colors.black,
  shadowOffset = theme.shadow.offset,
  borderRadius = theme.borders.radius,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Shadow layer */}
      <View
        style={[
          styles.shadow,
          {
            backgroundColor: shadowColor,
            borderRadius: borderRadius,
            transform: [{ translateX: shadowOffset }, { translateY: shadowOffset }],
          },
        ]}
      />
      {/* Content layer (TextInput) */}
      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: isFocused ? '#FFFEE5' : theme.colors.white, // light yellow tint on focus
            borderRadius: borderRadius,
            borderWidth: theme.borders.width,
            borderColor: theme.colors.black,
          },
          style,
        ]}
      >
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.colors.darkGray}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...props}
        />
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
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.black,
    paddingVertical: 10,
  },
});
