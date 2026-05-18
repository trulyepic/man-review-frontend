import type { AvatarPreset } from "../types/types";

export type AvatarPresetConfig = {
  label: string;
  swatchClassName: string;
  fallbackClassName: string;
};

export const DEFAULT_AVATAR_PRESET: AvatarPreset = "blue";

export const AVATAR_PRESETS: Record<AvatarPreset, AvatarPresetConfig> = {
  blue: {
    label: "Blue",
    swatchClassName: "bg-blue-500",
    fallbackClassName:
      "bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.36),transparent_24%),linear-gradient(135deg,#315ff4,#16307e)] text-white ring-blue-300/50",
  },
  emerald: {
    label: "Emerald",
    swatchClassName: "bg-emerald-500",
    fallbackClassName:
      "bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.34),transparent_24%),linear-gradient(135deg,#10b981,#065f46)] text-white ring-emerald-300/50",
  },
  amber: {
    label: "Amber",
    swatchClassName: "bg-amber-400",
    fallbackClassName:
      "bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.38),transparent_24%),linear-gradient(135deg,#f59e0b,#92400e)] text-white ring-amber-300/50",
  },
};

export const normalizeAvatarPreset = (
  preset?: string | null
): AvatarPreset => {
  return preset && preset in AVATAR_PRESETS
    ? (preset as AvatarPreset)
    : DEFAULT_AVATAR_PRESET;
};

export const getAvatarInitials = (username?: string | null): string => {
  const trimmed = username?.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : trimmed.slice(0, 2);

  return initials.toUpperCase();
};
