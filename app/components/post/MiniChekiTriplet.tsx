import type { Post } from "../../types/post";

const photoPoses = [
  "-rotate-[3deg] translate-y-1",
  "rotate-[1deg]",
  "rotate-[3deg] translate-y-2",
];

export default function MiniChekiTriplet({
  post,
  className = "",
}: {
  post: Pick<Post, "prepPhoto" | "cookingPhoto" | "finishedPhoto">;
  className?: string;
}) {
  const photos = [
    { label: "準備", src: post.prepPhoto },
    { label: "調理", src: post.cookingPhoto },
    { label: "完成", src: post.finishedPhoto },
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {photos.map((photo, index) => (
        <div
          key={photo.label}
          className={`rounded-[8px] bg-[#fffaf2] p-1.5 pb-6 shadow-[0_12px_26px_rgba(63,33,22,0.14)] ring-1 ring-[#ead8b6] ${photoPoses[index]}`}
        >
          {photo.src ? (
            <img
              src={photo.src}
              alt={photo.label}
              draggable={false}
              className="aspect-[4/3] w-full rounded-[6px] object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[6px] bg-[#f4a72d]/12 text-[11px] font-black text-[#2f6b4f]">
              {photo.label}
            </div>
          )}

          <p className="mt-1 text-center text-[12px] font-black leading-none text-[#3f2116]">
            {photo.label}
          </p>
        </div>
      ))}
    </div>
  );
}
