import { Tab } from "@headlessui/react";
import CommentListing from "components/CommentListing/CommentListing";
import StartRating from "components/StartRating/StartRating";
import CondotelCard from "components/CondotelCard/CondotelCard";
import React, { FC, Fragment, useState, useEffect, useMemo } from "react";
import Avatar from "shared/Avatar/Avatar";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import SocialsList from "shared/SocialsList/SocialsList";
import { Helmet } from "react-helmet";
import condotelAPI, { CondotelDTO } from "api/condotel";
import { useAuth } from "contexts/AuthContext";
import { useTranslation } from "i18n/LanguageContext";
import { useParams, useNavigate } from "react-router-dom";
import { authAPI, HostPublicProfile } from "api/auth";
import { hostAPI, TopHostDTO } from "api/host";

export interface AuthorPageProps {
  className?: string;
}

const AuthorPage: FC<AuthorPageProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const { hostId } = useParams<{ hostId?: string }>();
  const navigate = useNavigate();
  let [categories] = useState(["Condotels"]);
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [isLoadingCondotels, setIsLoadingCondotels] = useState(false);
  const [showAllCondotels, setShowAllCondotels] = useState(false);
  const { user } = useAuth();
  const [hostInfo, setHostInfo] = useState<HostPublicProfile | null>(null);
  const [topHostInfo, setTopHostInfo] = useState<TopHostDTO | null>(null);
  const [loadingHost, setLoadingHost] = useState(true);

  // Check if accessing own profile without hostId parameter
  useEffect(() => {
    // If accessing /author without hostId, only allow Host role
    if (!hostId && user?.roleName !== "Host") {
      navigate("/");
    }
  }, [hostId, user, navigate]);

  // Derived review stats from condotel list (fallback when backend doesn't supply totals)
  const derivedReviewStats = useMemo(() => {
    const totalReviews = condotels.reduce((sum, c) => sum + (c.reviewCount || 0), 0);
    const totalWeighted =
      condotels.reduce((sum, c) => sum + (c.reviewRate || 0) * (c.reviewCount || 0), 0);
    const average =
      totalReviews > 0 ? totalWeighted / totalReviews : undefined;
    return { totalReviews, average };
  }, [condotels]);

  useEffect(() => {
    const fetchHostInfo = async () => {
      if (!hostId) {
        setLoadingHost(false);
        return;
      }

      try {
        setLoadingHost(true);
        const hostIdNum = Number(hostId);
        
        // Try to get from top hosts first (if available)
        let foundTopHost: TopHostDTO | null = null;
        try {
          const topHosts = await hostAPI.getTopRated(100);
          foundTopHost = topHosts.find(h => h.hostId === hostIdNum) || null;
          if (foundTopHost) {
            setTopHostInfo(foundTopHost);
          }
        } catch (err) {
          // Failed to fetch from top hosts
        }

        // Get host public profile

        try {
          const profile = await authAPI.getHostPublicProfile(hostIdNum);
          setHostInfo(profile);
        } catch (err: any) {
          // If profile not found, use top host info if available
          if (foundTopHost) {
            setHostInfo({
              hostId: foundTopHost.hostId,
              fullName: foundTopHost.fullName,
              imageUrl: foundTopHost.avatarUrl,
              phone: undefined,
              isVerified: false,
              packageName: undefined,
              priorityLevel: 0,
              displayColorTheme: "default",
            });
          }
        }
      } catch (error) {
      } finally {
        setLoadingHost(false);
      }
    };

    fetchHostInfo();
  }, [hostId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchCondotels = async () => {
      try {
        setIsLoadingCondotels(true);
        if (hostId) {
          // Fetch condotels for this specific host
          const hostIdNum = Number(hostId);
          const data = await condotelAPI.getCondotelsByHostId(hostIdNum);
          setCondotels(data);
        } else {
          // If no hostId, fetch all condotels (for current user)
          const data = await condotelAPI.getAll();
          setCondotels(data);
        }
      } catch (error) {
        // Set empty array on error so UI still renders
        setCondotels([]);
      } finally {
        setIsLoadingCondotels(false);
      }
    };

    fetchCondotels();
  }, [hostId]);

  const renderSidebar = () => {
    // Use host info if available, otherwise use current user
    const displayName = hostInfo?.fullName || topHostInfo?.fullName || user?.fullName || "Host";
    const displayImage = hostInfo?.imageUrl || topHostInfo?.avatarUrl || user?.imageUrl;
    const displayPhone = hostInfo?.phone || user?.phone;
    const isVerified = hostInfo?.isVerified || false;
    const totalCondotels = topHostInfo?.totalCondotels || condotels.length;
    const totalReviews = topHostInfo?.totalReviews ?? derivedReviewStats.totalReviews;
    const averageRating =
      totalReviews && totalReviews > 0
        ? (topHostInfo?.averageRating ?? derivedReviewStats.average ?? 0)
        : undefined;

    return (
      <div className=" w-full flex flex-col items-center text-center sm:rounded-2xl sm:border border-neutral-200 dark:border-neutral-700 space-y-6 sm:space-y-7 px-0 sm:p-6 xl:p-8">
        <Avatar
          hasChecked={isVerified}
          hasCheckedClass="w-6 h-6 -top-0.5 right-2"
          sizeClass="w-28 h-28"
          imgUrl={displayImage}
        />

        {/* ---- */}
        <div className="space-y-3 text-center flex flex-col items-center">
          <h2 className="text-3xl font-semibold">{displayName}</h2>
          <div className="flex items-center gap-2">
            <StartRating 
              className="!text-base" 
              point={averageRating || 0} 
              reviewCount={totalReviews || 0} 
            />
          </div>
        </div>

        {/* ---- */}
        {hostInfo?.packageName && (
          <p className="text-neutral-500 dark:text-neutral-400">
            {hostInfo.packageName}
          </p>
        )}
        {/* ---- */}
        <SocialsList
          className="!space-x-3"
          itemClass="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xl"
        />
        {/* ---- */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 w-14"></div>
        {/* ---- */}
        <div className="space-y-2">
          {displayPhone && (
            <div className="text-neutral-800 dark:text-neutral-100 text-sm">
              <b>Phone:</b> {displayPhone}
            </div>
          )}
          {totalCondotels > 0 && (
            <div className="text-neutral-800 dark:text-neutral-100 text-sm">
              <b>Số căn hộ:</b> {totalCondotels}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSection1 = () => {
    const displayName = hostInfo?.fullName || topHostInfo?.fullName || user?.fullName || "Host";
    
    return (
      <div className="listingSection__wrap">
        <div>
          <h2 className="text-2xl font-semibold">Danh sách căn hộ của {displayName}</h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            {condotels.length > 0 ? `${condotels.length} căn hộ đã đăng.` : "Chưa có căn hộ nào."}
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        <div>
          <Tab.Group>
            <Tab.List className="flex space-x-1 overflow-x-auto">
              {categories.map((item) => (
                <Tab key={item} as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`flex-shrink-0 block !leading-none font-medium px-5 py-2.5 text-sm sm:text-base sm:px-6 sm:py-3 capitalize rounded-full focus:outline-none ${
                        selected
                          ? "bg-secondary-900 text-secondary-50 "
                          : "text-neutral-500 dark:text-neutral-400 dark:hover:text-neutral-100 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      } `}
                    >
                      {item}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel className="">
                {isLoadingCondotels ? (
                  <div className="mt-8 flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  </div>
                ) : condotels.length > 0 ? (
                  <>
                    <div className="mt-8 grid grid-cols-1 gap-6 md:gap-7 sm:grid-cols-2">
                      {(showAllCondotels ? condotels : condotels.slice(0, 4)).map((condotel) => (
                        <CondotelCard key={condotel.condotelId} data={condotel} />
                      ))}
                    </div>
                    {condotels.length > 4 && (
                      <div className="flex mt-11 justify-center items-center">
                        <ButtonSecondary 
                          onClick={() => {
                            // Always navigate to listing page to show all condotels
                            window.location.href = "/listing-stay";
                          }}
                        >
                          {t.condotel.viewMore || "Xem thêm condotel"}
                        </ButtonSecondary>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-8 text-center py-12">
                    <p className="text-neutral-500 dark:text-neutral-400">
                      No condotels available yet.
                    </p>
                  </div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    );
  };

  const renderSection2 = () => {
    const totalCondotels = topHostInfo?.totalCondotels || condotels.length;
    const totalReviews = topHostInfo?.totalReviews ?? derivedReviewStats.totalReviews;
    const averageRating =
      totalReviews > 0 ? (topHostInfo?.averageRating ?? derivedReviewStats.average ?? 0) : 0;

    return (
      <div className="listingSection__wrap">
        {/* HEADING */}
        <h2 className="text-2xl font-semibold">Thống kê căn hộ</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Card 1: Total Condotels */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-md p-6 border border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Tổng căn hộ</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                  {totalCondotels}
                </p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2: Average Rating */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-md p-6 border border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Đánh giá trung bình</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                  {totalReviews > 0 ? averageRating.toFixed(1) : "N/A"}
                </p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <svg className="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3: Total Reviews */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-md p-6 border border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Tổng đánh giá</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                  {totalReviews}
                </p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl p-6 border border-blue-100 dark:border-neutral-600">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Thông tin về Host
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-600 dark:text-neutral-400">Trạng thái xác thực:</span>
              <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">
                {hostInfo?.isVerified ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Đã xác thực
                  </span>
                ) : (
                  <span className="text-neutral-500">Chưa xác thực</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-neutral-600 dark:text-neutral-400">Gói Host:</span>
              <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">
                {hostInfo?.packageName || "Gói cơ bản"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loadingHost) {
    return (
      <div className="container mt-12 mb-24 lg:mb-32 flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`nc-AuthorPage ${className}`} data-nc-id="AuthorPage">
      <Helmet>
        <title>{hostInfo?.fullName || topHostInfo?.fullName || "Host"} || Fiscondotel</title>
      </Helmet>
      <main className="container mt-12 mb-24 lg:mb-32 flex flex-col lg:flex-row">
        <div className="block flex-grow mb-24 lg:mb-0">
          <div className="lg:sticky lg:top-24">{renderSidebar()}</div>
        </div>
        <div className="w-full lg:w-3/5 xl:w-2/3 space-y-8 lg:space-y-10 lg:pl-10 flex-shrink-0">
          {renderSection1()}
          {renderSection2()}
        </div>
      </main>
    </div>
  );
};

export default AuthorPage;
