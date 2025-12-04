import { Popover, Transition } from "@headlessui/react";
import {
  ArrowRightOnRectangleIcon,
  LifebuoyIcon,
  DocumentTextIcon,
  UserIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import Avatar from "shared/Avatar/Avatar";
import { useAuth } from "contexts/AuthContext";
import { useTranslation } from "i18n/LanguageContext";

export default function AvatarDropdown() {
  const { user, logout, isAdmin, isAuthenticated, hostPackage } = useAuth(); // ← THÊM hostPackage
  const { t } = useTranslation();

  const isVerified = hostPackage?.isVerifiedBadgeEnabled === true; // ← XÁC ĐỊNH VIP

  const solutionsFoot = [
    {
      name: t.header.help,
      href: "##",
      icon: LifebuoyIcon,
      isLogout: false,
    },
    {
      name: t.header.logout,
      href: "##",
      icon: ArrowRightOnRectangleIcon,
      isLogout: true,
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const getAccountLink = () => {
    if (isAdmin) return "/admin?tab=profile";
    return "/account";
  };

  if (!isAuthenticated || !user) {
    return (
      <Link
        to="/login"
        className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        {t.header.login}
      </Link>
    );
  }

  const getMenuItems = () => {
    const items: Array<{ name: string; href: string; icon: any }> = [];

    items.push({
      name: t.account.profile,
      href: getAccountLink(),
      icon: UserIcon,
    });

    if (user?.roleName === "Host") {
      items.push({
        name: t.header.dashboard,
        href: "/host-dashboard",
        icon: DocumentTextIcon,
      });
    }

    if (user?.roleName !== "Admin" && user?.roleName !== "Host") {
      items.push({
        name: t.header.myBookings,
        href: "/my-bookings",
        icon: DocumentTextIcon,
      });
    }

    if (!isAdmin) {
      items.push({
        name: t.header.myReviews,
        href: "/my-reviews",
        icon: StarIcon,
      });
    }

    return items;
  };

  const solutions = getMenuItems();

  return (
    <div className="AvatarDropdown">
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={`inline-flex items-center space-x-3 px-3 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            >
              {/* === AVATAR + TÍCH XANH VIP === */}
              <div className="relative">
                <Avatar
                  sizeClass="w-8 h-8 sm:w-9 sm:h-9"
                  imgUrl={user?.imageUrl}
                  userName={user?.fullName || "User"}
                />

                {/* TÍCH XANH NHỎ XINH – CHỈ HIỆN KHI VIP */}
                {isVerified && (
                  <div className="absolute -top-1 -right-1 animate-pulse">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* TÊN + BADGE VIP NHỎ */}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-100">
                  {user?.fullName || "User"}
                </span>
                {isVerified && (
                  <span className="text-xs text-blue-600 dark:text-cyan-400 font-medium mt-0.5">
                    Chủ nhà VIP
                  </span>
                )}
              </div>
            </Popover.Button>

            {/* === DROPDOWN MENU === */}
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-10 w-screen max-w-[260px] px-4 mt-4 -right-10 sm:right-0 sm:px-0">
                <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="relative grid gap-6 bg-white dark:bg-neutral-800 p-7">
                    {solutions.map((item, index) => (
                      <Link
                        key={index}
                        to={item.href}
                        className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                      >
                        <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                          <item.icon aria-hidden="true" className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium">{item.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <hr className="h-[1px] border-t border-neutral-300 dark:border-neutral-700" />

                  <div className="relative grid gap-6 bg-white dark:bg-neutral-800 p-7">
                    {solutionsFoot.map((item, index) =>
                      item.isLogout ? (
                        <button
                          key={index}
                          onClick={handleLogout}
                          className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 w-full text-left"
                        >
                          <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                            <item.icon aria-hidden="true" className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium">{item.name}</p>
                          </div>
                        </button>
                      ) : (
                        <a
                          key={index}
                          href={item.href}
                          className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                        >
                          <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                            <item.icon aria-hidden="true" className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium">{item.name}</p>
                          </div>
                        </a>
                      )
                    )}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}