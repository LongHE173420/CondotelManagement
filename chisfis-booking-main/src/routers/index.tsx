import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Page } from "./types";
import ScrollToTop from "./ScrollToTop";
import Footer from "shared/Footer/Footer";
import PageHome from "containers/PageHome/PageHome";
import Page404 from "containers/Page404/Page404";
import ListingStayPage from "containers/ListingStayPage/ListingStayPage";
import ListingStayMapPage from "containers/ListingStayPage/ListingStayMapPage";
import ListingStayDetailPage from "containers/ListingDetailPage/ListingStayDetailPage";
import CheckOutPage from "containers/CheckOutPage/CheckOutPage";
import PayPage from "containers/PayPage/PayPage";
import PaymentCancelPage from "containers/PaymentCancelPage/PaymentCancelPage";
import AuthorPage from "containers/AuthorPage/AuthorPage";
import AccountPage from "containers/AccountPage/AccountPage";
import AccountPass from "containers/AccountPage/AccountPass";
import AccountSavelists from "containers/AccountPage/AccountSavelists";
import AccountBilling from "containers/AccountPage/AccountBilling";
import AccountRewards from "containers/AccountPage/AccountRewards";
import AdminPage from "containers/AdminPage/AdminPage";
import AdminLayout from "containers/AdminPage/AdminLayout";
import HostLayout from "containers/HostCondotelDashboard/HostLayout";
import ProtectedRoute from "components/ProtectedRoute/ProtectedRoute";
import PageContact from "containers/PageContact/PageContact";
import PageAbout from "containers/PageAbout/PageAbout";
import PageSignUp from "containers/PageSignUp/PageSignUp";
import PageLogin from "containers/PageLogin/PageLogin";
import PageForgotPassword from "containers/PageForgotPassword/PageForgotPassword";
import PageAccountList from "containers/PageAccountList/PageAccountList";
import PageAccountDetail from "containers/PageAccountDetail/PageAccountDetail";
import PageAddAccount from "containers/PageAddAccount/PageAddAccount";
import PageSubcription from "containers/PageSubcription/PageSubcription";
import BlogPage from "containers/BlogPage/BlogPage";
import BlogSingle from "containers/BlogPage/BlogSingle";
import PageAddListingSimple from "containers/PageAddListing1/PageAddListingSimple";
import AddListingLayout from "containers/PageAddListing1/AddListingLayout";
import PageHome2 from "containers/PageHome/PageHome2";
import ListingRealEstateMapPage from "containers/ListingRealEstatePage/ListingRealEstateMapPage";
import ListingRealEstatePage from "containers/ListingRealEstatePage/ListingRealEstatePage";
import SiteHeader from "containers/SiteHeader";
import FooterNav from "components/FooterNav";
import useWindowSize from "hooks/useWindowResize";
import PageHome3 from "containers/PageHome/PageHome3";
import PageTenantBookings from "containers/PageTenantBookingList/PageTenantBookingList";
import HostCondotelDashboard from "containers/HostCondotelDashboard";
import PageEditCondotel from "containers/PageEditCondotel/PageEditCondotel";
import PageBookingHistory from "containers/PageBookingHistory/PageBookingHistory";
import PageBookingHistoryDetail from "containers/PageBookingHistory/PageBookingHistoryDetail";
import PageRequestRefund from "containers/PageRequestRefund/PageRequestRefund";
import PageRefundRequests from "containers/PageRefundRequests/PageRefundRequests";
import PageWriteReview from "containers/PageWriteReview/PageWriteReview";
import PageMyReviews from "containers/PageMyReviews/PageMyReviews";
import PageBlogList from "containers/PageManageBlog/PageBlogList";
import PageBlogAdd from "containers/PageManageBlog/PageBlogAdd";
import PageBlogEdit from "containers/PageManageBlog/PageBlogEdit";
import PageBlogCategory from "containers/PageManageBlog/PageBlogCategory";
import PageVoucherList from "containers/PageManageVouchers/PageVoucherList";
import PageVoucherAdd from "containers/PageManageVouchers/PageVoucherAdd";
import PageVoucherEdit from "containers/PageManageVouchers/PageVoucherEdit";
import PageMyVouchers from "containers/PageMyVouchers/PageMyVouchers";
import PageLocationList from "containers/PageManageLocations/PageLocationList";
import PageLocationAdd from "containers/PageManageLocations/PageLocationAdd";
import PageLocationEdit from "containers/PageManageLocations/PageLocationEdit";
import BecomeAHostPage from "containers/BecomeAHostPage/BecomeAHostPage";
import PricingPage from "containers/PagePricing/PricingPage";
import PaymentSuccess from "containers/PagePaymentSuccess/PaymentSuccess";
import ChatButtonFloating from "components/ChatButtonFloating/ChatButtonFloating";

// --- Imports được thêm từ code cũ (Refund & Payout) ---
import PageAdminRefund from "containers/PageAdminRefund/PageAdminRefund";
import PageRefundPolicy from "containers/PageRefundPolicy/PageRefundPolicy";
import PageAdminPayout from "containers/PageAdminOwnerManagement/PageAdminPayout";
import PageChat from "containers/ChatPage/PageChat";
import PageTerms from "containers/PageTerms/PageTerms";
import PagePrivacy from "containers/PagePrivacy/PagePrivacy";
import PageRegulations from "containers/PageRegulations/PageRegulations";
import AdminBlogRequests from "containers/AdminPage/AdminBlogRequests";
import HostCreateBlog from "containers/HostCreateBlogPage/HostCreateBlog";

export const pages: Page[] = [
  { path: "/", exact: true, component: PageHome },
  { path: "/#", exact: true, component: PageHome },
  { path: "/home-1-header-2", exact: true, component: PageHome },
  { path: "/home-2", component: PageHome2 },
  { path: "/home-3", component: PageHome3 },
  //
  { path: "/listing-real-estate-map", component: ListingRealEstateMapPage },
  { path: "/listing-real-estate", component: ListingRealEstatePage },
  //
  { path: "/author", component: AuthorPage },
  { path: "/author/:hostId", component: AuthorPage },
  //
  { path: "/blog", component: BlogPage },
  { path: "/blog-single", component: BlogSingle },
  { path: "/blog-single/:slug", component: BlogSingle },
  //
  { path: "/contact", component: PageContact },
  { path: "/about", component: PageAbout },
  { path: "/signup", component: PageSignUp },
  { path: "/login", component: PageLogin },
  { path: "/forgot-pass", component: PageForgotPassword },
  //
  { path: "/account-list", component: PageAccountList },
  { path: "/account-detail/:id", component: PageAccountDetail },
  { path: "/add-account", component: PageAddAccount },
  //
  { path: "/account", component: AccountPage },
  { path: "/account-password", component: AccountPass },
  { path: "/account-savelists", component: AccountSavelists },
  { path: "/account-billing", component: AccountBilling },
  { path: "/account-rewards", component: AccountRewards },
  //
  { path: "/listing-stay", component: ListingStayPage },
  { path: "/listing-stay-map", component: ListingStayMapPage },
  // 
  { path: "/listing-stay-detail/:id", component: ListingStayDetailPage },
  //
  { path: "/checkout", component: CheckOutPage },
  { path: "/pay-done", component: PayPage },
  { path: "/payment/cancel", component: PaymentCancelPage },
  //
  { path: "/my-bookings", component: PageTenantBookings },
  { path: "/booking-history", component: PageBookingHistory },
  { path: "/booking-history/:id", component: PageBookingHistoryDetail },
  { path: "/request-refund/:id", component: PageRequestRefund },
  { path: "/refund-requests", component: PageRefundRequests },
  { path: "/write-review/:id", component: PageWriteReview },
  { path: "/my-reviews", component: PageMyReviews },
  //
  { path: "/manage-blog", component: PageBlogList },
  { path: "/manage-blog/add", component: PageBlogAdd },
  { path: "/manage-blog/edit/:id", component: PageBlogEdit },
  { path: "/manage-blog/categories", component: PageBlogCategory },
  //
  { path: "/host-dashboard", component: HostCondotelDashboard },
  //
  { path: "/manage-vouchers", component: PageVoucherList },
  { path: "/manage-vouchers/add", component: PageVoucherAdd },
  { path: "/manage-vouchers/edit/:id", component: PageVoucherEdit },
  { path: "/my-vouchers", component: PageMyVouchers },
  //
  { path: "/manage-locations", component: PageLocationList },
  { path: "/manage-locations/add", component: PageLocationAdd },
  { path: "/manage-locations/edit/:id", component: PageLocationEdit },
  //
  { path: "/become-a-host", component: BecomeAHostPage },
  { path: "/chat", component: PageChat },

  // --- Các routes được bổ sung từ code cũ ---
  { path: "/refund-policy", component: PageRefundPolicy },
  { path: "/admin/refunds", component: PageAdminRefund },
  { path: "/admin/payouts", component: PageAdminPayout },
  //
  { path: "/terms", component: PageTerms },
  { path: "/privacy", component: PagePrivacy },
  { path: "/regulations", component: PageRegulations },
  { path: "/admin/blog-requests", component: AdminBlogRequests },
];

const RoutesContent = () => {
  const location = useLocation();
  const WIN_WIDTH = useWindowSize().width || window.innerWidth;
  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname.startsWith("/manage-blog") || location.pathname.startsWith("/manage-locations") || location.pathname.startsWith("/manage-vouchers") || location.pathname.startsWith("/account-list") || location.pathname.startsWith("/account-detail") || location.pathname.startsWith("/add-account");
  const isHostRoute = location.pathname.startsWith("/host-dashboard");

  return (
    <>
      {!isAdminRoute && !isHostRoute && <SiteHeader />}
      <ScrollToTop />

      <Routes>
        {/* Add Listing Route - Wrapped with AddCondotelProvider - Only Host can access */}
        <Route element={<AddListingLayout />}>
          <Route
            path="/add-listing-1"
            element={
              <ProtectedRoute requireAuth={true} requireHost={true}>
                <PageAddListingSimple />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-condotel"
            element={
              <ProtectedRoute requireAuth={true} requireHost={true}>
                <PageAddListingSimple />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Edit Condotel - Only Host */}
        <Route
          path="/edit-condotel/:id"
          element={
            <ProtectedRoute requireAuth={true} requireHost={true}>
              <PageEditCondotel />
            </ProtectedRoute>
          }
        />

        {/* ------------------------------------------------------------- */}
        {/* THÊM ROUTE CHO SUBSCRIPTION VÀ PRICING (KHÔNG DÙNG ProtectedRoute) */}
        {/* ------------------------------------------------------------- */}
        <Route path="/subscription" element={<PageSubcription />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />

        {pages.map(({ component, path }) => {
          const Component = component;

          // Protect host dashboard - only Host role can access
          if (path === "/host-dashboard") {
            return (
              <Route key={path} path={path} element={
                <HostLayout>
                  <ProtectedRoute requireAuth={true} requireHost={true}>
                    <HostCondotelDashboard />
                  </ProtectedRoute>
                </HostLayout>
              } />
            );
          }
          // Bảo vệ trang chat - chỉ user đã login mới vào được
          if (path === "/chat") {
            return (
              <Route key={path} path={path} element={
                <ProtectedRoute requireAuth={true}>
                  <PageChat />
                </ProtectedRoute>
              } />
            );
          }

          // Protect blog management routes - only Admin can access
          if (path && path.startsWith("/manage-blog")) {
            return (
              <Route key={path} path={path} element={
                <AdminLayout>
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <Component />
                  </ProtectedRoute>
                </AdminLayout>
              } />
            );
          }

          // Protect account management routes - only Admin can access
          if (path === "/account-list" || path === "/account-detail/:id" || path === "/add-account") {
            return (
              <Route key={path} path={path} element={
                <AdminLayout>
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <Component />
                  </ProtectedRoute>
                </AdminLayout>
              } />
            );
          }

          // Protect voucher management routes - only Admin can access
          if (path && path.startsWith("/manage-vouchers")) {
            return (
              <Route key={path} path={path} element={
                <AdminLayout>
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <Component />
                  </ProtectedRoute>
                </AdminLayout>
              } />
            );
          }

          // Protect location management routes - only Admin can access
          if (path && path.startsWith("/manage-locations")) {
            return (
              <Route key={path} path={path} element={
                <AdminLayout>
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <Component />
                  </ProtectedRoute>
                </AdminLayout>
              } />
            );
          }

          // Protect admin refunds and payouts routes - only Admin can access
          if (path === "/admin/refunds" || path === "/admin/payouts") {
            return (
              <Route key={path} path={path} element={
                <AdminLayout>
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <Component />
                  </ProtectedRoute>
                </AdminLayout>
              } />
            );
          }

          // Skip add-listing routes (đã được handle ở trên)
          if (path && (path.startsWith("/add-listing") || path.startsWith("/add-condotel"))) {
            return null;
          }

          // Wrap all public routes with ProtectedRoute to block Admin from accessing them
          // Admin can only access /admin routes and personal account routes
          return (
            <Route 
              key={path} 
              path={path} 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Component />
                </ProtectedRoute>
              } 
            />
          );
        })}
        <Route
          path="/host-dashboard/create-blog"
          element={
            <HostLayout>
              <ProtectedRoute requireAuth={true} requireHost={true}>
                <HostCreateBlog />
              </ProtectedRoute>
            </HostLayout>
          }
        /><Route
          path="/host-dashboard/blog/edit/:id"
          element={
            <HostLayout>
              <ProtectedRoute requireAuth={true} requireHost={true}>
                <HostCreateBlog />
              </ProtectedRoute>
            </HostLayout>
          }
        />

        {/* Protected Admin Routes - Direct paths for specific tabs */}
        <Route
          path="/admin/add-category-blog"
          element={
            <AdminLayout>
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AdminPage {...({ defaultTab: "add-category-blog" } as any)} />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/admin/add-blog"
          element={
            <AdminLayout>
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AdminPage {...({ defaultTab: "add-blog" } as any)} />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/admin/add-account"
          element={
            <AdminLayout>
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AdminPage {...({ defaultTab: "add-account" } as any)} />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/admin/edit-account"
          element={
            <AdminLayout>
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AdminPage {...({ defaultTab: "edit-account" } as any)} />
              </ProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Protected Admin Route - Catch-all for /admin/* */}
        <Route
          path="/admin/*"
          element={
            <AdminLayout>
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            </AdminLayout>
          }
        />

        <Route path="*" element={<Page404 />} />
      </Routes>

      {!isAdminRoute && !isHostRoute && (
        <>
          {WIN_WIDTH < 768 && <FooterNav />}
          <Footer />
        </>
      )}
      {!isAdminRoute && !isHostRoute && <ChatButtonFloating />}
    </>
  );
};

const MyRoutes = () => {
  return (
    <BrowserRouter>
      <RoutesContent />
    </BrowserRouter>
  );
};

export default MyRoutes;