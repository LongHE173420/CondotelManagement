import React, { FC } from "react";
import { PostDataType } from "data/types";
import Card12 from "./Card12";
import Card13 from "./Card13";

export interface SectionMagazine5Props {
  posts: PostDataType[];
  className?: string;
}

const SectionMagazine5: FC<SectionMagazine5Props> = ({
  posts,
  className = ""
}) => {
  return (
    <div className={`nc-SectionMagazine5 ${className}`}>
      <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
        {posts[0] && <Card12 post={posts[0]} />}
        <div className="grid gap-6 md:gap-8">
          {posts
            .filter((_, i) => i < 4 && i > 0)
            .map((item, index) => (
              <Card13 key={index} post={item} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default SectionMagazine5;