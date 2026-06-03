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
      filledClass: "left-[2%] top-7 rotate-[-6deg] z-20",
      emptyClass: "left-[2%] top-7 rotate-[-6deg] z-0",
    },
    {
      label: "調理",
      src: post.cookingPhoto,
      filledClass: "left-1/2 -translate-x-1/2 top-0 rotate-[2deg] z-30",
      emptyClass: "left-1/2 -translate-x-1/2 top-0 rotate-[2deg] z-0",
    },
    {
      label: "完成",
      src: post.finishedPhoto,
      filledClass: "right-[2%] top-7 rotate-[6deg] z-40",
      emptyClass: "right-[2%] top-7 rotate-[6deg] z-0",
    },
  ];

  const orderedPhotos = [
    ...photos.filter((photo) => !photo.src),
    ...photos.filter((photo) => photo.src),
  ];

  return (
    <div className="relative z-10 h-52">
      {orderedPhotos.map((photo) => (
        <div
          key={photo.label}
          onClick={() => photo.src && onClick(photo.src)}
          className={`absolute aspect-[3/4] w-[44%] cursor-pointer ${
            photo.src ? photo.filledClass : photo.emptyClass
          }`}
        >
          <PhotoBox label={photo.label} src={photo.src} onClick={onClick} />
        </div>
      ))}
    </div>
  );
}
