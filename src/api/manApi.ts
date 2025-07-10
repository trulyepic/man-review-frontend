export type SeriesType = "MANGA" | "MANHWA" | "MANHUA";

export interface Series {
  id: number;
  title: string;
  genre: string;
  type: SeriesType;
  cover_url: string;
  vote_count: number;
  author?: string;
  artist?: string;
}

export interface SeriesPayload {
  title: string;
  genre: string;
  type: SeriesType;
  cover: File;
  author?: string;
  artist?: string;
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
}

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
}) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) throw new Error("Login failed");

  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

export const signup = async (credentials: {
  username: string;
  password: string;
}) => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) throw new Error(`${response.status}: Signup failed`);
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
