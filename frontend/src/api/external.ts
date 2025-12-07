// src/api/external.ts
import api from "./axios";

export const searchExternalMovies = async (query: string) => {
  const res = await api.get("/external/movies/search/", {
    params: { q: query },
  });
  return res.data;
};

export const searchExternalBooks = async (query: string) => {
  const res = await api.get("/external/books/search/", {
    params: { q: query },
  });
  return res.data;
};

export const importExternalContent = async (source: string, externalId: string | number) => {
  const res = await api.post("/external/import/", {
    source,
    external_id: externalId,
  });
  return res.data; // ContentSerializer formatında döner
};

