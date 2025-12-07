import api from "./axios";

export const rateContent = async (contentId: number, score: number) => {
  const res = await api.post("/ratings/", {
    content_id: contentId,
    score,
  });
  return res.data;
};

