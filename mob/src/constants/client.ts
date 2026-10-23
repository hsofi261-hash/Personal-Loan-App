import axios from 'axios';
import { API_URL } from './api';



export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});