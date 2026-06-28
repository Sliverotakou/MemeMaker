import axios from 'axios';
import { Platform } from 'react-native';

// Detect emulator vs local network to set base API URL
export const BASE_URL = Platform.select({
  android: 'http://localhost:3000', // Changé de 10.0.2.2 à localhost pour fonctionner sur appareil physique avec adb reverse
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Generative AI calls might take some time, especially image generation
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GenerateTextMemeResponse {
  success: boolean;
  meme: {
    top_text: string;
    bottom_text: string;
    template_suggestion: string;
    explanation: string;
    image_prompt: string;
  };
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl: string; // Path returned by server e.g. "/uploads/generated-12345.png"
  description: string;
}

export interface GenerateAudioMemeResponse {
  success: boolean;
  meme: {
    transcription: string;
    emotion_detected: string;
    top_text: string;
    bottom_text: string;
    template_suggestion: string;
    explanation: string;
  };
}

export interface SavedMeme {
  id: string;
  author: string;
  top_text: string;
  bottom_text: string;
  imageUrl: string;
  explanation: string;
  template_suggestion: string;
  style?: string;
  createdAt: string;
}

export const memeApi = {
  // Generate meme text from conversation extract
  generateFromText: async (text: string, style: string = 'humour général'): Promise<GenerateTextMemeResponse> => {
    const response = await api.post<GenerateTextMemeResponse>('/api/meme/from-text', { text, style });
    return response.data;
  },

  // Generate meme image from visual prompt
  generateMemeImage: async (prompt: string, topText?: string, bottomText?: string): Promise<GenerateImageResponse> => {
    const response = await api.post<GenerateImageResponse>('/api/meme/generate-image', {
      prompt,
      top_text: topText,
      bottom_text: bottomText,
    });
    return response.data;
  },

  // Upload an image and generate meme text + analysis
  generateFromImage: async (imageUri: string, mimeType: string, fileName: string): Promise<any> => {
    const formData = new FormData();
    formData.append('image', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      type: mimeType || 'image/jpeg',
      name: fileName || 'upload.jpg',
    } as any);

    const response = await api.post('/api/meme/from-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload recorded audio and generate meme from voice analysis
  generateFromAudio: async (audioPath: string, mimeType: string, fileName: string): Promise<GenerateAudioMemeResponse> => {
    const formData = new FormData();
    formData.append('audio', {
      uri: Platform.OS === 'ios' ? audioPath.replace('file://', '') : audioPath,
      type: mimeType || 'audio/mp4',
      name: fileName || 'recording.mp4',
    } as any);

    const response = await api.post<GenerateAudioMemeResponse>('/api/meme/from-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Audio analysis via Gemini can take longer
    });
    return response.data;
  },

  // Save a meme to backend JSON DB
  saveMeme: async (meme: Omit<SavedMeme, 'id' | 'createdAt'>): Promise<{ success: boolean; meme: SavedMeme }> => {
    const response = await api.post<{ success: boolean; meme: SavedMeme }>('/api/meme/save', meme);
    return response.data;
  },

  // Get the feed of saved memes
  getMemeFeed: async (): Promise<{ success: boolean; memes: SavedMeme[] }> => {
    const response = await api.get<{ success: boolean; memes: SavedMeme[] }>('/api/meme/feed');
    return response.data;
  },

  // Apply filter to image using sharp backend
  applyFilter: async (imageUrl: string, filter: string): Promise<{ success: boolean; imageUrl: string }> => {
    const response = await api.post<{ success: boolean; imageUrl: string }>('/api/meme/apply-filter', {
      imageUrl,
      filter,
    });
    return response.data;
  },

  // Helper to build full image URL from relative server path
  getImageUrl: (relativeUrl: string): string => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    // Remove duplicate slash if present
    const cleanPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${BASE_URL}${cleanPath}`;
  },
};
