// src/api/content.ts
import api from "./axios";
import type { Content } from "../types";

export const searchContents = async (
  query: string,
  type: "all" | "movie" | "book"
): Promise<Content[]> => {
  const params: any = {};
  if (query) params.q = query;
  if (type === "movie" || type === "book") params.type = type;

  const res = await api.get<Content[]>("/contents/", { params });
  return res.data;
};

export const getContentById = async (id: string | number): Promise<Content> => {
  const res = await api.get<Content>(`/contents/${id}/`);
  return res.data;
};

