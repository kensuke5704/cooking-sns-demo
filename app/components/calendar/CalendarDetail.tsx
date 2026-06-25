import EmptyState from "../common/EmptyState";
import type { Post } from "../../types/post";
import MiniChekiTriplet from "../post/MiniChekiTriplet";

type CalendarDetailProps = {
  dateKey: string;
  posts: Post[];
};

export default function CalendarDetail({ dateKey, posts }: CalendarDetailProps) {
  return (
    <section className="mt-5 rounded-[30px] bg-[#fffaf2]/94 p-5 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[24px] font-black text-[#3f2116]">
            {formatDateLabel(dateKey)}の食卓
          </h2>
        </div>
        <button className="shrink-0 rounded-full bg-[#fff8e6] px-4 py-2 text-sm font-black text-[#3f2116] ring-1 ring-[#dfc79d]/70">
          編集
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="投稿はありません"
          />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {posts.map((post) => (
            <CalendarPost key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

function CalendarPost({ post }: { post: Post }) {
  return (
    <div className="rounded-[24px] border border-[#dfc79d]/65 bg-[#fff8e6]/62 p-4">
      <div className="flex items-center gap-3">
        <img
          src={post.userIcon || "/images/user1-icon.jpg"}
          alt={post.userName || "ユーザー"}
          className="h-10 w-10 rounded-full object-cover"
        />

        <div>
          <p className="text-sm font-black">{post.userName}</p>
          {post.dishName && (
            <p className="text-xs font-bold text-[#6b2f13]/70">
              {post.dishName}
            </p>
          )}
        </div>
      </div>

      <h3 className="mt-4 break-words text-[21px] font-black text-[#3f2116]">
        {post.dishName || "今日の料理"}
      </h3>
      <MiniChekiTriplet post={post} className="mt-4" />
      {post.memo && (
        <p className="mt-5 rounded-[20px] bg-[#fffaf2] px-4 py-3 text-sm font-bold leading-relaxed text-[#3f2116]">
          {post.memo}
        </p>
      )}
    </div>
  );
}

function formatDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}
