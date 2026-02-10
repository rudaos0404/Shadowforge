import axios from "axios";
import { env } from "../config/env";
import { useAuthStore } from "../../stores/auth.store";

export const http = axios.create({
  baseURL: env.API_BASE_URL, // 예: http://localhost:3000/api
  timeout: 10_000,
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`; // 명세: Bearer 토큰 :contentReference[oaicite:1]{index=1}
  }
  return config;
});
