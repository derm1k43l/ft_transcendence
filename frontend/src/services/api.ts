import axios from 'https://esm.sh/axios';

export const api = axios.create({ baseURL: 'http://localhost:3000/api' });
