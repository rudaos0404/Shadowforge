import { http } from "./http";
import type {
  MeResponse,
  GameSave,
  SaveGameRequest,
  SaveGameResponse,
  RankingListResponse,
  SubmitRankingRequest,
  SubmitRankingResponse,
} from "./types";

export const api = {
  // GET /users/me :contentReference[oaicite:7]{index=7}
  me: async () => {
    const res = await http.get<MeResponse>("/users/me");
    return res.data;
  },

  // GET /game/save :contentReference[oaicite:8]{index=8}
  loadGame: async () => {
    const res = await http.get<GameSave>("/game/save");
    return res.data;
  },

  // POST /game/save :contentReference[oaicite:9]{index=9}
  saveGame: async (body: SaveGameRequest) => {
    const res = await http.post<SaveGameResponse>("/game/save", body);
    return res.data;
  },

  // GET /rankings?limit=&page= :contentReference[oaicite:10]{index=10}
  rankings: async (params?: { limit?: number; page?: number }) => {
    const res = await http.get<RankingListResponse>("/rankings", { params });
    return res.data;
  },

  // POST /rankings :contentReference[oaicite:11]{index=11}
  submitRanking: async (body: SubmitRankingRequest) => {
    const res = await http.post<SubmitRankingResponse>("/rankings", body);
    return res.data;
  },
};
