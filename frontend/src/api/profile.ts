// src/api/profile.ts
import api from "./axios";

export const fetchProfileByUsername = async (username: string) => {
  const res = await api.get("/profiles/", {
    params: { username },
  });
  // ViewSet list döndüğü için ilk elemanı alıyoruz
  return res.data[0];
};

export const fetchMyProfile = async () => {
  const res = await api.get("/profiles/me/");
  return res.data;
};

export const updateMyProfile = async (data: { avatar_url?: string; bio?: string }) => {
  const res = await api.put("/profiles/me/", data);
  return res.data;
};

export const fetchUserLibrary = async (userId: number) => {
  const res = await api.get("/library-entries/", {
    params: { user_id: userId },
  });
  return res.data;
};

export const fetchUserActivities = async (userId: number) => {
  const res = await api.get("/activities/", {
    params: { user_id: userId },
  });
  return res.data;
};

