import { ComponentType } from "react";

export interface LocationStates {
  "/"?: {};
  "/#"?: {};
  "/home-2"?: {};
  "/home-3"?: {};
  "/home-1-header-2"?: {};
  //
  "/listing-stay"?: {};
  "/listing-stay-map"?: {};
  "/listing-stay-detail"?: {};
  "/listing-stay-detail/:id"?: {};
  //
  "/listing-real-estate"?: {};
  "/listing-real-estate-map"?: {};
  "/listing-real-estate-detail"?: {};
  //
  "/checkout"?: {};
  "/pay-done"?: {};
  "/payment/cancel"?: {};
  //
  "/account"?: {};
  "/account-savelists"?: {};
  "/account-password"?: {};
  "/account-billing"?: {};
  "/account-rewards"?: {};
  //
  "/blog"?: {};
  "/blog-single"?: {};
  "/blog-single/:slug"?: {};
  //
  "/add-listing-1"?: {};
  "/add-listing-2"?: {};
  "/add-listing-3"?: {};
  "/add-listing-4"?: {};
  "/add-listing-5"?: {};
  "/add-listing-6"?: {};
  "/add-listing-7"?: {};
  "/add-listing-8"?: {};
  "/add-listing-9"?: {};
  "/add-listing-10"?: {};
  //
  "/author"?: {};
  "/author/:hostId"?: {};
  "/search"?: {};
  "/about"?: {};
  "/contact"?: {};
  "/login"?: {};
  "/signup"?: {};
  "/forgot-pass"?: {};
  "/account-list"?: {};
  "/account-detail/:id"?: {};
  "/add-account"?: {};
  "/my-bookings"?: {};
  "/booking-history"?: {};
  "/booking-history/:id"?: {};
  "/request-refund/:id"?: {};
  "/refund-requests"?: {};
  "/write-review/:id"?: {};
  "/my-reviews"?: {};
  "/manage-blog"?: {};
  "/manage-blog/add"?: {};
  "/manage-blog/edit/:id"?: {};
  "/manage-blog/categories"?: {};
  "/manage-vouchers"?: {};
  "/manage-vouchers/add"?: {};
  "/manage-vouchers/edit/:id"?: {};
  "/manage-locations"?: {};
  "/manage-locations/add"?: {};
  "/manage-locations/edit/:id"?: {};
  "/my-vouchers"?: {};
  "/page404"?: {};
  "/subscription"?: {};
  "/host-dashboard"?: {};
  "/become-a-host"?: {};
  "/admin/refunds"?: {};
  "/refund-policy"?: {};
  "/admin/payouts"?: {};
  "/chat"?: {};
  "/terms"?: {};
  "/privacy"?: {};
  "/regulations"?: {};
  "/admin/blog-requests": {};        
  "/host-dashboard/blog/create-blog"?: {};   // Đường dẫn tạo mới
  "/host-dashboard/blog/edit/:id"?: {};
}

export type PathName = keyof LocationStates;

export interface Page {
  path: PathName;
  exact?: boolean;
  component: ComponentType<Object>;
}
