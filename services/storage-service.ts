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

async function uploadStorageFile(input: {
  path: string;
  file: Blob | File;
  contentType?: string;
  uploadTimeoutMessage: string;
  urlTimeoutMessage: string;
}) {
  if (!firebaseStorage) {
    throw new Error("Firebase Storage is not configured for uploads.");
  }

  const storageRef = ref(firebaseStorage, input.path);

  await withStorageTimeout(
    uploadBytes(storageRef, input.file, {
      contentType: input.contentType || undefined
    }),
    input.uploadTimeoutMessage
  );

  const url = await withStorageTimeout(
    getDownloadURL(storageRef),
    input.urlTimeoutMessage
  );

  return {
    url,
    storagePath: input.path
  };
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
  const path = `posts/${input.userId}/${input.postId}-${Date.now()}.${extension}`;

  try {
    const result = await uploadStorageFile({
      path,
      file: input.file,
      contentType: input.file.type || undefined,
      uploadTimeoutMessage: "Timed out while uploading your image.",
      urlTimeoutMessage: "Timed out while preparing your uploaded image."
    });

    return result.url;
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

  const path = `users/${input.userId}/profile.jpg`;

  try {
    const result = await uploadStorageFile({
      path,
      file: input.file,
      contentType: input.file.type || undefined,
      uploadTimeoutMessage: "Timed out while uploading your profile image.",
      urlTimeoutMessage: "Timed out while preparing your profile image."
    });

    return result.url;
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
