import React, { FC, useEffect, useMemo } from "react";
import Heading from "components/Heading/Heading";
import Glide from "@glidejs/glide";
import { TaxonomyType } from "data/types";
import CardCategory3 from "components/CardCategory3/CardCategory3";
import CardCategory4 from "components/CardCategory4/CardCategory4";
import NextPrev from "shared/NextPrev/NextPrev";
import CardCategory5 from "components/CardCategory5/CardCategory5";
import useNcId from "hooks/useNcId";

export interface SectionSliderNewCategoriesProps {
  className?: string;
  itemClassName?: string;
  heading?: string;
  subHeading?: string;
  categories?: TaxonomyType[];
  categoryCardType?: "card3" | "card4" | "card5";
  itemPerRow?: 4 | 5;
  sliderStyle?: "style1" | "style2";
  uniqueClassName: string;
}

const DEMO_CATS: TaxonomyType[] = [];

const SectionSliderNewCategories: FC<SectionSliderNewCategoriesProps> = ({
  heading = "Tiêu đề phần",
  subHeading = "Mô tả cho phần",
  className = "",
  itemClassName = "",
  categories = DEMO_CATS,
  itemPerRow = 5,
  categoryCardType = "card3",
  sliderStyle = "style1",
  uniqueClassName,
}) => {
  const UNIQUE_CLASS =
    "SectionSliderNewCategories__" + uniqueClassName + useNcId();

  let MY_GLIDEJS = useMemo(() => {
    // Note: Element might not exist yet during useMemo, we'll check in useEffect
    try {
      return new Glide(`.${UNIQUE_CLASS}`, {
        perView: itemPerRow,
        gap: 32,
        bound: true,
        breakpoints: {
          1280: {
            perView: itemPerRow - 1,
          },
          1024: {
            gap: 20,
            perView: itemPerRow - 1,
          },
          768: {
            gap: 20,
            perView: itemPerRow - 2,
          },
          640: {
            gap: 20,
            perView: itemPerRow - 3,
          },
          500: {
            gap: 20,
            perView: 1.3,
          },
        },
      });
    } catch (error) {
      return null;
    }
  }, [UNIQUE_CLASS, itemPerRow]);

  useEffect(() => {
    if (!MY_GLIDEJS) {
      return;
    }

    // Check if element exists before mounting
    const checkAndMount = () => {
      const element = document.querySelector(`.${UNIQUE_CLASS}`);
      if (!element) {
        return false;
      }

      // Check if element has valid dimensions
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return false;
      }

      if (!MY_GLIDEJS) {
        return false;
      }

      try {
        MY_GLIDEJS.mount();
        return true;
      } catch (error) {
        return false;
      }
    };

    // Try to mount immediately, if fails, retry after a delay
    let mounted = checkAndMount();
    let timer: NodeJS.Timeout | null = null;

    if (!mounted) {
      timer = setTimeout(() => {
        checkAndMount();
      }, 200);
    }

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (MY_GLIDEJS) {
        try {
          // Check if element still exists before unmounting
          const element = document.querySelector(`.${UNIQUE_CLASS}`);
          if (element && typeof (MY_GLIDEJS as any).unmount === 'function') {
            (MY_GLIDEJS as any).unmount();
          }
        } catch (error) {
        }
      }
    };
  }, [MY_GLIDEJS, UNIQUE_CLASS]);

  const renderCard = (item: TaxonomyType, index: number) => {
    switch (categoryCardType) {
      case "card3":
        return <CardCategory3 taxonomy={item} />;
      case "card4":
        return <CardCategory4 taxonomy={item} />;
      case "card5":
        return <CardCategory5 taxonomy={item} />;
      default:
        return <CardCategory3 taxonomy={item} />;
    }
  };

  return (
    <div className={`nc-SectionSliderNewCategories ${className}`}>
      <div className={`${UNIQUE_CLASS} flow-root`}>
        <Heading
          desc={subHeading}
          hasNextPrev={sliderStyle === "style1"}
          isCenter={sliderStyle === "style2"}
        >
          {heading}
        </Heading>
        <div className="glide__track" data-glide-el="track">
          <ul className="glide__slides">
            {categories.map((item, index) => (
              <li key={index} className={`glide__slide ${itemClassName}`}>
                {renderCard(item, index)}
              </li>
            ))}
          </ul>
        </div>

        {sliderStyle === "style2" && (
          <NextPrev className="justify-center mt-16" />
        )}
      </div>
    </div>
  );
};

export default SectionSliderNewCategories;
