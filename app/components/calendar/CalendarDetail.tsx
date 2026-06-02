import type { Post } from "../../types/post";

type CalendarDetailProps = {
  dateKey: string;
  posts: Post[];
};

export default function CalendarDetail({ dateKey, posts }: CalendarDetailProps) {
  return (
    <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
      <p className="text-xs font-black text-[#f39a00]">SELECTED DAY</p>
      <h2 className="mt-1 text-2xl font-black">{dateKey}</h2>

      {posts.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[#fff4d7] px-4 py-4 text-sm font-bold text-[#6b2f13]/70">
          この日の投稿はありません
        </p>
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
    <div className="rounded-[28px] bg-[#fff4d7] p-4">
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

      {post.memo && (
        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold">
          {post.memo}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <CalendarPhoto label="準備" src={post.prepPhoto} />
        <CalendarPhoto label="調理" src={post.cookingPhoto} />
        <CalendarPhoto label="完成" src={post.finishedPhoto} />
      </div>
    </div>
  );
}

function CalendarPhoto({ label, src }: { label: string; src?: string | null }) {
  if (!src) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border-2 border-dashed border-[#f1d59a] bg-white/60 text-sm font-black text-[#6b2f13]/40">
        {label}
      </div>
    );
  }

  return (
    <div className="bg-white p-2 pb-6 shadow-xl">
      <img src={src} alt={label} className="aspect-[3/4] w-full object-cover" />
      <p className="mt-1 text-center text-[11px] font-black text-[#6b2f13]">
        {label}
      </p>
    </div>
  );
}
