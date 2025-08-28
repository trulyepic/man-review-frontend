// export type SeriesType = "MANGA" | "MANHWA" | "MANHUA";
// export type SeriesStatus = "ONGOING" | "COMPLETE" | "HIATUS" | "UNKNOWN" | null;

// export interface Series {
//   id: number;
//   title: string;
//   genre: string;
//   type: SeriesType;
//   cover_url: string;
//   vote_count: number;
//   author?: string;
//   artist?: string;
//   status?: SeriesStatus;
// }

// export interface SeriesPayload {
//   title: string;
//   genre: string;
//   type: SeriesType;
//   cover: File;
//   author?: string;
//   artist?: string;
//   status?: Exclude<SeriesStatus, null>;
// }

// export interface SeriesDetailPayload {
//   series_id: number;
//   synopsis: string;
//   series_cover: File;
// }

// export interface RankedSeries {
//   id: number;
//   title: string;
//   genre: string;
//   type: SeriesType;
//   cover_url: string;
//   vote_count: number;
//   final_score: number;
//   rank: number | null;
//   author?: string;
//   artist?: string;
//   status?: SeriesStatus;
// }

// // ---------- Reading List Types ----------
// export interface ReadingListItem {
//   series_id: number;
// }

// export interface ReadingList {
//   id: number;
//   name: string;
//   items: ReadingListItem[];
// }

// // Small helper for auth headers
// // Small helper for auth headers (no union types)
// const authHeaders = (): HeadersInit => {
//   const token = localStorage.getItem("token");
//   const headers: Record<string, string> = {};
//   if (token) headers.Authorization = `Bearer ${token}`;
//   return headers;
// };

// const BASE_URL = "http://localhost:8000";
// // const BASE_URL = import.meta.env.VITE_APP_BASE_URL;

// export const createSeries = async (data: SeriesPayload): Promise<Series> => {
//   const formData = new FormData();
//   formData.append("title", data.title);
//   formData.append("genre", data.genre);
//   formData.append("type", data.type);
//   formData.append("cover", data.cover);
//   formData.append("author", data.author || "");
//   formData.append("artist", data.artist || "");

//   if (data.status) formData.append("status", data.status);

//   const response = await fetch(`${BASE_URL}/series/`, {
//     method: "POST",
//     body: formData,
//   });

//   if (!response.ok) {
//     throw new Error("Failed to create series");
//   }

//   return (await response.json()) as Series;
// };

// export const fetchSeries = async (): Promise<Series[]> => {
//   const response = await fetch(`${BASE_URL}/series/`);
//   if (!response.ok) throw new Error("Failed to fetch series");
//   return (await response.json()) as Series[];
// };

// export const deleteSeries = async (id: number): Promise<void> => {
//   const response = await fetch(`${BASE_URL}/series/${id}`, {
//     method: "DELETE",
//   });

//   if (!response.ok) {
//     throw new Error("Failed to delete series");
//   }
// };

// // ----- Auth API -----

// export const login = async (credentials: {
//   username: string;
//   password: string;
//   captcha_token: string;
// }) => {
//   const response = await fetch(`${BASE_URL}/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(credentials),
//   });

//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(
//       `${response.status}: ${errorData.detail || "Login failed"}`
//     );
//   }

//   const data = await response.json();
//   localStorage.setItem("token", data.access_token);
//   localStorage.setItem("user", JSON.stringify(data.user));
//   return data;
// };

// // export const signup = async (credentials: {
// //   username: string;
// //   password: string;
// // }) => {
// //   const response = await fetch(`${BASE_URL}/auth/signup`, {
// //     method: "POST",
// //     headers: { "Content-Type": "application/json" },
// //     body: JSON.stringify(credentials),
// //   });

// //   if (!response.ok) throw new Error(`${response.status}: Signup failed`);
// // };
// export const signup = async (credentials: {
//   username: string;
//   password: string;
//   email: string;
//   captcha_token: string;
// }): Promise<{ message: string; token: string }> => {
//   const response = await fetch(`${BASE_URL}/auth/signup`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(credentials),
//   });

//   if (!response.ok) throw new Error(`${response.status}: Signup failed`);

//   return await response.json();
// };

// export const addSeriesDetail = async (
//   seriesId: number,
//   payload: { synopsis: string; cover: File }
// ) => {
//   const formData = new FormData();
//   formData.append("series_id", String(seriesId));
//   formData.append("synopsis", payload.synopsis);
//   formData.append("cover", payload.cover);

//   const token = localStorage.getItem("token");

//   const response = await fetch(`${BASE_URL}/series/${seriesId}/details`, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//     body: formData,
//   });

//   if (!response.ok) throw new Error("Failed to add series details");

//   return await response.json();
// };

// export const createSeriesDetail = async (
//   data: SeriesDetailPayload
// ): Promise<void> => {
//   const formData = new FormData();
//   formData.append("series_id", String(data.series_id));
//   formData.append("synopsis", data.synopsis);
//   formData.append("file", data.series_cover);

//   const token = localStorage.getItem("token");

//   const response = await fetch(`${BASE_URL}/series-details/`, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//     body: formData,
//   });

//   if (!response.ok) {
//     throw new Error("Failed to create series details");
//   }
// };

// export const getSeriesDetailById = async (seriesId: number) => {
//   const token = localStorage.getItem("token");
//   const res = await fetch(`${BASE_URL}/series-details/${seriesId}`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   if (!res.ok) throw new Error("Failed to fetch series detail");
//   return res.json();
// };

// export const voteOnSeries = async (
//   seriesId: number,
//   category: string,
//   score: number
// ): Promise<void> => {
//   const token = localStorage.getItem("token");
//   const formData = new FormData();
//   formData.append("category", category);
//   formData.append("score", String(score));

//   const res = await fetch(`${BASE_URL}/series-details/${seriesId}/vote`, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//     body: formData,
//   });

//   if (!res.ok) throw new Error("Voting failed");
// };

// export const fetchRankedSeries = async (): Promise<RankedSeries[]> => {
//   const response = await fetch(`${BASE_URL}/series/rankings`);
//   if (!response.ok) throw new Error("Failed to fetch ranked series");
//   return await response.json();
// };

// export const fetchRankedSeriesPaginated = async (
//   page: number,
//   size: number,
//   type?: string,
//   signal?: AbortSignal // ✅ Optional
// ): Promise<RankedSeries[]> => {
//   const typeQuery = type ? `&type=${type}` : "";
//   const response = await fetch(
//     `${BASE_URL}/series/rankings?page=${page}&page_size=${size}${typeQuery}`,
//     { signal } // ✅ Safe even if signal is undefined
//   );
//   if (!response.ok) throw new Error("Failed to fetch ranked series");
//   return await response.json();
// };

// export const editSeries = async (
//   id: number,
//   data: Partial<{
//     title: string;
//     genre: string;
//     type: SeriesType;
//     author: string;
//     artist: string;
//   }>
// ) => {
//   const response = await fetch(`${BASE_URL}/${id}`, {
//     method: "PUT",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(data),
//   });

//   if (!response.ok) {
//     throw new Error("Failed to update series");
//   }

//   return await response.json();
// };

// export const searchSeries = async (query: string): Promise<RankedSeries[]> => {
//   const response = await fetch(
//     `${BASE_URL}/series/search?query=${encodeURIComponent(query)}`
//   );
//   if (!response.ok) throw new Error("Search failed");
//   return await response.json();
// };

// // Utility for accessing user
// export const getCurrentUser = () => {
//   const user = localStorage.getItem("user");
//   return user ? JSON.parse(user) : null;
// };

// export const logout = () => {
//   localStorage.removeItem("token");
//   localStorage.removeItem("user");
// };

// export const verifyEmail = async (token: string): Promise<string> => {
//   const response = await fetch(`${BASE_URL}/auth/verify-email?token=${token}`);
//   if (!response.ok) {
//     throw new Error(await response.text());
//   }
//   const data = await response.json();
//   return data.message;
// };

// export const googleOAuthLogin = async (token: string) => {
//   const response = await fetch(`${BASE_URL}/auth/google-oauth`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ token }),
//   });

//   if (!response.ok) throw new Error("Google OAuth login failed");

//   return await response.json();
// };

// // ---------- Reading List API ----------

// // GET /reading-lists/me
// export const getMyReadingLists = async (): Promise<ReadingList[]> => {
//   const res = await fetch(`${BASE_URL}/reading-lists/me`, {
//     headers: { ...authHeaders() },
//   });
//   if (!res.ok) throw new Error("Failed to fetch reading lists");
//   return res.json();
// };

// // POST /reading-lists  { name }
// export const createReadingList = async (name: string): Promise<ReadingList> => {
//   const res = await fetch(`${BASE_URL}/reading-lists`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       ...authHeaders(),
//     },
//     body: JSON.stringify({ name }),
//   });

//   // surfaces the “max 2 lists” rule from backend
//   if (!res.ok) {
//     const data = await res.json().catch(() => ({}));
//     throw new Error(data.detail || "Failed to create reading list");
//   }

//   return res.json();
// };

// // POST /reading-lists/:list_id/items  { series_id }
// export const addSeriesToReadingList = async (
//   listId: number,
//   seriesId: number
// ): Promise<ReadingList> => {
//   const res = await fetch(`${BASE_URL}/reading-lists/${listId}/items`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       ...authHeaders(),
//     },
//     body: JSON.stringify({ series_id: seriesId }),
//   });
//   if (!res.ok) {
//     const data = await res.json().catch(() => ({}));
//     throw new Error(data.detail || "Failed to add series to list");
//   }
//   return res.json();
// };

// // DELETE /reading-lists/:list_id/items/:series_id
// export const removeSeriesFromReadingList = async (
//   listId: number,
//   seriesId: number
// ): Promise<ReadingList> => {
//   const res = await fetch(
//     `${BASE_URL}/reading-lists/${listId}/items/${seriesId}`,
//     {
//       method: "DELETE",
//       headers: { ...authHeaders() },
//     }
//   );
//   if (!res.ok) {
//     const data = await res.json().catch(() => ({}));
//     throw new Error(data.detail || "Failed to remove series from list");
//   }
//   return res.json();
// };

// // DELETE /reading-lists/:list_id
// export const deleteReadingList = async (listId: number): Promise<void> => {
//   const res = await fetch(`${BASE_URL}/reading-lists/${listId}`, {
//     method: "DELETE",
//     headers: { ...authHeaders() },
//   });
//   if (!res.ok) {
//     const data = await res.json().catch(() => ({}));
//     throw new Error(data.detail || "Failed to delete reading list");
//   }
// };

// export const getSeriesSummary = async (
//   seriesId: number
// ): Promise<RankedSeries> => {
//   const res = await fetch(`${BASE_URL}/series/summary/${seriesId}`);
//   if (!res.ok) throw new Error("Failed to fetch series summary");
//   return res.json();
// };

// src/api/manApi.ts
import type { SeriesDetailData } from "../types/types";
import { api } from "./client"; // <-- your shared Axios instance
import { isAxiosError } from "axios";

// ---------- Types ----------
export type SeriesType = "MANGA" | "MANHWA" | "MANHUA";
export type SeriesStatus = "ONGOING" | "COMPLETE" | "HIATUS" | "UNKNOWN" | null;
export type IssueType = "BUG" | "FEATURE" | "CONTENT" | "OTHER";
// export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "FIXED" | "WONT_FIX";

type ApiErrorDetail = string | { code?: string; message?: string };
type ApiErrorData =
  | {
      detail?: ApiErrorDetail;
      code?: string;
      message?: string;
    }
  | undefined;

export type ForumSeriesRef = {
  series_id: number;
  title?: string;
  cover_url?: string;
  type?: string;
  status?: string;
};
export type ForumThread = {
  id: number;
  title: string;
  author_username?: string | null;
  created_at: string;
  updated_at: string;
  post_count: number;
  last_post_at: string;
  series_refs: ForumSeriesRef[];
  locked?: boolean;
  latest_first?: boolean;
};
export type ForumPost = {
  id: number;
  author_username?: string | null;
  content_markdown: string;
  created_at: string;
  updated_at: string;
  series_refs: ForumSeriesRef[];
  parent_id?: number | null;
};

export interface Issue {
  id: number;
  type: IssueType;
  title: string;
  description: string;
  page_url?: string | null;
  email?: string | null;
  screenshot_url?: string | null;
  user_id?: number | null;
  user_agent?: string | null;
  status: IssueStatus; // <-- make sure your backend includes this
  created_at: string; // ISO string
}

export interface Series {
  id: number;
  title: string;
  genre: string;
  type: SeriesType;
  cover_url: string;
  vote_count: number;
  author?: string;
  artist?: string;
  status?: SeriesStatus;
}

export interface SeriesPayload {
  title: string;
  genre: string;
  type: SeriesType;
  cover: File;
  author?: string;
  artist?: string;
  status?: Exclude<SeriesStatus, null>;
}

export interface SeriesDetailPayload {
  series_id: number;
  synopsis: string;
  series_cover: File;
}

export interface RankedSeries {
  id: number;
  title: string;
  genre: string;
  type: SeriesType;
  cover_url: string;
  vote_count: number;
  final_score: number;
  rank: number | null;
  author?: string;
  artist?: string;
  status?: SeriesStatus;
}

// ---------- Reading List Types ----------
export interface ReadingListItem {
  series_id: number;
}

export interface ReadingList {
  id: number;
  name: string;
  items: ReadingListItem[];
}

// ---------- Auth Types ----------
export type UserRole = "ADMIN" | "USER" | (string & {});
export interface AuthUser {
  id: number;
  username: string;
  email?: string | null;
  role?: UserRole | null;
}
export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

// ---------- Small helpers ----------
function extractApiDetail(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as unknown;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const detail = obj["detail"];
      if (typeof detail === "string") return detail;
      const message = obj["message"];
      if (typeof message === "string") return message;
    }
    return err.message ?? fallback;
  }
  return fallback;
}

function retryAfterSeconds(err: unknown): number | null {
  if (isAxiosError(err)) {
    const ra = err.response?.headers?.["retry-after"];
    if (!ra) return null;
    const n = Number(ra);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isAuthUser(x: unknown): x is AuthUser {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return typeof obj["id"] === "number" && typeof obj["username"] === "string";
}

// ---------- Series CRUD ----------
export const createSeries = async (data: SeriesPayload): Promise<Series> => {
  const form = new FormData();
  form.append("title", data.title);
  form.append("genre", data.genre);
  form.append("type", data.type);
  form.append("cover", data.cover);
  if (data.author) form.append("author", data.author);
  if (data.artist) form.append("artist", data.artist);
  if (data.status) form.append("status", data.status);

  const res = await api.post<Series>("/series/", form);
  return res.data;
};

export const fetchSeries = async (): Promise<Series[]> => {
  const res = await api.get<Series[]>("/series/");
  return res.data;
};

export const deleteSeries = async (id: number): Promise<void> => {
  await api.delete(`/series/${id}`);
};

export const editSeries = async (
  id: number,
  data: Partial<{
    title: string;
    genre: string;
    type: SeriesType;
    author: string;
    artist: string;
  }>
): Promise<Series> => {
  const res = await api.put<Series>(`/series/${id}`, data);
  return res.data;
};

// ---------- Auth ----------
export const login = async (credentials: {
  username: string;
  password: string;
  captcha_token: string;
}): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/login", credentials);

  // Keep existing behavior: persist token + user here
  localStorage.setItem("token", res.data.access_token);
  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

export const signup = async (credentials: {
  username: string;
  password: string;
  email: string;
  captcha_token: string;
}): Promise<{ message: string; token: string }> => {
  const res = await api.post<{ message: string; token: string }>(
    "/auth/signup",
    credentials
  );
  return res.data;
};

export const googleOAuthLogin = async (
  token: string
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/google-oauth", { token });

  // Keep existing behavior: persist token + user here
  localStorage.setItem("token", res.data.access_token);
  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

export const verifyEmail = async (token: string): Promise<string> => {
  const res = await api.get<{ message: string }>("/auth/verify-email", {
    params: { token },
  });
  return res.data.message;
};

// ---------- Series Details / Voting ----------
export const addSeriesDetail = async (
  seriesId: number,
  payload: { synopsis: string; cover: File }
): Promise<unknown> => {
  const form = new FormData();
  form.append("series_id", String(seriesId));
  form.append("synopsis", payload.synopsis);
  form.append("cover", payload.cover);

  const res = await api.post(`/series/${seriesId}/details`, form);
  return res.data; // unknown until backend shape is finalized
};

export const createSeriesDetail = async (
  data: SeriesDetailPayload
): Promise<void> => {
  const form = new FormData();
  form.append("series_id", String(data.series_id));
  form.append("synopsis", data.synopsis);
  // Backend previously expected "file" here — keep this for compatibility
  form.append("file", data.series_cover);

  await api.post("/series-details/", form);
};

export const getSeriesDetailById = async (
  seriesId: number
): Promise<SeriesDetailData> => {
  const res = await api.get<SeriesDetailData>(`/series-details/${seriesId}`);
  return res.data; // unknown until you define a SeriesDetail shape
};

export const voteOnSeries = async (
  seriesId: number,
  category: string,
  score: number
): Promise<void> => {
  const form = new FormData();
  form.append("category", category);
  form.append("score", String(score));

  await api.post(`/series-details/${seriesId}/vote`, form);
};

// ---------- Rankings / Search ----------
export const fetchRankedSeries = async (): Promise<RankedSeries[]> => {
  const res = await api.get<RankedSeries[]>("/series/rankings");
  return res.data;
};

export const fetchRankedSeriesPaginated = async (
  page: number,
  size: number,
  type?: string,
  signal?: AbortSignal
): Promise<RankedSeries[]> => {
  const res = await api.get<RankedSeries[]>("/series/rankings", {
    params: {
      page,
      page_size: size,
      ...(type ? { type } : {}),
    },
    signal, // Axios v1 supports AbortController signals
  });
  return res.data;
};

export const searchSeries = async (
  query: string,
  signal?: AbortSignal
): Promise<RankedSeries[]> => {
  const res = await api.get<RankedSeries[]>("/series/search", {
    params: { query },
    signal, // <-- now cancellable
  });
  return res.data;
};

export const getSeriesSummary = async (
  seriesId: number
): Promise<RankedSeries> => {
  const res = await api.get<RankedSeries>(`/series/summary/${seriesId}`);
  return res.data;
};

// ---------- Reading Lists ----------
export const getMyReadingLists = async (): Promise<ReadingList[]> => {
  const res = await api.get<ReadingList[]>("/reading-lists/me");
  return res.data;
};

export const createReadingList = async (name: string): Promise<ReadingList> => {
  try {
    const res = await api.post<ReadingList>("/reading-lists", { name });
    return res.data;
  } catch (err: unknown) {
    const detail = extractApiDetail(err, "Failed to create reading list");
    throw new Error(detail);
  }
};

export const addSeriesToReadingList = async (
  listId: number,
  seriesId: number
): Promise<ReadingList> => {
  try {
    const res = await api.post<ReadingList>(`/reading-lists/${listId}/items`, {
      series_id: seriesId,
    });
    return res.data;
  } catch (err: unknown) {
    const detail = extractApiDetail(err, "Failed to add series to list");
    throw new Error(detail);
  }
};

export const removeSeriesFromReadingList = async (
  listId: number,
  seriesId: number
): Promise<ReadingList> => {
  try {
    const res = await api.delete<ReadingList>(
      `/reading-lists/${listId}/items/${seriesId}`
    );
    return res.data;
  } catch (err: unknown) {
    const detail = extractApiDetail(err, "Failed to remove series from list");
    throw new Error(detail);
  }
};

export const deleteReadingList = async (listId: number): Promise<void> => {
  try {
    await api.delete(`/reading-lists/${listId}`);
  } catch (err: unknown) {
    const detail = extractApiDetail(err, "Failed to delete reading list");
    throw new Error(detail);
  }
};

// ---------- Session helpers ----------
export const getCurrentUser = (): AuthUser | null => {
  const user = localStorage.getItem("user");
  if (!user) return null;
  try {
    const parsed: unknown = JSON.parse(user);
    return isAuthUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const reportIssue = async (payload: {
  type: IssueType;
  title: string;
  description: string;
  page_url?: string;
  email?: string;
  screenshot?: File;
}): Promise<unknown> => {
  const form = new FormData();
  form.append("type", payload.type);
  form.append("title", payload.title);
  form.append("description", payload.description);
  if (payload.page_url) form.append("page_url", payload.page_url);
  if (payload.email) form.append("email", payload.email);
  if (payload.screenshot) form.append("screenshot", payload.screenshot);

  const res = await api.post("/issues/report", form);
  return res.data; // backend may return created Issue or a message
};

// List issues (public)
export const listIssues = async (params?: {
  q?: string;
  type?: IssueType;
  status?: IssueStatus;
  page?: number;
  page_size?: number;
}): Promise<Issue[]> => {
  const res = await api.get<Issue[]>("/issues", { params });
  return res.data;
};

// Admin: update status
export const adminUpdateIssueStatus = async (
  id: number,
  status: IssueStatus
): Promise<Issue> => {
  const res = await api.patch<Issue>(`/issues/${id}/status`, { status });
  return res.data;
};

// Admin: delete issue (also deletes screenshot if any server-side)
export const adminDeleteIssue = async (id: number): Promise<void> => {
  await api.delete(`/issues/${id}`);
};

// ---------- Forum ----------
export async function listForumThreads(
  q = "",
  page = 1,
  page_size = 20
): Promise<ForumThread[]> {
  const res = await api.get<ForumThread[]>("/forum/threads", {
    params: { q: q || undefined, page, page_size },
  });
  return res.data;
}

export async function createForumThread(input: {
  title: string;
  first_post_markdown: string;
  series_ids?: number[];
}): Promise<ForumThread> {
  try {
    const res = await api.post<ForumThread>("/forum/threads", input);
    return res.data;
  } catch (err: unknown) {
    const status = isAxiosError(err) ? err.response?.status : undefined;
    const data: ApiErrorData = isAxiosError(err)
      ? (err.response?.data as unknown as ApiErrorData)
      : undefined;

    if (status === 429) {
      const ra = retryAfterSeconds(err);
      throw new Error(
        `You're creating threads too fast${ra ? `; try again in ${ra}s` : ""}.`
      );
    }

    // explicit profanity branch
    const detailObj =
      typeof data?.detail === "object" && data?.detail !== null
        ? data.detail
        : undefined;
    const code = detailObj?.code ?? data?.code ?? null;

    if (status === 400 && code === "PROFANITY") {
      throw new Error("Thread contains inappropriate language.");
    }

    // Fallbacks
    const serverDetail =
      (typeof data?.detail === "string" && data.detail) ||
      detailObj?.message ||
      data?.message;

    throw new Error(
      serverDetail || extractApiDetail(err, "Failed to create thread")
    );
  }
}

export async function getForumThread(
  thread_id: number
): Promise<{ thread: ForumThread; posts: ForumPost[] }> {
  const res = await api.get<{ thread: ForumThread; posts: ForumPost[] }>(
    `/forum/threads/${thread_id}`
  );
  return res.data;
}

export async function createForumPost(
  thread_id: number,
  input: { content_markdown: string; series_ids?: number[]; parent_id?: number }
): Promise<ForumPost> {
  const body = {
    content_markdown: String(input.content_markdown).trim(),
    parent_id:
      typeof input.parent_id === "number" && input.parent_id > 0
        ? input.parent_id
        : null,
  } as {
    content_markdown: string;
    series_ids?: number[];
    parent_id: number | null;
  };

  if (Array.isArray(input.series_ids) && input.series_ids.length > 0) {
    body.series_ids = input.series_ids.map(Number);
  }

  try {
    const res = await api.post<ForumPost>(
      `/forum/threads/${thread_id}/posts`,
      body
    );
    return res.data;
  } catch (err: unknown) {
    const status = isAxiosError(err) ? err.response?.status : undefined;
    const data: ApiErrorData = isAxiosError(err)
      ? (err.response?.data as unknown as ApiErrorData)
      : undefined;

    const detailStr =
      typeof data?.detail === "string"
        ? data.detail
        : (typeof data?.detail === "object" && data.detail?.message) ||
          undefined;

    if (status === 429) {
      const ra = retryAfterSeconds(err);
      throw new Error(
        `You're posting too fast${ra ? `; try again in ${ra}s` : ""}.`
      );
    }

    if (status === 423) {
      throw new Error("This thread is locked by an admin.");
    }

    // Profanity (structured)
    const detailObj =
      typeof data?.detail === "object" && data?.detail !== null
        ? data.detail
        : undefined;
    if (status === 400 && detailObj?.code === "PROFANITY") {
      throw new Error("Reply contains inappropriate language.");
    }

    // Profanity (string detail)
    if (
      status === 400 &&
      detailStr &&
      /inappropriate|profan/i.test(detailStr)
    ) {
      throw new Error("Reply contains inappropriate language.");
    }

    const fallback = extractApiDetail(err, "Failed to post reply");
    throw new Error(detailStr || fallback);
  }
}

export async function forumSeriesSearch(q: string): Promise<ForumSeriesRef[]> {
  const res = await api.get<ForumSeriesRef[]>("/forum/series-search", {
    params: { q },
  });
  return res.data;
}

export async function deleteForumPost(
  thread_id: number,
  post_id: number
): Promise<void> {
  await api.delete(`/forum/threads/${thread_id}/posts/${post_id}`);
}

export async function deleteForumThread(thread_id: number): Promise<void> {
  await api.delete(`/forum/threads/${thread_id}`);
}
// Owner-only delete (server checks the author)
export async function deleteMyForumPost(
  thread_id: number,
  post_id: number
): Promise<void> {
  await api.delete(`/forum/threads/${thread_id}/posts/${post_id}/mine`);
}

export async function lockForumThread(
  thread_id: number,
  locked: boolean
): Promise<{ id: number; locked: boolean }> {
  const res = await api.patch<{ id: number; locked: boolean }>(
    `/forum/threads/${thread_id}/lock`,
    { locked }
  );
  return res.data;
}

export async function updateForumThreadSettings(
  thread_id: number,
  input: { latest_first?: boolean }
): Promise<{ id: number; latest_first: boolean }> {
  const res = await api.patch<{ id: number; latest_first: boolean }>(
    `/forum/threads/${thread_id}/settings`,
    input
  );
  return res.data;
}

// ---------- End Forum ----------
