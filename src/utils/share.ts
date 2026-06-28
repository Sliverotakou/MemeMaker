import { NativeModules, Platform, Share } from 'react-native';

const { MemeShare } = NativeModules;

/**
 * Lance le partage natif d'un mème image avec un texte d'accompagnement.
 * Utilise notre module Kotlin personnalisé sur Android et le module Share standard sur iOS.
 * 
 * @param imagePath Chemin d'accès local du fichier image (ex: '/data/.../uploads/generated.png')
 * @param message Message d'accompagnement textuel
 */
export const shareMeme = async (imagePath: string, message: string): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      if (!MemeShare) {
        throw new Error("Le module natif MemeShare n'est pas lié ou initialisé.");
      }
      return await MemeShare.shareMeme(imagePath, message);
    } catch (error) {
      console.error('Android Native Share Error:', error);
      // Repli vers le Share de base en cas de pépin
      return await fallbackShare(imagePath, message);
    }
  } else {
    return await fallbackShare(imagePath, message);
  }
};

/**
 * Lance le partage natif d'un sticker au format WebP.
 * 
 * @param imagePath Chemin d'accès local ou distant du fichier sticker
 */
export const shareSticker = async (imagePath: string): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      if (!MemeShare) {
        throw new Error("Le module natif MemeShare n'est pas lié ou initialisé.");
      }
      return await MemeShare.shareSticker(imagePath);
    } catch (error) {
      console.error('Android Native Sticker Share Error:', error);
      return await fallbackShare(imagePath, 'Mon Sticker');
    }
  } else {
    return await fallbackShare(imagePath, 'Mon Sticker');
  }
};

const fallbackShare = async (imagePath: string, message: string): Promise<boolean> => {
  try {
    await Share.share({
      url: imagePath,
      message: message,
    });
    return true;
  } catch (error) {
    console.error('Fallback Share Error:', error);
    return false;
  }
};
