"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { Button } from "@/components/ui/button";
import { teamHubConfigs } from "@/services/football-hub-data";
import { FootballTeam } from "@/types";

const teamAccentStyles: Record<FootballTeam, string> = {
  "Manchester United": "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
  Arsenal: "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100",
  Chelsea: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100",
  "Manchester City": "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100"
};

export function CreatePostForm() {
  const router = useRouter();
  const { currentUser, createNewPost } = useAppData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<FootballTeam | "">("");
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function clearSelectedImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreview(previewUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      setErrorMessage("Text is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await createNewPost({ text, imageFile: selectedImage, teamTag: selectedTeam || undefined });
      setText("");
      setSelectedTeam("");
      clearSelectedImage();
      router.replace("/");
    } catch (error) {
      console.error("Create post failed", error);
      setErrorMessage(error instanceof Error ? error.message : "Unable to create post.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-3xl border border-brand-100 bg-white/95 p-4 shadow-soft sm:p-5">
      {!currentUser ? (
        <p className="mb-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Log in before creating a post.
        </p>
      ) : null}

      <textarea
        rows={5}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What would you like to share with the community? Try #Habesha, #GGMU, or #Addis"
        className="w-full rounded-3xl border border-brand-100 bg-brand-50/50 p-4 text-sm leading-6 outline-none ring-brand-300 transition focus:ring-2"
      />
      <p className="mt-2 text-xs leading-5 text-stone-500">
        Hashtags in your text become clickable topic links automatically.
      </p>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Football team tag
          </p>
          {selectedTeam ? (
            <button
              type="button"
              className="text-xs font-semibold text-stone-500 transition hover:text-stone-700"
              onClick={() => setSelectedTeam("")}
            >
              Clear
            </button>
          ) : (
            <p className="text-xs text-stone-400">Optional</p>
          )}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {Object.values(teamHubConfigs).map((teamConfig) => {
            const active = selectedTeam === teamConfig.team;
            return (
              <button
                key={teamConfig.slug}
                type="button"
                onClick={() => setSelectedTeam((current) => (current === teamConfig.team ? "" : teamConfig.team))}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                  active
                    ? `${teamAccentStyles[teamConfig.team]} shadow-sm`
                    : "border-brand-100 bg-white text-stone-600 hover:border-brand-200 hover:bg-brand-50"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${teamConfig.badgeGradient} text-[11px] font-black text-white`}
                >
                  {teamConfig.badge}
                </span>
                {teamConfig.team}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-3 text-sm font-medium text-stone-700">
        <ImagePlus className="h-5 w-5 text-brand-700" />
        {selectedImage ? "Change image" : "Add an image"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </label>

      {imagePreview ? (
        <div className="mt-4 overflow-hidden rounded-3xl border border-brand-100 bg-brand-50/30">
          <img src={imagePreview} alt="Preview" className="max-h-[24rem] w-full object-cover" />
          <div className="flex items-center justify-between gap-3 border-t border-brand-100 bg-white/90 px-4 py-3">
            <p className="min-w-0 truncate text-sm text-stone-600">
              {selectedImage?.name || "Selected image"}
            </p>
            <Button type="button" variant="ghost" className="gap-2 px-3 py-1.5" onClick={clearSelectedImage}>
              <X className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}

      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={!currentUser || isSubmitting}>
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
