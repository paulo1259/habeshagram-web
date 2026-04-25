"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogOut, X } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileGrid } from "@/components/posts/profile-grid";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppData } from "@/hooks/use-app-data";
import { getUserDocument, subscribeToUserDocument } from "@/services/user-service";
import { Post } from "@/types";

export default function ProfilePage() {
  const { currentUser, deletedPostIds, getProfilePosts, isReady, logout, updateProfile } = useAppData();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileImageURL, setProfileImageURL] = useState("");
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [createdAt, setCreatedAt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePreview, setProfilePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      setPosts([]);
      return;
    }

    let isMounted = true;

    void (async () => {
      const nextPosts = await getProfilePosts(currentUser.id);
      if (isMounted) {
        setPosts(nextPosts);
      }
    })();

    const unsubscribe = subscribeToUserDocument(currentUser.id, (profile) => {
      const resolvedProfile = profile || currentUser;
      setProfileImageURL(resolvedProfile.profileImageURL);
      setFollowerCount(resolvedProfile.followerCount);
      setFollowingCount(resolvedProfile.followingCount);
      setCreatedAt(resolvedProfile.createdAt);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser, getProfilePosts]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setUsername(currentUser.username);
    setBio(currentUser.bio);
    setProfilePreview(currentUser.profileImageURL);
    setProfileImageURL(currentUser.profileImageURL);
    setSelectedImage(null);
  }, [currentUser]);

  const joinedLabel = useMemo(() => {
    if (!createdAt) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    }).format(new Date(createdAt));
  }, [createdAt]);

  const visiblePosts = useMemo(
    () => posts.filter((post) => !deletedPostIds.includes(post.id)),
    [deletedPostIds, posts]
  );

  function clearSelectedImage() {
    if (selectedImage && profilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(profilePreview);
    }

    setSelectedImage(null);
    setProfilePreview(profileImageURL || "");

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

  async function handleConfirmSignOut() {
    try {
      setIsSigningOut(true);
      setErrorMessage("");
      await logout();
      router.push("/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign out right now.");
    } finally {
      setIsSigningOut(false);
      setIsConfirmingSignOut(false);
    }
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
      const nextProfile = await getUserDocument(currentUser!.id);
      if (nextProfile) {
        setProfileImageURL(nextProfile.profileImageURL);
        setFollowerCount(nextProfile.followerCount);
        setFollowingCount(nextProfile.followingCount);
        setCreatedAt(nextProfile.createdAt);
      }
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
                      imageURL={profilePreview || profileImageURL}
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
                      <p className="font-medium text-brand-800">{visiblePosts.length} posts</p>
                      <p className="text-stone-500">{followerCount} followers</p>
                      <p className="text-stone-500">{followingCount} following</p>
                      {joinedLabel ? <p className="text-stone-500">Joined {joinedLabel}</p> : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
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
                    <Button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setIsConfirmingSignOut(false);
                        setSuccessMessage("");
                        setErrorMessage("");
                      }}
                    >
                      Edit profile
                    </Button>
                  )}
                </div>
              </div>

              {successMessage ? <p className="mt-4 text-sm text-green-700">{successMessage}</p> : null}
              {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}

              {!isEditing ? (
                <div className="mt-5 rounded-[24px] border border-brand-100/90 bg-gradient-to-br from-brand-50/70 via-white to-orange-50/60 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Account actions</p>
                      <p className="mt-1 text-sm text-stone-600">
                        Sign out safely from this device when you are done.
                      </p>
                    </div>

                    {!isConfirmingSignOut ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center gap-2 sm:w-auto"
                        onClick={() => {
                          setIsConfirmingSignOut(true);
                          setSuccessMessage("");
                          setErrorMessage("");
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    ) : (
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                        <p className="text-sm text-stone-700">Sign out of HabeshaGram on this device?</p>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full sm:w-auto"
                            onClick={() => setIsConfirmingSignOut(false)}
                            disabled={isSigningOut}
                          >
                            Stay signed in
                          </Button>
                          <Button
                            type="button"
                            className="w-full gap-2 sm:w-auto"
                            onClick={handleConfirmSignOut}
                            disabled={isSigningOut}
                          >
                            <LogOut className="h-4 w-4" />
                            {isSigningOut ? "Signing out..." : "Confirm sign out"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            <ProfileGrid posts={visiblePosts} />
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
