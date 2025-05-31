import axios from 'axios';

const SERVER_IP = '192.168.0.10';  // XAMPP 서버가 실행되는 IP 주소
const PORT = 3000;
const BASE_URL = `http://${SERVER_IP}:${PORT}`;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const addUser = async (name: string, email: string, age: number) => {
  const response = await api.post('/users', { name, email, age });
  return response.data;
};