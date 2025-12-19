import CardHostCondotel from "components/CardHostCondotel/CardHostCondotel";
import Heading from "components/Heading/Heading";
import { DEMO_AUTHORS } from "data/authors";
import { AuthorType } from "data/types";
import React, { FC, useEffect, useState } from "react";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import hostAPI, { TopHostDTO } from "api/host";

export interface SectionTopHostCondotelProps {
  className?: string;
  authors?: AuthorType[];
  gridClassName?: string;
  loadFromAPI?: boolean;
}

const DEMO_DATA = DEMO_AUTHORS.filter((_, i) => i < 10);

const SectionTopHostCondotel: FC<SectionTopHostCondotelProps> = ({
  className = "",
  authors,
  gridClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  loadFromAPI = true,
}) => {
  const [displayAuthors, setDisplayAuthors] = useState<AuthorType[]>(authors || []);
  const [isLoading, setIsLoading] = useState(loadFromAPI && !authors);

  // Load top hosts from API if no authors provided and loadFromAPI is true
  useEffect(() => {
    if (!loadFromAPI || authors) {
      return;
    }

    const loadTopHosts = async () => {
      try {
        setIsLoading(true);
        const topHostsData = await hostAPI.getTopRated(10);

        if (!topHostsData || !Array.isArray(topHostsData) || topHostsData.length === 0) {
          setDisplayAuthors(DEMO_DATA);
          return;
        }

        // Map TopHostDTO to AuthorType
        const mappedHosts: AuthorType[] = topHostsData.map((host: TopHostDTO) => {
          const nameParts = (host.fullName || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const displayName = host.fullName || 'Host';

          return {
            id: host.hostId,
            firstName: firstName,
            lastName: lastName,
            displayName: displayName,
            avatar: host.avatarUrl || '',
            count: host.totalCondotels || 0,
            desc: `${host.totalReviews || 0} đánh giá • ${host.totalCondotels || 0} condotel`,
            jobName: host.companyName || 'Host',
            href: `/author/${host.hostId}`,
            starRating: host.averageRating || 0,
          };
        });

        setDisplayAuthors(mappedHosts);
      } catch (err) {
        console.error("Error loading top hosts:", err);
        setDisplayAuthors(DEMO_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    loadTopHosts();
  }, [loadFromAPI, authors]);

  // Use provided authors or fallback to loaded data
  const finalAuthors = authors && authors.length > 0 ? authors : displayAuthors;
  
  React.useEffect(() => {

  }, [authors, finalAuthors]);

  return (
    <div
      className={`nc-SectionTopHostCondotel relative ${className}`}
      data-nc-id="SectionTopHostCondotel"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-3xl -z-10"></div>

      {/* Header Section */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-0">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              🏆 TOP HOST CONDOTEL
            </span>
          </div>
          
          <Heading 
            isCenter
            desc="Những Host xuất sắc nhất được đánh giá cao bởi khách hàng - Sở hữu & quản lý condotels chất lượng"
          >
            Top 10 Host Condotel Xuất Sắc Nhất
          </Heading>
        </div>

        {/* Content Grid */}
        {finalAuthors.length === 0 || isLoading ? (
          <div className="text-center py-20">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-neutral-400 dark:text-neutral-600 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">
              {isLoading ? "Đang tải danh sách Host xuất sắc..." : "Chưa có Host nào"}
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 md:gap-8 ${gridClassName}`}>
            {finalAuthors.map((author, index) => (
              <CardHostCondotel
                key={author.id}
                author={author}
                index={index < 3 ? index + 1 : undefined}
              />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 px-6 py-10 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Tìm Condotel Chất Lượng Cao
              </h3>
              <p className="text-blue-100">
                Khám phá các căn condotel được quản lý bởi những Host được đánh giá cao nhất
              </p>
            </div>
            <div className="flex items-center gap-3 whitespace-nowrap">
              <ButtonPrimary 
                href="/listing-stay"
                className="!bg-white !text-blue-600 hover:!bg-neutral-100"
              >
                <span className="flex items-center gap-2">
                  Xem tất cả Condotel
                  <ArrowRightIcon className="w-4 h-4" />
                </span>
              </ButtonPrimary>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <ButtonSecondary href="/become-a-host" className="!py-3">
            💼 Trở Thành Host Condotel
          </ButtonSecondary>
          <ButtonSecondary href="/contact" className="!py-3">
            📞 Liên Hệ Hỗ Trợ
          </ButtonSecondary>
        </div>
      </div>
    </div>
  );
};

export default SectionTopHostCondotel;
