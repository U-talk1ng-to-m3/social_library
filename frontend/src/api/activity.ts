// src/api/activity.ts
import api from "./axios";
import type { Activity } from "../types";

export const fetchActivities = async (): Promise<Activity[]> => {
  const res = await api.get<Activity[]>("/activities/");
  return res.data;
};

