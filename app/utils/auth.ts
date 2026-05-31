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
  
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
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