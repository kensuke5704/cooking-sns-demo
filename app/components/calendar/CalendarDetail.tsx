import EmptyState from "../common/EmptyState";
import type { Post } from "../../types/post";
import MiniChekiTriplet from "../post/MiniChekiTriplet";

type CalendarDetailProps = {
  dateKey: string;
  posts: Post[];
};

export default function CalendarDetail({ dateKey, posts }: CalendarDetailProps) {
  return (
    <section className="mt-3 rounded-[8px] bg-[#fffaf2]/94 p-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-black text-[#3f2116]">
            {formatDateLabel(dateKey)}の食卓
          </h2>
        </div>
        <button className="shrink-0 rounded-full bg-[#fff8e6] px-3 py-1.5 text-[10px] font-black text-[#3f2116] ring-1 ring-[#dfc79d]/70">
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
        <div className="mt-3 space-y-3">
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
    <div className="rounded-[8px] border border-[#dfc79d]/65 bg-[#fff8e6]/62 p-3">
      <div className="flex items-center gap-3">
        <img
          src={post.userIcon || "/images/user1-icon.jpg"}
          alt={post.userName || "ユーザー"}
          className="h-8 w-8 rounded-full object-cover"
        />

        <div>
          <p className="text-[12px] font-black">{post.userName}</p>
          {post.dishName && (
            <p className="text-xs font-bold text-[#6b2f13]/70">
              {post.dishName}
            </p>
          )}
        </div>
      </div>

      <h3 className="mt-2 break-words text-[13px] font-black text-[#3f2116]">
        {post.dishName || "今日の料理"}
      </h3>
      <MiniChekiTriplet post={post} className="mt-4" />
      {post.memo && (
        <p className="mt-3 rounded-[6px] bg-[#fffaf2] px-3 py-2 text-[11px] font-bold leading-relaxed text-[#3f2116]">
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
