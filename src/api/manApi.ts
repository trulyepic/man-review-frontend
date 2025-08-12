export type SeriesType = "MANGA" | "MANHWA" | "MANHUA";
export type SeriesStatus = "ONGOING" | "COMPLETE" | "HIATUS" | "UNKNOWN" | null;

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

// Small helper for auth headers
// Small helper for auth headers (no union types)
const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// const BASE_URL = "http://localhost:8000";
const BASE_URL = import.meta.env.VITE_APP_BASE_URL;

export const createSeries = async (data: SeriesPayload): Promise<Series> => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("genre", data.genre);
  formData.append("type", data.type);
  formData.append("cover", data.cover);
  formData.append("author", data.author || "");
  formData.append("artist", data.artist || "");

  if (data.status) formData.append("status", data.status);

  const response = await fetch(`${BASE_URL}/series/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to create series");
  }

  return (await response.json()) as Series;
};

export const fetchSeries = async (): Promise<Series[]> => {
  const response = await fetch(`${BASE_URL}/series/`);
  if (!response.ok) throw new Error("Failed to fetch series");
  return (await response.json()) as Series[];
};

export const deleteSeries = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/series/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete series");
  }
};

// ----- Auth API -----

export const login = async (credentials: {
  username: string;
  password: string;
  captcha_token: string;
}) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `${response.status}: ${errorData.detail || "Login failed"}`
    );
  }

  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

// export const signup = async (credentials: {
//   username: string;
//   password: string;
// }) => {
//   const response = await fetch(`${BASE_URL}/auth/signup`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(credentials),
//   });

//   if (!response.ok) throw new Error(`${response.status}: Signup failed`);
// };
export const signup = async (credentials: {
  username: string;
  password: string;
  email: string;
  captcha_token: string;
}): Promise<{ message: string; token: string }> => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) throw new Error(`${response.status}: Signup failed`);

  return await response.json();
};

export const addSeriesDetail = async (
  seriesId: number,
  payload: { synopsis: string; cover: File }
) => {
  const formData = new FormData();
  formData.append("series_id", String(seriesId));
  formData.append("synopsis", payload.synopsis);
  formData.append("cover", payload.cover);

  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/series/${seriesId}/details`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to add series details");

  return await response.json();
};

export const createSeriesDetail = async (
  data: SeriesDetailPayload
): Promise<void> => {
  const formData = new FormData();
  formData.append("series_id", String(data.series_id));
  formData.append("synopsis", data.synopsis);
  formData.append("file", data.series_cover);

  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/series-details/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to create series details");
  }
};

export const getSeriesDetailById = async (seriesId: number) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/series-details/${seriesId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch series detail");
  return res.json();
};

export const voteOnSeries = async (
  seriesId: number,
  category: string,
  score: number
): Promise<void> => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("category", category);
  formData.append("score", String(score));

  const res = await fetch(`${BASE_URL}/series-details/${seriesId}/vote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Voting failed");
};

export const fetchRankedSeries = async (): Promise<RankedSeries[]> => {
  const response = await fetch(`${BASE_URL}/series/rankings`);
  if (!response.ok) throw new Error("Failed to fetch ranked series");
  return await response.json();
};

export const fetchRankedSeriesPaginated = async (
  page: number,
  size: number,
  type?: string,
  signal?: AbortSignal // ✅ Optional
): Promise<RankedSeries[]> => {
  const typeQuery = type ? `&type=${type}` : "";
  const response = await fetch(
    `${BASE_URL}/series/rankings?page=${page}&page_size=${size}${typeQuery}`,
    { signal } // ✅ Safe even if signal is undefined
  );
  if (!response.ok) throw new Error("Failed to fetch ranked series");
  return await response.json();
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
) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update series");
  }

  return await response.json();
};

export const searchSeries = async (query: string): Promise<RankedSeries[]> => {
  const response = await fetch(
    `${BASE_URL}/series/search?query=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error("Search failed");
  return await response.json();
};

// Utility for accessing user
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const verifyEmail = async (token: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/auth/verify-email?token=${token}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  return data.message;
};

export const googleOAuthLogin = async (token: string) => {
  const response = await fetch(`${BASE_URL}/auth/google-oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) throw new Error("Google OAuth login failed");

  return await response.json();
};

// ---------- Reading List API ----------

// GET /reading-lists/me
export const getMyReadingLists = async (): Promise<ReadingList[]> => {
  const res = await fetch(`${BASE_URL}/reading-lists/me`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch reading lists");
  return res.json();
};

// POST /reading-lists  { name }
export const createReadingList = async (name: string): Promise<ReadingList> => {
  const res = await fetch(`${BASE_URL}/reading-lists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ name }),
  });

  // surfaces the “max 2 lists” rule from backend
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to create reading list");
  }

  return res.json();
};

// POST /reading-lists/:list_id/items  { series_id }
export const addSeriesToReadingList = async (
  listId: number,
  seriesId: number
): Promise<ReadingList> => {
  const res = await fetch(`${BASE_URL}/reading-lists/${listId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ series_id: seriesId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to add series to list");
  }
  return res.json();
};

// DELETE /reading-lists/:list_id/items/:series_id
export const removeSeriesFromReadingList = async (
  listId: number,
  seriesId: number
): Promise<ReadingList> => {
  const res = await fetch(
    `${BASE_URL}/reading-lists/${listId}/items/${seriesId}`,
    {
      method: "DELETE",
      headers: { ...authHeaders() },
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to remove series from list");
  }
  return res.json();
};

// DELETE /reading-lists/:list_id
export const deleteReadingList = async (listId: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/reading-lists/${listId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to delete reading list");
  }
};

export const getSeriesSummary = async (
  seriesId: number
): Promise<RankedSeries> => {
  const res = await fetch(`${BASE_URL}/series/summary/${seriesId}`);
  if (!res.ok) throw new Error("Failed to fetch series summary");
  return res.json();
};
