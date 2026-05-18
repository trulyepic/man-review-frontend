import type { AvatarPreset } from "../types/types";
import {
  AVATAR_PRESETS,
  getAvatarInitials,
  normalizeAvatarPreset,
} from "../util/avatar";

type UserAvatarSize = "sm" | "md" | "lg" | "xl";

type UserAvatarProps = {
  username?: string | null;
  avatarUrl?: string | null;
  avatarPreset?: AvatarPreset | string | null;
  size?: UserAvatarSize;
  className?: string;
};

const sizeClassNames: Record<UserAvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const baseClassName =
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset";

export default function UserAvatar({
  username,
  avatarUrl,
  avatarPreset,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const preset = normalizeAvatarPreset(avatarPreset);
  const classes = [
    baseClassName,
    sizeClassNames[size],
    avatarUrl ? "bg-slate-900 ring-slate-200/60" : AVATAR_PRESETS[preset].fallbackClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ? `${username}'s avatar` : "User avatar"}
        className={classes}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span aria-label={username ? `${username}'s avatar` : "Default avatar"} className={classes}>
      <span className="font-black tracking-wide">{getAvatarInitials(username)}</span>
    </span>
  );
}
