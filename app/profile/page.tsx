"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileGrid } from "@/components/posts/profile-grid";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppData } from "@/hooks/use-app-data";
import { Post } from "@/types";

export default function ProfilePage() {
  const { currentUser, getProfilePosts, isReady, updateProfile } = useAppData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePreview, setProfilePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      setPosts([]);
      return;
    }

    void (async () => {
      const next = await getProfilePosts(currentUser.id);
      setPosts(next);
    })();
  }, [currentUser, getProfilePosts]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setUsername(currentUser.username);
    setBio(currentUser.bio);
    setProfilePreview(currentUser.profileImageURL);
    setSelectedImage(null);
  }, [currentUser]);

  const joinedLabel = useMemo(() => {
    if (!currentUser?.createdAt) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    }).format(new Date(currentUser.createdAt));
  }, [currentUser?.createdAt]);

  function clearSelectedImage() {
    if (selectedImage && profilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(profilePreview);
    }

    setSelectedImage(null);
    setProfilePreview(currentUser?.profileImageURL || "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (selectedImage && profilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(profilePreview);
    }

    setSelectedImage(file);
    setProfilePreview(URL.createObjectURL(file));
    setSuccessMessage("");
    setErrorMessage("");
  }

  function handleCancelEdit() {
    clearSelectedImage();
    setUsername(currentUser?.username || "");
    setBio(currentUser?.bio || "");
    setIsEditing(false);
    setErrorMessage("");
  }

  async function handleSaveProfile() {
    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      await updateProfile({
        username,
        bio,
        imageFile: selectedImage
      });
      setIsEditing(false);
      setSelectedImage(null);
      setSuccessMessage("Profile updated.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <AuthGuard>
        {!isReady ? null : currentUser ? (
          <div className="space-y-4">
            <section className="rounded-3xl border border-brand-100 bg-white/95 p-4 shadow-soft sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar
                      username={currentUser.username}
                      imageURL={profilePreview || currentUser.profileImageURL}
                      className="h-16 w-16 text-lg"
                    />
                    {isEditing ? (
                      <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 shadow-soft">
                        <Camera className="h-4 w-4" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                          className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
                          placeholder="Username"
                        />
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(event) => setBio(event.target.value)}
                          className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2"
                          placeholder="Tell the community a little about you"
                        />
                        {selectedImage ? (
                          <div className="flex items-center gap-3 text-sm text-stone-600">
                            <span className="truncate">{selectedImage.name}</span>
                            <Button type="button" variant="ghost" className="gap-2 px-2 py-1" onClick={clearSelectedImage}>
                              <X className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-black tracking-tight text-ink">@{currentUser.username}</h1>
                        <p className="mt-1 text-sm text-stone-600">{currentUser.email}</p>
                        <p className="mt-3 text-sm leading-6 text-stone-700">{currentUser.bio}</p>
                      </>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <p className="font-medium text-brand-800">{posts.length} posts</p>
                      {joinedLabel ? <p className="text-stone-500">Joined {joinedLabel}</p> : null}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button type="button" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save profile"}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => {
                      setIsEditing(true);
                      setSuccessMessage("");
                      setErrorMessage("");
                    }}>
                      Edit profile
                    </Button>
                  )}
                </div>
              </div>

              {successMessage ? <p className="mt-4 text-sm text-green-700">{successMessage}</p> : null}
              {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
            </section>

            <ProfileGrid posts={posts} />
          </div>
        ) : (
          <EmptyState
            title="No profile yet"
            description="Log in or sign up to see your profile and your posts."
          />
        )}
      </AuthGuard>
    </AppShell>
  );
}
