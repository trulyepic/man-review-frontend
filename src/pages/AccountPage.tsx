import { CheckIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  resetMyAvatar,
  selectMyAvatarPreset,
  uploadMyAvatar,
} from "../api/manApi";
import UserAvatar from "../components/UserAvatar";
import { NoIndexSeo } from "../components/Seo";
import { useUser } from "../login/useUser";
import type { AvatarPreset, User } from "../types/types";
import { AVATAR_PRESETS, normalizeAvatarPreset } from "../util/avatar";

type CropDraft = {
  file: File;
  objectUrl: string;
  image: HTMLImageElement;
};

const AVATAR_OUTPUT_SIZE = 512;

function saveUser(nextUser: User, setUser: (user: User) => void) {
  localStorage.setItem("user", JSON.stringify(nextUser));
  setUser(nextUser);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function profileNameClassName(role?: string | null) {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") {
    return "bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent";
  }

  if (normalized === "CONTRIBUTOR") {
    return "bg-gradient-to-r from-blue-300 via-sky-300 to-cyan-200 bg-clip-text text-transparent";
  }

  return "text-slate-950 dark:text-white";
}

async function imageFromFile(file: File): Promise<CropDraft> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return { file, objectUrl, image };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function buildCroppedAvatarFile(
  draft: CropDraft,
  zoom: number,
  offsetX: number,
  offsetY: number
): Promise<File> {
  const { naturalWidth, naturalHeight } = draft.image;
  const cropSize = Math.min(naturalWidth, naturalHeight) / zoom;
  const maxX = Math.max(0, naturalWidth - cropSize);
  const maxY = Math.max(0, naturalHeight - cropSize);
  const cropX = clamp((naturalWidth - cropSize) / 2 + (offsetX / 100) * maxX, 0, maxX);
  const cropY = clamp((naturalHeight - cropSize) / 2 + (offsetY / 100) * maxY, 0, maxY);

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Avatar editor is not available in this browser.");
  }

  context.drawImage(
    draft.image,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) resolve(value);
        else reject(new Error("Could not prepare avatar image."));
      },
      "image/webp",
      0.9
    );
  });

  return new File([blob], "avatar.webp", { type: "image/webp" });
}

export default function AccountPage() {
  const { user, setUser } = useUser();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<CropDraft | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [saving, setSaving] = useState(false);

  const activePreset = normalizeAvatarPreset(user?.avatar_preset);
  const previewStyle = useMemo(() => {
    if (!draft) return undefined;
    return {
      backgroundImage: `url(${draft.objectUrl})`,
      backgroundPosition: `${50 + offsetX / 2}% ${50 + offsetY / 2}%`,
      backgroundSize: `${zoom * 100}%`,
    };
  }, [draft, offsetX, offsetY, zoom]);

  const updateUserAvatar = (patch: {
    avatar_url?: string | null;
    avatar_preset?: AvatarPreset | null;
  }) => {
    if (!user) return;
    saveUser({ ...user, ...patch }, setUser);
  };

  const clearDraft = () => {
    if (draft) URL.revokeObjectURL(draft.objectUrl);
    setDraft(null);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file for your avatar.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar images must be 5 MB or smaller.");
      return;
    }

    try {
      clearDraft();
      setDraft(await imageFromFile(file));
    } catch {
      toast.error("That image could not be loaded.");
    }
  };

  const handleUpload = async () => {
    if (!user || !draft) return;
    setSaving(true);
    try {
      const croppedFile = await buildCroppedAvatarFile(
        draft,
        zoom,
        offsetX,
        offsetY
      );
      const avatar = await uploadMyAvatar(croppedFile);
      updateUserAvatar({
        avatar_url: avatar.avatar_url ?? null,
        avatar_preset: avatar.avatar_preset ?? activePreset,
      });
      clearDraft();
      toast.success("Avatar updated.");
    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast.error("Could not update avatar.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = async (preset: AvatarPreset) => {
    if (!user) return;
    setSaving(true);
    try {
      const avatar = await selectMyAvatarPreset(preset);
      updateUserAvatar({
        avatar_url: avatar.avatar_url ?? null,
        avatar_preset: avatar.avatar_preset ?? preset,
      });
      clearDraft();
      toast.success("Default avatar selected.");
    } catch (error) {
      console.error("Avatar preset update failed:", error);
      toast.error("Could not select that avatar.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const avatar = await resetMyAvatar();
      updateUserAvatar({
        avatar_url: avatar.avatar_url ?? null,
        avatar_preset: avatar.avatar_preset ?? activePreset,
      });
      clearDraft();
      toast.success("Avatar reset.");
    } catch (error) {
      console.error("Avatar reset failed:", error);
      toast.error("Could not reset avatar.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <NoIndexSeo title="Account | Toon Ranks" />
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm dark-theme-card">
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">
            Account
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Log in to update your Toon Ranks avatar and account preferences.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <NoIndexSeo title="Account | Toon Ranks" />

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
          Account
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
          Your profile
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Set the avatar that appears with your Toon Ranks identity. Uploaded
          images are cropped square and stored at a standard size.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark-theme-card">
          <div className="flex flex-col items-center text-center">
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatar_url}
              avatarPreset={user.avatar_preset}
              size="xl"
              className="h-28 w-28 text-4xl"
            />
            <h2
              className={`mt-5 text-2xl font-black ${profileNameClassName(
                user.role
              )}`}
            >
              {user.username}
            </h2>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {user.role || "GENERAL"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            <PhotoIcon className="h-5 w-5" />
            Choose image
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />

          <button
            type="button"
            onClick={handleReset}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#342b24] dark:bg-[#181310] dark:text-slate-200 dark:hover:bg-[#241d19]"
            disabled={saving}
          >
            <TrashIcon className="h-5 w-5" />
            Reset uploaded image
          </button>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark-theme-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                  Crop uploaded image
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Pick the part of the image you want to use, then save it as a
                  square avatar.
                </p>
              </div>
              {draft ? (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-[#342b24] dark:text-slate-300 dark:hover:bg-[#241d19]"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {draft ? (
              <div className="mt-6 grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
                <div className="mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 shadow-inner dark:border-[#342b24]">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={previewStyle}
                    role="img"
                    aria-label="Avatar crop preview"
                  />
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Zoom
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="mt-3 w-full accent-blue-600"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Move left/right
                    </span>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={offsetX}
                      onChange={(event) => setOffsetX(Number(event.target.value))}
                      className="mt-3 w-full accent-blue-600"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Move up/down
                    </span>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={offsetY}
                      onChange={(event) => setOffsetY(Number(event.target.value))}
                      className="mt-3 w-full accent-blue-600"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <CheckIcon className="h-5 w-5" />
                    {saving ? "Saving..." : "Save cropped avatar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500 dark:border-[#342b24] dark:bg-[#181310] dark:text-slate-400">
                Choose an image to open the crop controls.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark-theme-card">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Default avatars
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Prefer not to upload an image? Pick a default avatar color.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {(Object.keys(AVATAR_PRESETS) as AvatarPreset[]).map((preset) => {
                const selected = !user.avatar_url && activePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    disabled={saving}
                    className={[
                      "flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                      selected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/30"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-[#342b24] dark:bg-[#181310] dark:hover:bg-[#241d19]",
                    ].join(" ")}
                  >
                    <UserAvatar
                      username={user.username}
                      avatarPreset={preset}
                      size="lg"
                    />
                    <span>
                      <span className="block text-sm font-black text-slate-900 dark:text-white">
                        {AVATAR_PRESETS[preset].label}
                      </span>
                      {selected ? (
                        <span className="mt-1 block text-xs font-bold text-blue-600 dark:text-blue-300">
                          Selected
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
