// Anime types based on AniList + Jikan merged data model

export type AnimeStatus = "RELEASING" | "FINISHED" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
export type AnimeFormat = "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC";
export type AnimeSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";
export type AnimeSource =
  | "MANGA"
  | "LIGHT_NOVEL"
  | "VISUAL_NOVEL"
  | "VIDEO_GAME"
  | "ORIGINAL"
  | "OTHER"
  | "NOVEL"
  | "DOUJINSHI"
  | "ANIME";

export type AnimeRating = "G" | "PG" | "PG_13" | "R" | "R+" | "RX";

export interface AnimeTitle {
  romaji: string;
  english?: string | null;
  native?: string | null;
}

export interface AnimeCoverImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
  color?: string | null;
}

export interface AnimeCharacter {
  id: number;
  name: { full: string; native?: string };
  image?: { medium?: string };
  gender?: string;
  role: "MAIN" | "SUPPORTING" | "BACKGROUND";
  voiceActor?: {
    name: { full: string; native?: string };
    image?: { medium?: string };
  };
}

export interface AnimeRelation {
  id: number;
  relationType?: string;
  title: { romaji: string; english?: string | null };
  coverImage?: { medium?: string };
  type?: string;
  format?: string;
  status?: AnimeStatus;
}

export interface AnimeStudio {
  id?: number;
  name: string;
  siteUrl?: string;
  isMain?: boolean;
}

export interface AnimeTag {
  name: string;
  rank?: number;
  isMediaSpoiler?: boolean;
}

export interface AnimeExternalLink {
  url: string;
  site: string;
  type?: string;
}

export interface StreamingEpisode {
  title?: string;
  thumbnail?: string;
  url?: string;
  site?: string;
}

export interface NextAiringEpisode {
  airingAt: number;
  episode: number;
  timeUntilAiring: number;
}

export interface ScoreDistribution {
  score: number;
  amount: number;
}

export interface AnimeRanking {
  rank: number;
  type: string;
  context: string;
  allTime?: boolean;
}

export interface AnimeReview {
  id: number;
  score?: number;
  rating?: number;
  ratingAmount?: number;
  summary?: string;
  body?: string;
  createdAt?: number;
  user?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

// Main anime detail type (merged from AniList + Jikan)
export interface AnimeDetail {
  id: number;
  malId?: number;
  source: "anilist" | "jikan";
  title: AnimeTitle;
  synonyms?: string[];
  synopsis?: string;
  synopsisShort?: string;
  coverImage: AnimeCoverImage;
  bannerImage?: string | null;
  dominantColor?: string | null;
  format?: AnimeFormat;
  status: AnimeStatus;
  episodes?: number;
  duration?: number;
  rating?: AnimeRating;
  averageScore?: number;
  meanScore?: number;
  rankScore?: number;
  popularity?: number;
  trending?: number;
  favourites?: number;
  year?: number;
  season?: AnimeSeason;
  genres: string[];
  tags?: AnimeTag[];
  studios?: AnimeStudio[];
  sourceMaterial?: AnimeSource;
  trailerUrl?: string;
  externalLinks?: AnimeExternalLink[];
  streamingEpisodes?: StreamingEpisode[];
  isAdult: boolean;
  isAiring?: boolean;
  nextAiringEpisode?: NextAiringEpisode;
  airedFrom?: string;
  airedTo?: string;
  scoreDistribution?: ScoreDistribution[];
  characters?: AnimeCharacter[];
  relations?: AnimeRelation[];
  recommendations?: AnimeRelation[];
  reviews?: AnimeReview[];
  rankings?: AnimeRanking[];
  cachedAt?: string;
  expiresAt?: string;
}

// Lighter card type for lists/grids
export interface AnimeCard {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  averageScore?: number;
  popularity?: number;
  genres: string[];
  status: AnimeStatus;
  format?: AnimeFormat;
  episodes?: number;
  season?: AnimeSeason;
  year?: number;
  nextAiringEpisode?: NextAiringEpisode;
  isAiring?: boolean;
  trending?: number;
  description?: string;
}

// Search params
export interface AnimeSearchParams {
  search?: string;
  genre?: string;
  year?: number;
  season?: AnimeSeason;
  status?: AnimeStatus;
  format?: AnimeFormat;
  sort?: AnimeSort;
  page?: number;
  perPage?: number;
}

export type AnimeSort =
  | "POPULARITY_DESC"
  | "SCORE_DESC"
  | "TRENDING_DESC"
  | "START_DATE_DESC"
  | "SEARCH_MATCH"
  | "TITLE_ROMAJI";

// User anime list
export type WatchStatus = "WATCHING" | "COMPLETED" | "ON_HOLD" | "DROPPED" | "PLAN_TO_WATCH";

export interface UserAnimeListEntry {
  id: string;
  animeId: number;
  anime?: AnimeCard;
  status: WatchStatus;
  progress: number;
  score?: number;
  notes?: string;
  isFavourite: boolean;
  rewatching: boolean;
  rewatchCount: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  createdAt: string;
}

// User type
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  websiteUrl?: string;
  timezone: string;
  socialLinks?: Record<string, string>;
  isPublic: boolean;
  totalAnime: number;
  totalEpisodes: number;
  totalMinutes: number;
  lastActiveAt?: string;
  createdAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  hasNextPage: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
