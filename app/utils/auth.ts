const USERS_KEY = "app-users";

export type AppUser = {
    id: string;
    name: string;
    userId: string;
  };
  
  export type Friend = {
    id: string;
    name: string;
    userId: string;
  };
  
  const CURRENT_USER_KEY = "current-user";
  const FRIENDS_KEY = "friends";
  
  export function getCurrentUser(): AppUser | null {
    if (typeof window === "undefined") return null;
  
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  }
  
  export function registerUser(name: string, userId: string): AppUser {
    const user: AppUser = {
      id: crypto.randomUUID(),
      name,
      userId,
    };
  
    localStorage.setItem("current-user", JSON.stringify(user));
    saveUserToUsers(user);
  
    return user;
  }
  
  export function logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
  
  export function getFriends(): Friend[] {
    if (typeof window === "undefined") return [];
  
    const saved = localStorage.getItem(FRIENDS_KEY);
    return saved ? JSON.parse(saved) : [];
  }
  
  export function addFriend(name: string, userId: string) {
    const friends = getFriends();
  
    const exists = friends.some((friend) => friend.userId === userId);
    if (exists) return friends;
  
    const nextFriends = [
      ...friends,
      {
        id: crypto.randomUUID(),
        name,
        userId,
      },
    ];
  
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(nextFriends));
    return nextFriends;
  }

  export function getAllUsers(): AppUser[] {
    if (typeof window === "undefined") return [];
  
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  }
  
  export function saveUserToUsers(user: AppUser) {
    const users = getAllUsers();
  
    const exists = users.some((u) => u.userId === user.userId);
    if (exists) return;
  
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  }
  
  export function searchUserByUserId(userId: string): AppUser | null {
    const users = getAllUsers();
    return users.find((user) => user.userId === userId) ?? null;
  }

  export function updateCurrentUser(data: Partial<AppUser>) {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
  
    const updatedUser = {
      ...currentUser,
      ...data,
    };
  
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  
    const users = getAllUsers();
    const updatedUsers = users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user
    );
  
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  
    return updatedUser;
  }