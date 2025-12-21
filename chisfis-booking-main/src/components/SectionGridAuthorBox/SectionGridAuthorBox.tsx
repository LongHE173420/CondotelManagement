import CardAuthorBox from "components/CardAuthorBox/CardAuthorBox";
import CardAuthorBox2 from "components/CardAuthorBox2/CardAuthorBox2";
import Heading from "components/Heading/Heading";
import { DEMO_AUTHORS } from "data/authors";
import { AuthorType } from "data/types";
import React, { FC } from "react";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";

export interface SectionGridAuthorBoxProps {
  className?: string;
  authors?: AuthorType[];
  boxCard?: "box1" | "box2";
  gridClassName?: string;
}

const DEMO_DATA = DEMO_AUTHORS.filter((_, i) => i < 10);

const SectionGridAuthorBox: FC<SectionGridAuthorBoxProps> = ({
  className = "",
  authors = DEMO_DATA,
  boxCard = "box1",
  gridClassName = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ",
}) => {
  // Use provided authors or fallback to demo data
  const displayAuthors = authors && authors.length > 0 ? authors : DEMO_DATA;
  
  return (
    <div
      className={`nc-SectionGridAuthorBox relative ${className}`}
      data-nc-id="SectionGridAuthorBox"
    >
      <Heading desc="Dựa trên đánh giá và phản hồi từ khách hàng" isCenter>
        Top 10 Host xuất sắc nhất
      </Heading>
      {displayAuthors.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-neutral-500 dark:text-neutral-400">Đang tải danh sách host...</p>
        </div>
      ) : (
        <div className={`grid gap-6 md:gap-8 ${gridClassName}`}>
          {displayAuthors.map((author, index) =>
            boxCard === "box2" ? (
              <CardAuthorBox2 key={author.id} author={author} />
            ) : (
              <CardAuthorBox
                index={index < 3 ? index + 1 : undefined}
                key={author.id}
                author={author}
              />
            )
          )}
        </div>
      )}
      <div className="mt-16 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-5">
        <ButtonSecondary href="/listing-stay">Xem thêm Host</ButtonSecondary>
        <ButtonPrimary href="/become-a-host">Trở thành Host</ButtonPrimary>
      </div>
    </div>
  );
};

export default SectionGridAuthorBox;
