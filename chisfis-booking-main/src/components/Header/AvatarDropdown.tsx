import { Popover, Transition } from "@headlessui/react";
import {
  ArrowRightOnRectangleIcon,
  LifebuoyIcon,
  DocumentTextIcon,
  UserIcon,
  StarIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "shared/Avatar/Avatar";
import { useAuth } from "contexts/AuthContext";
import { useTranslation } from "i18n/LanguageContext";
import voucherAPI, { VoucherDTO } from "api/voucher";
import bookingAPI from "api/booking";

export default function AvatarDropdown() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [myVouchers, setMyVouchers] = useState<VoucherDTO[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

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
    if (isAdmin) {
      return "/admin?tab=profile";
    }
    return "/account"; // Host, Tenant, Marketer → đều vào /account
  };

  // Load vouchers của user (từ các condotel đã booking completed)
  useEffect(() => {
    const loadVouchers = async () => {
      if (!isAuthenticated || !user || user.roleName === "Admin" || user.roleName === "Host") {
        return; // Chỉ load cho Tenant
      }

      setLoadingVouchers(true);
      try {
        // Lấy danh sách booking đã completed
        const bookings = await bookingAPI.getMyBookings();
        const completedBookings = bookings.filter(b => b.status?.toLowerCase() === "completed");
        
        // Lấy condotelIds unique
        const condotelIdSet = new Set(completedBookings.map(b => b.condotelId));
        const condotelIds = Array.from(condotelIdSet);
        
        // Lấy vouchers từ tất cả condotel đã booking
        const allVouchers: VoucherDTO[] = [];
        for (const condotelId of condotelIds) {
          try {
            const vouchers = await voucherAPI.getByCondotel(condotelId);
            // Chỉ lấy voucher còn active và chưa hết hạn
            const activeVouchers = vouchers.filter(v => {
              if (!v.isActive) return false;
              const now = new Date();
              const endDate = new Date(v.endDate);
              return endDate >= now;
            });
            allVouchers.push(...activeVouchers);
          } catch (err) {
            console.error(`Error loading vouchers for condotel ${condotelId}:`, err);
          }
        }
        
        setMyVouchers(allVouchers);
      } catch (err) {
        console.error("Error loading vouchers:", err);
      } finally {
        setLoadingVouchers(false);
      }
    };

    loadVouchers();
  }, [isAuthenticated, user]);

  // Nếu chưa đăng nhập → hiện nút Login
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

  // === MENU ITEMS DỰA TRÊN ROLE ===
  const getMenuItems = () => {
    const items: Array<{
      name: string;
      href: string;
      icon: any;
    }> = [];

    // TẤT CẢ người dùng đều thấy "Thông tin tài khoản"
    items.push({
      name: t.account.profile,
      href: getAccountLink(),
      icon: UserIcon,
    });

    // Host: thêm Dashboard
    if (user?.roleName === "Host") {
      items.push({
        name: t.header.dashboard,
        href: "/host-dashboard",
        icon: DocumentTextIcon,
      });
    }

    // Tenant & các role khác (không phải Admin/Host): chỉ hiện My Bookings
    if (user?.roleName !== "Admin" && user?.roleName !== "Host") {
      items.push({
        name: t.header.myBookings,
        href: "/my-bookings",
        icon: DocumentTextIcon,
      });
    }

    // Tất cả (trừ Admin) đều thấy My Reviews
    if (!isAdmin) {
      items.push({
        name: t.header.myReviews,
        href: "/my-reviews",
        icon: StarIcon,
      });
    }

    // Tenant: thêm Voucher của tôi
    if (user?.roleName !== "Admin" && user?.roleName !== "Host") {
      items.push({
        name: "Voucher của tôi",
        href: "#vouchers",
        icon: TicketIcon,
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
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            >
              <Avatar
                sizeClass="w-8 h-8 sm:w-9 sm:h-9"
                imgUrl={user?.imageUrl}
                userName={user?.fullName || "User"}
              />
              <span className="hidden sm:block text-sm font-medium text-neutral-700 dark:text-neutral-100">
                {user?.fullName || "User"}
              </span>
            </Popover.Button>

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
                  {/* === MENU CHÍNH === */}
                  <div className="relative grid gap-6 bg-white dark:bg-neutral-800 p-7">
                    {solutions.map((item, index) => {
                      // Nếu là "Voucher của tôi", hiển thị với badge số lượng
                      if (item.href === "#vouchers") {
                        return (
                          <Popover.Button
                            key={index}
                            as="div"
                            className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 cursor-pointer"
                          >
                            <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                              <item.icon aria-hidden="true" className="w-6 h-6" />
                            </div>
                            <div className="ml-4 flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              {loadingVouchers ? (
                                <p className="text-xs text-neutral-400">Đang tải...</p>
                              ) : myVouchers.length > 0 ? (
                                <p className="text-xs text-primary-600 dark:text-primary-400">
                                  {myVouchers.length} voucher có sẵn
                                </p>
                              ) : (
                                <p className="text-xs text-neutral-400">Chưa có voucher</p>
                              )}
                            </div>
                          </Popover.Button>
                        );
                      }
                      
                      return (
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
                      );
                    })}
                  </div>

                  {/* === VOUCHER SECTION (nếu có voucher) === */}
                  {!isAdmin && user?.roleName !== "Host" && myVouchers.length > 0 && (
                    <>
                      <hr className="h-[1px] border-t border-neutral-300 dark:border-neutral-700" />
                      <div className="relative bg-white dark:bg-neutral-800 p-7 max-h-60 overflow-y-auto">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                          Voucher của tôi ({myVouchers.length})
                        </h3>
                        <div className="space-y-2">
                          {myVouchers.slice(0, 5).map((voucher) => (
                            <div
                              key={voucher.voucherId}
                              className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                  {voucher.code}
                                </p>
                                {voucher.discountPercentage ? (
                                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                    -{voucher.discountPercentage}%
                                  </span>
                                ) : voucher.discountAmount ? (
                                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                    -{voucher.discountAmount.toLocaleString()}đ
                                  </span>
                                ) : null}
                              </div>
                              {voucher.description && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
                                  {voucher.description}
                                </p>
                              )}
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                                HSD: {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          ))}
                          {myVouchers.length > 5 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-2">
                              +{myVouchers.length - 5} voucher khác
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <hr className="h-[1px] border-t border-neutral-300 dark:border-neutral-700" />

                  {/* === FOOTER: Help + Logout === */}
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