// src/api/library.ts
import api from "./axios";
import type { LibraryEntry, LibraryStatus } from "../types";

export const fetchLibrary = async (): Promise<LibraryEntry[]> => {
  const res = await api.get<LibraryEntry[]>("/library-entries/");
  return res.data;
};

export const addToLibrary = async (
  contentId: number,
  status: LibraryStatus
): Promise<LibraryEntry> => {
  const res = await api.post<LibraryEntry>("/library-entries/", {
    content_id: contentId,
    status,
  });
  return res.data;
};

