// src/api/client.ts (새 파일 생성)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({ baseURL: 'https://mycarering.loca.lt' });

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) { // 토큰 만료 시
      await AsyncStorage.removeItem('token');
      window.location.href = '/login'; // React Native라면 navigation 사용
    }
    return Promise.reject(error);
  }
);

export default api;