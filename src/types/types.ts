// types.ts
export type SeriesDetailData = {
  synopsis: string;
  series_cover_url: string;
  author?: string;
  artist?: string;
  story_total: number;
  story_count: number;
  characters_total: number;
  characters_count: number;
  worldbuilding_total: number;
  worldbuilding_count: number;
  art_total: number;
  art_count: number;
  drama_or_fight_total: number;
  drama_or_fight_count: number;
  voted_categories?: string[];
  vote_scores?: Record<string, number>;
  vote_counts?: Record<string, number>;
};

export interface User {
  username: string;
  role?: string;
}

export interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}
