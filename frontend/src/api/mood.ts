// src/api/mood.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getMoodStories = async () => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) throw new Error('No token found');

  const res = await axios.get('https://mycarering.loca.lt/mood/stories', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data; // ✅ [{ user_id, nickname, image_url, date, isFriend, mood }]
};