import EmptyState from "../common/EmptyState";
import type { Post } from "../../types/post";

type CalendarDetailProps = {
  dateKey: string;
  posts: Post[];
};

export default function CalendarDetail({ dateKey, posts }: CalendarDetailProps) {
  return (
    <section className="mt-[8px] rounded-[8px] bg-[#fdf7f0] p-[11px] shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/70">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[14px] font-black leading-none text-[#3f2116]">
            {formatDateLabel(dateKey)}の食卓
          </h2>
        </div>
        <button className="flex h-[22px] shrink-0 items-center rounded-full bg-[#fff8e6] px-3 text-[9px] font-black leading-none text-[#3f2116] ring-1 ring-[#dfc79d]/70">
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
        <div className="mt-[6px] space-y-2">
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
    <div className="rounded-[8px] bg-transparent">
      <h3 className="break-words text-[10px] font-black leading-tight text-[#3f2116]">
        {post.dishName || "今日の料理"}
      </h3>
      <CalendarChekiTriplet post={post} className="mt-[3px]" />

      <div className="mt-[8px] flex items-center gap-2">
        <img
          src={post.userIcon || "/images/user1-icon.jpg"}
          alt={post.userName || "ユーザー"}
          className="h-[30px] w-[30px] rounded-full object-cover ring-2 ring-white"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black leading-none">{post.userName}から</p>
          {post.memo && (
            <p className="mt-[4px] truncate rounded-[7px] bg-[#fff8e6] px-3 py-[8px] text-[9px] font-bold leading-none text-[#3f2116]/75">
              {post.memo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarChekiTriplet({
  post,
  className = "",
}: {
  post: Pick<Post, "prepPhoto" | "cookingPhoto" | "finishedPhoto">;
  className?: string;
}) {
  const photos = [
    { label: "準備", src: post.prepPhoto, pose: "-rotate-[3deg] translate-y-[1px]" },
    { label: "調理", src: post.cookingPhoto, pose: "rotate-[1deg] -translate-y-[1px]" },
    { label: "完成", src: post.finishedPhoto, pose: "rotate-[3deg] translate-y-[2px]" },
  ];

  return (
    <div className={`grid grid-cols-3 gap-[8px] ${className}`}>
      {photos.map((photo) => (
        <div
          key={photo.label}
          className={`h-[94px] rounded-[7px] bg-[#fffaf2] p-[5px] shadow-[0_10px_20px_rgba(63,33,22,0.13)] ring-1 ring-[#ead8b6] ${photo.pose}`}
        >
          {photo.src ? (
            <img
              src={photo.src}
              alt={photo.label}
              draggable={false}
              className="h-[55px] w-full rounded-[5px] object-cover"
            />
          ) : (
            <div className="flex h-[55px] w-full items-center justify-center rounded-[5px] bg-[#f4a72d]/12 text-[10px] font-black text-[#2f6b4f]">
              {photo.label}
            </div>
          )}

          <p className="mt-[8px] text-center text-[11px] font-black leading-none text-[#3f2116]">
            {photo.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
