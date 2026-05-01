"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, Pencil, Save, Trash2, Upload, Video, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { sortAdminItems } from "@/lib/admin-content";
import { cn, createId, normalizeHashtag } from "@/lib/utils";
import {
  deleteAdminItem,
  listAdminItems,
  saveAdminItem
} from "@/services/admin-content-service";
import {
  uploadShortThumbnail,
  uploadShortVideo
} from "@/services/storage-service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { CuratedShortItem, FootballTeam } from "@/types";

const teamOptions = [
  { label: "No team tag", value: "" },
  { label: "Manchester United", value: "Manchester United" },
  { label: "Arsenal", value: "Arsenal" },
  { label: "Chelsea", value: "Chelsea" },
  { label: "Manchester City", value: "Manchester City" }
] as const;

const categoryOptions = [
  { label: "Matchday Clip", value: "Matchday Clip" },
  { label: "Fan Cam", value: "Fan Cam" },
  { label: "Quick Take", value: "Quick Take" },
  { label: "Culture Burst", value: "Culture Burst" }
] as const;

const ALLOWED_SHORT_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v"
]);

const SHORT_MAX_DURATION_SECONDS = 60;
const SHORT_WARNING_DURATION_SECONDS = 45;
const SHORT_MAX_HASHTAGS = 8;
const SOURCE_PROMPT_MESSAGE =
  "Upload a short to get started, or use the advanced external source option if needed.";

type ShortsFormState = {
  id: string;
  title: string;
  summary: string;
  category: CuratedShortItem["category"];
  source: string;
  videoUrl: string;
  embedUrl: string;
  thumbnailURL: string;
  duration: string;
  teamTag: string;
  publishLabel: string;
  featured: boolean;
  vertical: boolean;
  playbackMode: CuratedShortItem["playbackMode"];
  storagePath: string;
  thumbnailStoragePath: string;
};

type ShortMediaMetadata = {
  durationSeconds: number;
  width: number;
  height: number;
};

function createInitialFormState(): ShortsFormState {
  return {
    id: createId("short"),
    title: "",
    summary: "",
    category: "Matchday Clip",
    source: "Admin upload",
    videoUrl: "",
    embedUrl: "",
    thumbnailURL: "",
    duration: "",
    teamTag: "",
    publishLabel: "",
    featured: false,
    vertical: true,
    playbackMode: "file",
    storagePath: "",
    thumbnailStoragePath: ""
  };
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function parseDurationToSeconds(value: string) {
  const cleaned = value.trim();
  if (!cleaned) {
    return Number.NaN;
  }

  const parts = cleaned.split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) {
    return Number.NaN;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => normalizeHashtag(tag)).filter(Boolean))
  ).slice(0, SHORT_MAX_HASHTAGS);
}

function getManualDurationWarning(duration: string) {
  const seconds = parseDurationToSeconds(duration);
  if (!Number.isFinite(seconds)) {
    return null;
  }

  if (seconds > SHORT_MAX_DURATION_SECONDS) {
    return "Shorts must be 60 seconds or less.";
  }

  if (seconds > SHORT_WARNING_DURATION_SECONDS) {
    return "This short is over 45 seconds. It can still be saved, but shorter clips usually feel better in the feed.";
  }

  return null;
}

async function extractVideoMetadata(file: File): Promise<ShortMediaMetadata> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const metadata = await new Promise<ShortMediaMetadata>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.playsInline = true;
      video.muted = true;

      video.onloadedmetadata = () => {
        resolve({
          durationSeconds: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
      };

      video.onerror = () => reject(new Error("Could not read the selected video file."));
      video.src = objectUrl;
    });

    return metadata;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function generateShortThumbnail(file: File): Promise<Blob | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<Blob | null>((resolve) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");

        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82);
      };

      video.onerror = () => resolve(null);
      video.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AdminShortsManager() {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<CuratedShortItem[]>([]);
  const [formState, setFormState] = useState<ShortsFormState>(createInitialFormState);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [detectedVideoMeta, setDetectedVideoMeta] = useState<ShortMediaMetadata | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [showAdvancedSource, setShowAdvancedSource] = useState(false);

  const submitLabel = useMemo(
    () => (editingId ? "Save short" : "Publish short"),
    [editingId]
  );

  const durationWarning = useMemo(
    () => getManualDurationWarning(formState.duration),
    [formState.duration]
  );

  const isSourcePromptMessage = error === SOURCE_PROMPT_MESSAGE;

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const response = await listAdminItems("shorts");
        if (!isMounted) {
          return;
        }

        setItems(response.items);
        setMessage(response.message ?? null);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Could not load curated shorts.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  function resetUiState() {
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setFormState(createInitialFormState());
    setHashtags([]);
    setTagDraft("");
    setUploadWarning(null);
    setDetectedVideoMeta(null);
    setShowAdvancedSource(false);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateField<K extends keyof ShortsFormState>(name: K, value: ShortsFormState[K]) {
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  function addTagsFromDraft(rawValue: string) {
    const pieces = rawValue
      .split(",")
      .map((part) => normalizeHashtag(part))
      .filter(Boolean);

    if (!pieces.length) {
      return;
    }

    setHashtags((current) => normalizeTags([...current, ...pieces]));
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setHashtags((current) => current.filter((item) => item !== tag));
  }

  async function handleVideoFileChange(file: File | null) {
    if (!file) {
      return;
    }

    resetUiState();
    setUploadWarning(null);

    if (!currentUser) {
      setError("You need an active admin session before uploading shorts.");
      return;
    }

    if (!ALLOWED_SHORT_VIDEO_TYPES.has(file.type)) {
      setError("Please upload an MP4, WebM, MOV, or M4V short video.");
      return;
    }

    setIsUploading(true);

    try {
      const metadata = await extractVideoMetadata(file);
      setDetectedVideoMeta(metadata);

      if (!Number.isFinite(metadata.durationSeconds)) {
        throw new Error("The selected video is missing a readable duration.");
      }

      if (metadata.durationSeconds > SHORT_MAX_DURATION_SECONDS) {
        throw new Error("Shorts must be 60 seconds or less. Please choose a shorter clip.");
      }

      if (metadata.height < metadata.width) {
        throw new Error("This clip looks landscape. Please upload a vertical-friendly short.");
      }

      if (metadata.durationSeconds > SHORT_WARNING_DURATION_SECONDS) {
        setUploadWarning("This short is over 45 seconds. It will still work, but shorter clips usually feel better in the feed.");
      }

      const previewUrl = URL.createObjectURL(file);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(previewUrl);

      const currentId = editingId ?? formState.id ?? createId("short");
      const [videoUpload, thumbnailBlob] = await Promise.all([
        uploadShortVideo({
          file,
          userId: currentUser.id,
          shortId: currentId
        }),
        generateShortThumbnail(file)
      ]);

      let thumbnailURL = formState.thumbnailURL;
      let thumbnailStoragePath = formState.thumbnailStoragePath;

      if (thumbnailBlob) {
        const thumbnailUpload = await uploadShortThumbnail({
          blob: thumbnailBlob,
          userId: currentUser.id,
          shortId: currentId
        });
        thumbnailURL = thumbnailUpload.url;
        thumbnailStoragePath = thumbnailUpload.storagePath;
      }

      setFormState((current) => ({
        ...current,
        id: currentId,
        source: current.source.trim() || "Admin upload",
        videoUrl: videoUpload.url,
        embedUrl: "",
        playbackMode: "file",
        storagePath: videoUpload.storagePath,
        thumbnailURL,
        thumbnailStoragePath,
        duration: formatDuration(metadata.durationSeconds),
        vertical: true
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not process this short video.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function validateForm() {
    if (!formState.title.trim()) {
      return "Please add a title.";
    }

    if (!formState.summary.trim()) {
      return "Please add a short caption or summary.";
    }

    if (!formState.videoUrl.trim() && !formState.embedUrl.trim()) {
      return SOURCE_PROMPT_MESSAGE;
    }

    if (!formState.duration.trim()) {
      return "Duration is required.";
    }

    const durationSeconds = parseDurationToSeconds(formState.duration);
    if (!Number.isFinite(durationSeconds)) {
      return "Duration must be a valid mm:ss style value.";
    }

    if (durationSeconds > SHORT_MAX_DURATION_SECONDS) {
      return "Shorts must be 60 seconds or less.";
    }

    if (!formState.vertical) {
      return "Please confirm the short is vertical-friendly before publishing.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetUiState();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        id: formState.id,
        title: formState.title.trim(),
        category: formState.category,
        source: formState.source.trim() || "Admin upload",
        summary: formState.summary.trim(),
        thumbnailURL: formState.thumbnailURL.trim(),
        videoUrl: formState.videoUrl.trim(),
        embedUrl: formState.embedUrl.trim(),
        duration: formState.duration.trim(),
        playbackMode: formState.embedUrl.trim() ? "embed" : formState.playbackMode,
        teamTag: (formState.teamTag || undefined) as FootballTeam | undefined,
        hashtags,
        publishLabel: formState.publishLabel.trim() || undefined,
        vertical: formState.vertical,
        featured: formState.featured,
        storagePath: formState.storagePath || undefined,
        thumbnailStoragePath: formState.thumbnailStoragePath || undefined
      } satisfies Partial<CuratedShortItem>;

      const response = await saveAdminItem("shorts", payload);
      const nextItems = sortAdminItems([
        ...items.filter((item) => item.id !== response.item.id),
        response.item
      ]);

      setItems(nextItems);
      setMessage(
        response.message ??
          (editingId
            ? "Short updated successfully."
            : "Short published successfully.")
      );
      resetForm();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save this short.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    resetUiState();

    if (!window.confirm("Delete this short from the live curated shorts collection?")) {
      return;
    }

    setPendingDeleteId(id);

    try {
      const response = await deleteAdminItem("shorts", id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setMessage(response.message);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not delete this short.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  function handleEdit(item: CuratedShortItem) {
    resetUiState();
    setEditingId(item.id);
    setFormState({
      id: item.id,
      title: item.title,
      summary: item.summary,
      category: item.category,
      source: item.source,
      videoUrl: item.videoUrl,
      embedUrl: item.embedUrl,
      thumbnailURL: item.thumbnailURL,
      duration: item.duration,
      teamTag: item.teamTag ?? "",
      publishLabel: item.publishLabel ?? "",
      featured: Boolean(item.featured),
      vertical: item.vertical,
      playbackMode: item.playbackMode ?? (item.embedUrl ? "embed" : "file"),
      storagePath: item.storagePath ?? "",
      thumbnailStoragePath: item.thumbnailStoragePath ?? ""
    });
    setHashtags(normalizeTags(item.hashtags ?? []));
    setTagDraft("");
    setDetectedVideoMeta(null);
    setUploadWarning(null);
    setShowAdvancedSource(Boolean(item.embedUrl));
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
  }

  const previewSrc = localPreviewUrl || formState.videoUrl || formState.embedUrl;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_25rem]">
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Manage"
          title="Curated shorts"
          description="Publish swipeable short-form clips without mixing them into the long-form Videos workflow."
        />

        {error ? (
          <div
            className={cn(
              "rounded-[24px] px-4 py-3 text-sm",
              isSourcePromptMessage
                ? "border border-brand-100 bg-brand-50/70 text-stone-700"
                : "border border-red-200 bg-red-50 text-red-700"
            )}
          >
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-[24px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[28px] border border-brand-100 bg-white/96 p-6 text-sm text-stone-500 shadow-soft">
            Loading existing shorts...
          </div>
        ) : !items.length ? (
          <EmptyState
            title="No curated shorts yet"
            description="Once you upload a short here, it will flow straight into /shorts without affecting the normal Videos area."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[28px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                      {item.id}
                    </p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                        {item.duration}
                      </span>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                        {item.playbackMode === "file" ? "Uploaded file" : "External source"}
                      </span>
                      {item.teamTag ? (
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                          {item.teamTag}
                        </span>
                      ) : null}
                      {item.featured ? (
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                          Featured
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving || pendingDeleteId === item.id || isUploading}
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSaving || pendingDeleteId === item.id || isUploading}
                      onClick={() => void handleDelete(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {pendingDeleteId === item.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <SectionHeader
            eyebrow="Editor"
            title={editingId ? "Update short" : "Add new short"}
            description="Direct upload is the primary path. External sources stay available only as a lightweight fallback."
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetUiState();
              resetForm();
            }}
            disabled={isSaving || isUploading}
          >
            <Clapperboard className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>

        {editingId ? (
          <div className="mt-4 rounded-[22px] bg-brand-50 px-4 py-3 text-sm text-brand-800">
            Editing <span className="font-semibold">{editingId}</span>. Reset to start a fresh short.
          </div>
        ) : null}

        <form className="mt-4 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="rounded-[26px] border border-brand-100 bg-gradient-to-br from-brand-50/55 via-white to-orange-50/45 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Upload your short video</p>
                <p className="mt-1 text-sm text-stone-600">
                  Shorts should be vertical and under 60 seconds.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSaving}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Choose file"}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleVideoFileChange(file);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSaving}
              className="mt-4 block w-full rounded-[24px] border border-dashed border-brand-200 bg-white/85 px-4 py-8 text-left transition hover:border-brand-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700 shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-semibold text-ink">
                  {isUploading ? "Uploading your short..." : "Drag and drop or click to upload"}
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
                  Upload-first is the default here. HabeshaGram will host the short, detect duration, and fill the playback details for you.
                </p>
              </div>
            </button>

            <div className="mt-4 space-y-2 text-sm text-stone-600">
              <p>Supported formats: MP4, WebM, MOV, and M4V.</p>
              {detectedVideoMeta ? (
                <p className="rounded-[18px] bg-white px-3 py-2 text-xs font-medium text-stone-700">
                  Detected {detectedVideoMeta.width}x{detectedVideoMeta.height} · {formatDuration(detectedVideoMeta.durationSeconds)}
                </p>
              ) : null}
              {uploadWarning ? (
                <p className="rounded-[18px] bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                  {uploadWarning}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Title *</span>
              <input
                type="text"
                value={formState.title}
                placeholder="Crowd erupts after late Arsenal winner"
                className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Summary / caption *</span>
              <textarea
                value={formState.summary}
                rows={4}
                placeholder="Keep it punchy. This should read like a true short-form caption."
                className="min-h-[6.5rem] w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                onChange={(event) => updateField("summary", event.target.value)}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Category *</span>
                <select
                  value={formState.category}
                  className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  onChange={(event) => updateField("category", event.target.value as CuratedShortItem["category"])}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Duration *</span>
                <input
                  type="text"
                  value={formState.duration}
                  placeholder="0:29"
                  className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  onChange={(event) => updateField("duration", event.target.value)}
                />
                {durationWarning ? (
                  <p
                    className={cn(
                      "text-xs",
                      durationWarning.includes("60 seconds") ? "text-red-600" : "text-orange-600"
                    )}
                  >
                    {durationWarning}
                  </p>
                ) : (
                  <p className="text-xs text-stone-500">
                    Shorts over 60 seconds are blocked. Over 45 seconds will trigger a warning.
                  </p>
                )}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Team tag</span>
                <select
                  value={formState.teamTag}
                  className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  onChange={(event) => updateField("teamTag", event.target.value)}
                >
                  {teamOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Publish label</span>
                <input
                  type="text"
                  value={formState.publishLabel}
                  placeholder="Now / Tonight / 45m ago"
                  className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  onChange={(event) => updateField("publishLabel", event.target.value)}
                />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-ink">Hashtags</p>
                <p className="mt-1 text-xs text-stone-500">
                  Add up to {SHORT_MAX_HASHTAGS}. We trim duplicates, normalize spacing/casing, and ignore empty values.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 rounded-[22px] border border-brand-100 bg-surface px-3 py-3">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-brand-700 transition hover:text-brand-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagDraft}
                  placeholder={hashtags.length >= SHORT_MAX_HASHTAGS ? "Hashtag limit reached" : "Type a hashtag and press Enter"}
                  disabled={hashtags.length >= SHORT_MAX_HASHTAGS}
                  className="min-h-9 min-w-[10rem] flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-stone-400"
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addTagsFromDraft(tagDraft);
                    }
                    if (event.key === "Backspace" && !tagDraft && hashtags.length) {
                      removeTag(hashtags[hashtags.length - 1]);
                    }
                  }}
                  onBlur={() => addTagsFromDraft(tagDraft)}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-[22px] border border-brand-100 bg-surface px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Advanced source fallback</p>
                  <p className="text-xs text-stone-500">
                    Keep this secondary. Use it only when direct upload is not the right path.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => setShowAdvancedSource((current) => !current)}
                >
                  {showAdvancedSource ? "Hide" : "Use external URL"}
                </Button>
              </div>

              {showAdvancedSource ? (
                <div className="space-y-3">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-ink">External video URL</span>
                    <input
                      type="text"
                      value={formState.videoUrl}
                      placeholder="https://..."
                      className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                      onChange={(event) => {
                        updateField("videoUrl", event.target.value);
                        if (event.target.value.trim()) {
                          updateField("playbackMode", "file");
                        }
                      }}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-ink">External embed URL</span>
                    <input
                      type="text"
                      value={formState.embedUrl}
                      placeholder="https://www.youtube.com/embed/..."
                      className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                      onChange={(event) => {
                        updateField("embedUrl", event.target.value);
                        if (event.target.value.trim()) {
                          updateField("playbackMode", "embed");
                        }
                      }}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-ink">Source label</span>
                    <input
                      type="text"
                      value={formState.source}
                      placeholder="Admin upload / creator / newsroom"
                      className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                      onChange={(event) => updateField("source", event.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <div className="rounded-[18px] bg-white px-3 py-3 text-xs leading-5 text-stone-600">
                  External URLs are still supported, but they stay tucked away so upload remains the obvious primary action.
                </div>
              )}
            </div>

            <label className="flex items-center justify-between gap-4 rounded-[22px] border border-brand-100 bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Vertical-friendly confirmed</p>
                <p className="text-xs text-stone-500">
                  We require shorts to feel natural in a full-height feed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formState.vertical}
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-200"
                onChange={(event) => updateField("vertical", event.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-[22px] border border-brand-100 bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Feature this short</p>
                <p className="text-xs text-stone-500">
                  Featured shorts rise closer to the top of the feed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formState.featured}
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-200"
                onChange={(event) => updateField("featured", event.target.checked)}
              />
            </label>
          </div>

          {previewSrc ? (
            <div className="rounded-[26px] border border-brand-100 bg-brand-50/25 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Video className="h-4 w-4 text-brand-700" />
                Preview
              </div>
              <div className="mt-3 overflow-hidden rounded-[22px] bg-black">
                {formState.playbackMode === "embed" && formState.embedUrl ? (
                  <div className="aspect-[9/16] w-full">
                    <iframe
                      src={formState.embedUrl}
                      title={formState.title || "Short preview"}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="mx-auto aspect-[9/16] w-full max-w-[20rem]">
                    <video
                      src={previewSrc}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSaving || isUploading}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetUiState();
                resetForm();
              }}
              disabled={isSaving || isUploading}
            >
              Reset
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
