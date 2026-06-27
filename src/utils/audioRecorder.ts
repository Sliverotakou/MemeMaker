import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { PermissionsAndroid, Platform } from 'react-native';

const audioRecorderPlayer = AudioRecorderPlayer;

/**
 * Request RECORD_AUDIO permission on Android.
 * Returns true if granted, false otherwise.
 */
export const requestAudioPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Permission Microphone',
        message:
          'MemeMaker a besoin d\'accéder au microphone pour capturer ta voix et générer des mèmes audio.',
        buttonPositive: 'Autoriser',
        buttonNegative: 'Refuser',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('[AudioRecorder] Permission error:', err);
    return false;
  }
};

/**
 * Start recording audio to a .mp4 file in the app's cache directory.
 * Returns the file path where audio is being recorded.
 * Throws if permission is denied.
 */
export const startRecording = async (): Promise<string> => {
  const hasPermission = await requestAudioPermission();
  if (!hasPermission) {
    throw new Error('RECORD_AUDIO permission denied');
  }

  // Use default path — react-native-audio-recorder-player saves to cache dir
  // On Android this creates a file like /data/.../cache/sound.mp4
  const result = await audioRecorderPlayer.startRecorder();
  console.log('[AudioRecorder] Recording started:', result);
  return result;
};

/**
 * Stop the current recording session.
 * Returns the final file path of the recorded audio.
 */
export const stopRecording = async (): Promise<string> => {
  const result = await audioRecorderPlayer.stopRecorder();
  audioRecorderPlayer.removeRecordBackListener();
  console.log('[AudioRecorder] Recording stopped:', result);
  return result;
};

/**
 * Clean up recorder resources. Call when component unmounts.
 */
export const cleanupRecorder = (): void => {
  audioRecorderPlayer.removeRecordBackListener();
};

export default {
  requestAudioPermission,
  startRecording,
  stopRecording,
  cleanupRecorder,
};
