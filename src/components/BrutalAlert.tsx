import React from 'react';
import { StyleSheet, Text, View, Modal } from 'react-native';
import { theme } from '../styles/theme';
import { BentoBox } from './BentoBox';
import { BrutalButton } from './BrutalButton';

interface BrutalAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const BrutalAlert: React.FC<BrutalAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.green;
      case 'error':
        return '#FFD1D1'; // Rouge/rose néo-brutaliste
      case 'info':
      default:
        return theme.colors.yellow;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BentoBox
          backgroundColor={getBackgroundColor()}
          style={styles.card}
          borderTopLeftRadius={16}
          borderBottomRightRadius={16}
          shadowOffset={6}
        >
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          <View style={styles.divider} />
          <Text style={styles.message}>{message}</Text>
          <BrutalButton
            title="D'ACCORD"
            backgroundColor={theme.colors.white}
            onPress={onClose}
            style={styles.btn}
            shadowOffset={3}
            borderRadius={8}
          />
        </BentoBox>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 3,
    backgroundColor: theme.colors.black,
    width: '100%',
    marginBottom: 16,
  },
  message: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.black,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  btn: {
    width: '100%',
  },
});
