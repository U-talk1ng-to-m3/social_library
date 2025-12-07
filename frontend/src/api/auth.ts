import api from "./axios";

export const register = async (username: string, email: string, password: string) => {
  const res = await api.post("/auth/register/", { username, email, password });
  return res.data;
};

export const login = async (username: string, password: string) => {
  const res = await api.post("/auth/token/", { username, password });
  return res.data; // { access, refresh }
};

