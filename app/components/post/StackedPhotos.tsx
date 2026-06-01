import type { Post } from "../../types/post";
import PhotoBox from "./PhotoBox";

export default function StackedPhotos({
  post,
  onClick,
}: {
  post: Post;
  onClick: (src: string) => void;
}) {
  const photos = [
    {
      label: "準備",
      src: post.prepPhoto,
      className: "left-2 top-8 rotate-[-8deg] z-10",
    },
    {
      label: "調理",
      src: post.cookingPhoto,
      className: "left-1/2 -translate-x-1/2 top-0 rotate-[2deg] z-20",
    },
    {
      label: "完成",
      src: post.finishedPhoto,
      className: "right-2 top-8 rotate-[8deg] z-30",
    },
  ];

  return (
    <div className="relative h-54 z-10">
      {photos.map((photo) => (
        <div
          key={photo.label}
          onClick={() => photo.src && onClick(photo.src)}
          className={`absolute w-[42%] aspect-[3/4] cursor-pointer ${photo.className}`}
        >
          <PhotoBox label={photo.label} src={photo.src} onClick={onClick} />
        </div>
      ))}
    </div>
  );
}