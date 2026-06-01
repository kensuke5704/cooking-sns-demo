import { supabase } from "./supabase";

export type AppUser = {
  id: string;
  name: string;
  userId: string;
  iconUrl?: string;
};

export type Friend = {
  id: string;
  name: string;
  userId: string;
};

const CURRENT_USER_KEY = "current-user";

export function getCurrentUser(): AppUser | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(CURRENT_USER_KEY);
  return saved ? JSON.parse(saved) : null;
}

export async function registerUser(
  name: string,
  userId: string
): Promise<AppUser> {
  const user: AppUser = {
    id: crypto.randomUUID(),
    name,
    userId,
  };

  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingUser) {
    throw new Error("このIDは既に使用されています");
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    name: user.name,
    user_id: user.userId,
    icon_url: null,
  });

  if (error) {
    console.error("register error:", error);
  
    throw new Error(
      error.message || "ユーザー登録に失敗しました"
    );
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  return user;
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function loginUser(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  const user: AppUser = {
    id: data.id,
    name: data.name,
    userId: data.user_id,
    iconUrl: data.icon_url ?? undefined,
  };

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(user)
  );

  return user;
}

export async function searchUserByUserId(
  userId: string
): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    userId: data.user_id,
    iconUrl: data.icon_url ?? undefined,
  };
}

export async function updateCurrentUser(data: Partial<AppUser>) {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const updatedUser = {
    ...currentUser,
    ...data,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: updatedUser.name,
      icon_url: updatedUser.iconUrl ?? null,
    })
    .eq("user_id", updatedUser.userId);

  if (error) {
    console.error(error);
    throw new Error("プロフィール更新に失敗しました");
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

  return updatedUser;
}