import { avatarColors } from "contains/contants";
import React, { FC } from "react";
import avatar1 from "images/avatars/Image-1.png";

export interface AvatarProps {
  containerClassName?: string;
  sizeClass?: string;
  radius?: string;
  imgUrl?: string;
  userName?: string;
  hasChecked?: boolean;
  hasCheckedClass?: string;
}

const Avatar: FC<AvatarProps> = ({
  containerClassName = "ring-1 ring-white dark:ring-neutral-900",
  sizeClass = "h-6 w-6 text-sm",
  radius = "rounded-full",
  imgUrl,
  userName,
  hasChecked,
  hasCheckedClass = "w-4 h-4 -top-0.5 -right-0.5",
}) => {
  // Chỉ dùng imgUrl nếu có giá trị (không dùng default avatar1)
  // Nếu không có imgUrl, sẽ hiển thị chữ cái đầu với background màu
  const url = imgUrl && imgUrl.trim() !== "" ? imgUrl : "";
  const name = userName || "John Doe";
  const _setBgColor = (name: string) => {
    const backgroundIndex = Math.floor(
      name.charCodeAt(0) % avatarColors.length
    );
    return avatarColors[backgroundIndex];
  };

  return (
    <div
      className={`wil-avatar relative flex-shrink-0 inline-flex items-center justify-center text-neutral-100 uppercase font-semibold shadow-inner ${radius} ${sizeClass} ${containerClassName}`}
      style={{ backgroundColor: url ? undefined : _setBgColor(name) }}
    >
      {url && (
        <img
          className={`absolute inset-0 w-full h-full object-cover ${radius} z-10`}
          src={url}
          alt={name}
          onError={(e) => {
            console.error("❌ Image load error:", url);
            // Nếu ảnh lỗi, ẩn ảnh để hiển thị chữ cái đầu
            e.currentTarget.style.display = "none";
          }}
          onLoad={() => {
            console.log("✅ Image loaded successfully:", url);
          }}
        />
      )}
      <span className={`wil-avatar__name ${url ? "opacity-0" : ""}`}>{name[0]}</span>

      {hasChecked && (
        <span
          className={` bg-teal-500 rounded-full text-white text-xs flex items-center justify-center absolute  ${hasCheckedClass}`}
        >
          <i className="las la-check"></i>
        </span>
      )}
    </div>
  );
};

export default Avatar;
