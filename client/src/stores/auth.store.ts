import { create } from "zustand";
import { env } from "../shared/config/env";
import { storage } from "../shared/utils/storage";

const TOKEN_KEY = "sf_access_token";

type AuthState = {
  accessToken: string | null;
  setToken: (token: string | null) => void;
  initToken: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,

  setToken: (token) => {
    if (token) storage.set(TOKEN_KEY, token);
    else storage.remove(TOKEN_KEY);
    set({ accessToken: token });
  },

  initToken: () => {
    const saved = storage.get(TOKEN_KEY);
    if (saved) {
      set({ accessToken: saved });
      return;
    }

    // 개발용 가짜 토큰 자동 주입
    if (env.DEV_FAKE_TOKEN) {
      storage.set(TOKEN_KEY, env.DEV_FAKE_TOKEN);
      set({ accessToken: env.DEV_FAKE_TOKEN });
    }
  },

  logout: () => {
    get().setToken(null);
  },
}));
