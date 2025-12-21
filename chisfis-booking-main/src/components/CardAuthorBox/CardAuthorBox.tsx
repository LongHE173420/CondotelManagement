import React, { FC } from "react";
import { AuthorType } from "data/types";
import { StarIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import Avatar from "shared/Avatar/Avatar";
import Badge from "shared/Badge/Badge";

export interface CardAuthorBoxProps {
  className?: string;
  author: AuthorType;
  index?: number;
}

const CardAuthorBox: FC<CardAuthorBoxProps> = ({
  className = "",
  author,
  index,
}) => {
  const { displayName, href = "/", avatar, starRating, reviewCount } = author;
  return (
    <Link
      to={href}
      className={`nc-CardAuthorBox relative flex flex-col items-center justify-center text-center px-3 py-5 sm:px-6 sm:py-7  [ nc-box-has-hover ] [ nc-dark-box-bg-has-hover ] ${className}`}
      data-nc-id="CardAuthorBox"
    >
      {index && (
        <Badge
          className="absolute left-3 top-3"
          color={index === 1 ? "red" : index === 2 ? "blue" : "green"}
          name={`#${index}`}
        />
      )}
      <Avatar
        sizeClass="w-20 h-20 text-2xl"
        radius="rounded-full"
        imgUrl={avatar}
        userName={displayName}
      />
      <div className="mt-3">
        <h2 className={`text-base font-medium`}>
          <span className="line-clamp-1">{displayName}</span>
        </h2>
        <span
          className={`block mt-1.5 text-sm text-neutral-500 dark:text-neutral-400`}
        >
          Host chuyên nghiệp
        </span>
      </div>
      <div className="py-2 px-5 mt-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center ">
        <span className="text-xs font-medium pt-[1px]">
          {(starRating || 0).toFixed(1)}
        </span>
        <div className="flex items-center gap-0.5 ml-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(starRating || 0)
                  ? "text-amber-500"
                  : i < (starRating || 0)
                  ? "text-amber-200"
                  : "text-neutral-300 dark:text-neutral-600"
              }`}
            />
          ))}
        </div>
      </div>
      {reviewCount !== undefined && reviewCount > 0 && (
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {reviewCount} đánh giá
        </div>
      )}
    </Link>
  );
};

export default CardAuthorBox;
