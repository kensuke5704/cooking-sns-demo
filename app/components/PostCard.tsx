import type { Post } from "../types/post";
import StackedPhotos from "./StackedPhotos";

export default function PostCard({
  post,
  onImageClick,
}: {
  post: Post;
  onImageClick: (src: string) => void;
}) {
  return (
    <article className="bg-[#8a4728] rounded-[32px] overflow-hidden shadow-lg">
      <div className="px-5 py-3 flex items-center gap-3 text-white">
        <img
          src={post.userIcon}
          alt={post.userName}
          className="w-10 h-10 rounded-full object-cover border-2 border-white"
        />
        <span className="text-lg font-bold">{post.userName}</span>
      </div>

      <div className="bg-[#f7b18f] px-4 py-5">
        <StackedPhotos post={post} onClick={onImageClick} />
      </div>

      <div className="h-9 bg-[#8a4728]" />
    </article>
  );
}