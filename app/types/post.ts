export type Post = {
    id: string;
    userName: string;
    userIcon: string;
    createdAt: string;
    prepPhoto?: string;
    cookingPhoto?: string;
    finishedPhoto?: string;
    dishName?: string;
    memo?: string;
    titleSuffix?: "作りました" | "食べました" | "なし";
    userId?: string;
    postDate?: string;
    likeCount?: number;
    commentCount?: number;
    liked?: boolean;
  };
