// src/types/index.ts

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Content {
  id: number;
  type: "movie" | "book";
  source: "tmdb" | "google_books" | "open_library";
  external_id: string;
  title: string;
  original_title?: string;
  year?: number | null;
  poster_url?: string | null;
  description?: string;
  page_count?: number | null;
  runtime_minutes?: number | null;
  average_rating?: number | null;
  rating_count?: number | null;
}


export type ActivityType = "rating" | "review" | "library" | "list_add";

export interface Activity {
  id: number;
  user: User;
  content: Content | null;
  activity_type: ActivityType;
  rating: number | null;
  review: number | null;
  list: number | null;
  created_at: string;
}

export type LibraryStatus = "watched" | "watchlist" | "read" | "to_read";

export interface LibraryEntry {
  id: number;
  status: LibraryStatus;
  created_at: string;
  content: Content;
}

