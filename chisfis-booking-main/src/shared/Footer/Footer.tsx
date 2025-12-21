import Logo from "shared/Logo/Logo";
import SocialsList1 from "shared/SocialsList1/SocialsList1";
import { CustomLink } from "data/types";
import React from "react";

export interface WidgetFooterMenu {
  id: string;
  title: string;
  menus: CustomLink[];
}

const widgetMenus: WidgetFooterMenu[] = [
  {
    id: "1",
    title: "Khám phá",
    menus: [
      { href: "/listing-stay", label: "Tìm căn hộ" },
      { href: "/listing-experiences", label: "Trải nghiệm" },
      { href: "/about", label: "Về chúng tôi" },
      { href: "/contact", label: "Liên hệ" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    id: "2",
    title: "Hỗ trợ",
    menus: [
      { href: "/contact", label: "Trung tâm trợ giúp" },
      { href: "/refund-policy", label: "Chính sách hoàn tiền" },
      { href: "#", label: "Câu hỏi thường gặp" },
      { href: "#", label: "An toàn & Bảo mật" },
      { href: "/chat", label: "Hỗ trợ trực tuyến" },
    ],
  },
  {
    id: "3",
    title: "Dành cho Host",
    menus: [
      { href: "/become-a-host", label: "Trở thành Host" },
      { href: "/host-dashboard", label: "Bảng điều khiển" },
      { href: "/pricing", label: "Bảng giá" },
      { href: "#", label: "Hướng dẫn Host" },
      { href: "#", label: "Tài nguyên" },
    ],
  },
  {
    id: "4",
    title: "Pháp lý",
    menus: [
      { href: "/terms", label: "Điều khoản sử dụng" },
      { href: "/privacy", label: "Chính sách bảo mật" },
      { href: "/refund-policy", label: "Chính sách hoàn tiền" },
      { href: "/regulations", label: "Quy định cộng đồng" },
    ],
  },
];

const Footer: React.FC = () => {
  const renderWidgetMenuItem = (menu: WidgetFooterMenu, index: number) => {
    return (
      <div key={index} className="text-sm">
        <h2 className="font-semibold text-neutral-700 dark:text-neutral-200">
          {menu.title}
        </h2>
        <ul className="mt-5 space-y-4">
          {menu.menus.map((item, index) => (
            <li key={index}>
              <a
                key={index}
                className="text-neutral-6000 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                href={item.href}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="nc-Footer relative py-24 lg:py-28 border-t border-neutral-200 dark:border-neutral-700">
      <div className="container grid grid-cols-2 gap-y-10 gap-x-5 sm:gap-x-8 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-10 ">
        <div className="grid grid-cols-4 gap-5 col-span-2 md:col-span-4 lg:md:col-span-1 lg:flex lg:flex-col">
          <div className="col-span-2 md:col-span-1">
            <Logo />
          </div>
          <div className="col-span-2 flex items-center md:col-span-3">
            <SocialsList1 className="flex items-center space-x-3 lg:space-x-0 lg:flex-col lg:space-y-2.5 lg:items-start" />
          </div>
        </div>
        {widgetMenus.map(renderWidgetMenuItem)}
      </div>
      
      {/* Copyright Section */}
      <div className="container border-t border-neutral-200 dark:border-neutral-700 mt-12 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-neutral-600 dark:text-neutral-400">
          <div className="mb-4 md:mb-0">
            <p>© {new Date().getFullYear()} Fiscondotel. Tất cả quyền được bảo lưu.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/contact" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Liên hệ
            </a>
            <span className="text-neutral-300 dark:text-neutral-600">|</span>
            <a href="/terms" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Điều khoản
            </a>
            <span className="text-neutral-300 dark:text-neutral-600">|</span>
            <a href="/privacy" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Bảo mật
            </a>
            <span className="text-neutral-300 dark:text-neutral-600">|</span>
            <a href="/refund-policy" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Hoàn tiền
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
