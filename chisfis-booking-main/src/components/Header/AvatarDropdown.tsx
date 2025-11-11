import { Popover, Transition } from "@headlessui/react";
import {
  ChatBubbleBottomCenterTextIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon,
  LifebuoyIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "shared/Avatar/Avatar";
import { useAuth } from "contexts/AuthContext";

const solutionsFoot = [
  {
    name: "Help",
    href: "##",
    icon: LifebuoyIcon,
  },

  {
    name: "Logout",
    href: "##",
    icon: ArrowRightOnRectangleIcon,
  },
];

export default function AvatarDropdown() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getAccountLink = () => {
    if (isAdmin) {
      return "/admin?tab=profile";
    }
    // Check if user is Host
    if (user?.roleName === "Host") {
      return "/host-dashboard";
    }
    return "/account";
  };

  // If not authenticated, show login button
  if (!isAuthenticated || !user) {
    return (
      <Link
        to="/login"
        className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        Đăng nhập
      </Link>
    );
  }

  // Get menu items based on user role (only called when authenticated)
  const getMenuItems = () => {
    const items = [
      {
        name: "Profile",
        href: getAccountLink(),
        icon: UserIcon,
      },
    ];

    // Add role-specific items
    if (user?.roleName === "Host") {
      items.push({
        name: "Host Dashboard",
        href: "/host-dashboard",
        icon: DocumentTextIcon,
      });
    } else if (user?.roleName !== "Admin") {
      // Tenant or other roles
      items.push({
        name: "History Booking",
        href: "/my-bookings",
        icon: DocumentTextIcon,
      });
    }

    // Add common items for non-admin users
    if (!isAdmin) {
      items.push(
        {
          name: "Messages",
          href: "##",
          icon: ChatBubbleBottomCenterTextIcon,
        },
        {
          name: "Wishlists",
          href: "/account-savelists",
          icon: HeartIcon,
        }
      );
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
                          <p className="text-sm font-medium ">{item.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <hr className="h-[1px] border-t border-neutral-300 dark:border-neutral-700" />
                  <div className="relative grid gap-6 bg-white dark:bg-neutral-800 p-7">
                    {solutionsFoot.map((item, index) => (
                      item.name === "Logout" ? (
                        <button
                          key={index}
                          onClick={handleLogout}
                          className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 w-full text-left"
                        >
                          <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                            <item.icon aria-hidden="true" className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium ">{item.name}</p>
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
                            <p className="text-sm font-medium ">{item.name}</p>
                          </div>
                        </a>
                      )
                    ))}
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
