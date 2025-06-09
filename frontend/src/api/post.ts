import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://your-api-url.com';

export const createPost = async ({ phrase, image }: { phrase: string; image?: string }) => {
  const token = await AsyncStorage.getItem('access_token');
  const formData = new FormData();

  formData.append('phrase', phrase);
  if (image) {
    formData.append('image', {
      uri: image,
      name: 'upload.jpg',
      type: 'image/jpeg',
    } as any);
  }

  await axios.post(`${API_URL}/posts`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
};