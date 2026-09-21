import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { User } from "@/types";

type SignupInput = {
  username: string;
  email: string;
  password: string;
  bio?: string;
};

const DEFAULT_BIO = "";

function getConfigError() {
  return "Sign-in is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server.";
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(getConfigError());
  }

  return supabase;
}

/**
 * Supabase returns auth identity; the public profile row is created by the
 * `handle_new_user` trigger. We read the profile when we can, and fall back to
 * auth metadata so a slow or missing profile row never blocks a valid session.
 */
function fallbackUser(authUser: SupabaseUser): User {
  const email = authUser.email ?? "";
  const metadataUsername =
    typeof authUser.user_metadata?.username === "string" ? authUser.user_metadata.username : "";

  return {
    id: authUser.id,
    username: metadataUsername.trim() || email.split("@")[0] || "habesha_user",
    bio: DEFAULT_BIO,
    profileImageURL: "",
    createdAt: authUser.created_at ?? new Date().toISOString()
  };
}

async function loadProfile(authUser: SupabaseUser): Promise<User> {
  const client = requireClient();

  const { data, error } = await client
    .from("profiles")
    .select("id, username, bio, avatar_url, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !data) {
    return fallbackUser(authUser);
  }

  return {
    id: data.id,
    username: data.username,
    bio: data.bio || DEFAULT_BIO,
    profileImageURL: data.avatar_url || "",
    createdAt: data.created_at
  };
}

function mapAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (/invalid login credentials/i.test(message)) {
    return "Incorrect email or password.";
  }

  if (/already registered|already been registered/i.test(message)) {
    return "An account with that email already exists.";
  }

  if (/password should be at least/i.test(message)) {
    return "Use a stronger password with at least 6 characters.";
  }

  if (/rate limit|too many/i.test(message)) {
    return "Too many attempts were made. Please wait a bit and try again.";
  }

  return message || "Authentication failed.";
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user ? loadProfile(data.user) : null;
}

export function subscribeToUserSession(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured || !supabase) {
    callback(null);
    return () => undefined;
  }

  const client = supabase;

  const handle = (session: Session | null) => {
    if (!session?.user) {
      callback(null);
      return;
    }

    // Emit the cheap value first so the UI is never blocked on a round trip.
    callback(fallbackUser(session.user));
    void loadProfile(session.user).then(callback).catch(() => undefined);
  };

  void client.auth.getSession().then(({ data }) => handle(data.session));

  const {
    data: { subscription }
  } = client.auth.onAuthStateChange((_event, session) => handle(session));

  return () => subscription.unsubscribe();
}

export async function loginUser(email: string, password: string): Promise<User> {
  if (!password.trim()) {
    throw new Error("Password is required.");
  }

  const client = requireClient();

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error || !data.user) {
    throw new Error(mapAuthError(error));
  }

  return loadProfile(data.user);
}

export async function signupUser(input: SignupInput): Promise<User> {
  if (!input.password.trim()) {
    throw new Error("Password is required.");
  }

  const client = requireClient();

  const { data, error } = await client.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      // Read by the handle_new_user trigger to seed profiles.username.
      data: { username: input.username.trim() }
    }
  });

  if (error || !data.user) {
    throw new Error(mapAuthError(error));
  }

  return loadProfile(data.user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const client = requireClient();

  const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined
  });

  if (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function logoutUser() {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  await supabase.auth.signOut();
}

export async function updateProfileDetails(input: {
  username: string;
  bio: string;
}): Promise<User> {
  const client = requireClient();

  const { data: authData } = await client.auth.getUser();

  if (!authData.user) {
    throw new Error("Please log in first.");
  }

  const username = input.username.trim();

  if (!username) {
    throw new Error("Username is required.");
  }

  const { data, error } = await client
    .from("profiles")
    .update({ username, bio: input.bio.trim() || DEFAULT_BIO })
    .eq("id", authData.user.id)
    .select("id, username, bio, avatar_url, created_at")
    .single();

  if (error || !data) {
    // A unique violation on lower(username) is the common case here.
    if (error && /duplicate key|unique/i.test(error.message)) {
      throw new Error("That username is already taken.");
    }

    throw new Error(error?.message || "Unable to update your profile.");
  }

  return {
    id: data.id,
    username: data.username,
    bio: data.bio || DEFAULT_BIO,
    profileImageURL: data.avatar_url || "",
    createdAt: data.created_at
  };
}
