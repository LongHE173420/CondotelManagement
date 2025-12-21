import Glide from "@glidejs/glide";
import useNcId from "hooks/useNcId";
import React, { FC, useEffect, useMemo } from "react";
import NcImage from "shared/NcImage/NcImage";
import NextPrev from "shared/NextPrev/NextPrev";
import { Link } from "react-router-dom";

export interface GallerySliderProps {
  className?: string;
  galleryImgs: string[];
  ratioClass?: string;
  uniqueID: string;
  href?: string;
}

const GallerySlider: FC<GallerySliderProps> = ({
  className = "",
  galleryImgs,
  ratioClass = "aspect-w-4 aspect-h-3",
  uniqueID = "uniqueID",
  href = "/listing-stay-detail",
}) => {
  const UNIQUE_CLASS = `gallerySlider__${uniqueID}` + useNcId();

  let MY_GLIDEJS = useMemo(() => {
    // Note: Element might not exist yet during useMemo, we'll check in useEffect
    try {
      return new Glide(`.${UNIQUE_CLASS}`, {
        perView: 1,
        gap: 0,
        keyboard: false,
      });
    } catch (error) {
      return null;
    }
  }, [UNIQUE_CLASS]);

  useEffect(() => {
    if (!MY_GLIDEJS) {
      return;
    }

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

    // Try to mount after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      checkAndMount();
    }, 50);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (MY_GLIDEJS) {
        try {
          const element = document.querySelector(`.${UNIQUE_CLASS}`);
          if (element && typeof (MY_GLIDEJS as any).unmount === 'function') {
            (MY_GLIDEJS as any).unmount();
          }
        } catch (error) {
        }
      }
    };
  }, [MY_GLIDEJS, UNIQUE_CLASS, galleryImgs]);

  const renderDots = () => {
    return (
      <div
        className="glide__bullets flex items-center justify-center absolute bottom-2 left-1/2 transform -translate-x-1/2 space-x-1.5"
        data-glide-el="controls[nav]"
      >
        {galleryImgs.map((_, i) => (
          <button
            className="glide__bullet w-1.5 h-1.5 rounded-full bg-neutral-300"
            key={i}
            data-glide-dir={`=${i}`}
          />
        ))}
      </div>
    );
  };

  const renderSliderGallery = () => {
    return (
      <div className={`${UNIQUE_CLASS} relative group overflow-hidden`}>
        <div className="glide__track" data-glide-el="track">
          <ul className="glide__slides">
            {galleryImgs.map((item, index) => (
              <li key={index} className="glide__slide">
                <Link to={href} className={`block ${ratioClass}`}>
                  <NcImage src={item} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* DOTS */}
        <div className="absolute -bottom-4 inset-x-0 h-10 bg-gradient-to-t from-neutral-900"></div>
        {renderDots()}

        {/* NAV */}
        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex top-1/2 transform -translate-y-1/2 inset-x-2 justify-between">
          <NextPrev className="w-full justify-between" btnClassName="w-8 h-8" />
        </div>
      </div>
    );
  };

  return (
    <div className={`nc-GallerySlider ${className}`} data-nc-id="GallerySlider">
      {renderSliderGallery()}
    </div>
  );
};

export default GallerySlider;
