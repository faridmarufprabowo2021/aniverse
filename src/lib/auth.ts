import { createClient } from "@/lib/supabase/client";

// ─── Sign Up ────────────────────────────────────────────
export async function signUp(email: string, password: string, username: string) {
  const supabase = createClient();

  // 1. Create the auth user (email confirmation disabled in Supabase dashboard)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.toLowerCase(), display_name: username },
    },
  });

  if (error) return { data: null, error };

  // 2. If user created successfully, insert/upsert into public.users table
  if (data?.user) {
    await supabase.from("users").upsert({
      id: data.user.id,
      email: email,
      username: username.toLowerCase(),
      display_name: username,
      avatar_url: null,
      created_at: new Date().toISOString(),
    }, { onConflict: "id" });
  }

  return { data, error: null };
}

// ─── Sign In ─────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

// ─── Sign In with Google ──────────────────────────────────
export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });
  return { data, error };
}

// ─── Sign Out ─────────────────────────────────────────────
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

// ─── Get current user ─────────────────────────────────────
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Get user profile from DB ─────────────────────────────
export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}
