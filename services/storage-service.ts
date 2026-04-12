import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseStorage } from "@/lib/firebase";

const STORAGE_TIMEOUT_MS = 10000;

async function withStorageTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), STORAGE_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.trim().toLowerCase();
  if (fromName) {
    return fromName;
  }

  const mimeSuffix = file.type.split("/").pop()?.trim().toLowerCase();
  return mimeSuffix || "jpg";
}

export async function uploadPostImage(input: {
  file: File;
  userId: string;
  postId: string;
}): Promise<string> {
  if (!firebaseStorage) {
    throw new Error("Firebase Storage is not configured for image uploads.");
  }

  const extension = getFileExtension(input.file);
  const storageRef = ref(
    firebaseStorage,
    `posts/${input.userId}/${input.postId}-${Date.now()}.${extension}`
  );

  try {
    await withStorageTimeout(
      uploadBytes(storageRef, input.file, {
        contentType: input.file.type || undefined
      }),
      "Timed out while uploading your image."
    );

    return await withStorageTimeout(
      getDownloadURL(storageRef),
      "Timed out while preparing your uploaded image."
    );
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

    switch (code) {
      case "storage/unauthorized":
        throw new Error("Your Firebase Storage rules blocked this upload. Update your storage permissions and try again.");
      case "storage/canceled":
        throw new Error("Image upload was canceled.");
      case "storage/unknown":
        throw new Error("Storage could not finish the upload. Please try again.");
      default:
        throw new Error(error instanceof Error ? error.message : "Unable to upload your image.");
    }
  }
}

export async function uploadProfileImage(input: { file: File; userId: string }): Promise<string> {
  if (!firebaseStorage) {
    throw new Error("Firebase Storage is not configured for profile images.");
  }

  const storageRef = ref(firebaseStorage, `users/${input.userId}/profile.jpg`);

  try {
    await withStorageTimeout(
      uploadBytes(storageRef, input.file, {
        contentType: input.file.type || undefined
      }),
      "Timed out while uploading your profile image."
    );

    return await withStorageTimeout(
      getDownloadURL(storageRef),
      "Timed out while preparing your profile image."
    );
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

    switch (code) {
      case "storage/unauthorized":
        throw new Error("Your Firebase Storage rules blocked this profile image upload. Update your storage permissions and try again.");
      case "storage/canceled":
        throw new Error("Profile image upload was canceled.");
      default:
        throw new Error(error instanceof Error ? error.message : "Unable to upload your profile image.");
    }
  }
}
