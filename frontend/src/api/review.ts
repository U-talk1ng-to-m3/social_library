// src/api/review.ts
import api from "./axios";

export interface Review {
  id: number;
  content: number;
  user: number;
  username: string;
  text: string;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
}

export const fetchReviews = async (contentId: number) => {
  const res = await api.get<Review[]>("/reviews/", {
    params: { content: contentId },
  });
  return res.data;
};

export const createReview = async (contentId: number, text: string) => {
  const res = await api.post<Review>("/reviews/", {
    content: contentId,
    text,
  });
  return res.data;
};

export const updateReview = async (reviewId: number, text: string) => {
  const res = await api.put<Review>(`/reviews/${reviewId}/`, { text });
  return res.data;
};

export const deleteReview = async (reviewId: number) => {
  await api.delete(`/reviews/${reviewId}/`);
};

