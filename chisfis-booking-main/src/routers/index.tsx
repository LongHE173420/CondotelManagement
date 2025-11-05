import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Page } from "./types";
import ScrollToTop from "./ScrollToTop";
import Footer from "shared/Footer/Footer";
import PageHome from "containers/PageHome/PageHome";
import Page404 from "containers/Page404/Page404";
import ListingStayPage from "containers/ListingStayPage/ListingStayPage";
import ListingStayMapPage from "containers/ListingStayPage/ListingStayMapPage";
import ListingExperiencesPage from "containers/ListingExperiencesPage/ListingExperiencesPage";
import ListingExperiencesMapPage from "containers/ListingExperiencesPage/ListingExperiencesMapPage";
import ListingStayDetailPage from "containers/ListingDetailPage/ListingStayDetailPage";
import ListingExperiencesDetailPage from "containers/ListingDetailPage/ListingExperiencesDetailPage";
import ListingCarPage from "containers/ListingCarPage/ListingCarPage";
import ListingCarMapPage from "containers/ListingCarPage/ListingCarMapPage";
import ListingCarDetailPage from "containers/ListingDetailPage/ListingCarDetailPage";
import CheckOutPage from "containers/CheckOutPage/CheckOutPage";
import PayPage from "containers/PayPage/PayPage";
import AuthorPage from "containers/AuthorPage/AuthorPage";
import AccountPage from "containers/AccountPage/AccountPage";
import AccountPass from "containers/AccountPage/AccountPass";
import AccountSavelists from "containers/AccountPage/AccountSavelists";
import AccountBilling from "containers/AccountPage/AccountBilling";
import AdminPage from "containers/AdminPage/AdminPage";
import ProtectedRoute from "components/ProtectedRoute/ProtectedRoute";
import PageContact from "containers/PageContact/PageContact";
import PageAbout from "containers/PageAbout/PageAbout";
import PageSignUp from "containers/PageSignUp/PageSignUp";
import PageLogin from "containers/PageLogin/PageLogin";
import PageForgotPassword from "containers/PageForgotPassword/PageForgotPassword";
import PageAccountList from "containers/PageAccountList/PageAccountList";
import PageAccountDetail from "containers/PageAccountDetail/PageAccountDetail";
import PageAddAccount from "containers/PageAddAccount/PageAddAccount";
// -----
// Đảm bảo tên này khớp với tên file của bạn (PageTenantBookings hay PageTenantBookingList)
// Tôi sẽ dùng tên PageTenantBookings như chúng ta đã thống nhất

// -----
import PageSubcription from "containers/PageSubcription/PageSubcription";
import BlogPage from "containers/BlogPage/BlogPage";
import BlogSingle from "containers/BlogPage/BlogSingle";
import PageAddListingSimple from "containers/PageAddListing1/PageAddListingSimple";
import AddListingLayout from "containers/PageAddListing1/AddListingLayout";
import PageHome2 from "containers/PageHome/PageHome2";
import ListingRealEstateMapPage from "containers/ListingRealEstatePage/ListingRealEstateMapPage";
import ListingRealEstatePage from "containers/ListingRealEstatePage/ListingRealEstatePage";
import SiteHeader from "containers/SiteHeader";
import ListingFlightsPage from "containers/ListingFlightsPage/ListingFlightsPage";
import FooterNav from "components/FooterNav";
import useWindowSize from "hooks/useWindowResize";
import PageHome3 from "containers/PageHome/PageHome3";
import PageTenantBookings from "containers/PageTenantBookingList/PageTenantBookingList";
import HostCondotelDashboard from "containers/HostCondotelDashboard";
import PageEditCondotel from "containers/PageEditCondotel/PageEditCondotel";
import PageBookingHistory from "containers/PageBookingHistory/PageBookingHistory";
import PageBookingHistoryDetail from "containers/PageBookingHistory/PageBookingHistoryDetail";
import PageWriteReview from "containers/PageWriteReview/PageWriteReview";
import PageBlogList from "containers/PageManageBlog/PageBlogList";
import PageBlogAdd from "containers/PageManageBlog/PageBlogAdd";
import PageBlogEdit from "containers/PageManageBlog/PageBlogEdit";

export const pages: Page[] = [
  { path: "/", exact: true, component: PageHome },
  { path: "/#", exact: true, component: PageHome },
  { path: "/home-1-header-2", exact: true, component: PageHome },
  { path: "/home-2", component: PageHome2 },
  { path: "/home-3", component: PageHome3 },
  //
  {
    path: "/listing-experiences",
    component: ListingExperiencesPage,
  },
  {
    path: "/listing-experiences-map",
    component: ListingExperiencesMapPage,
  },
  {
    path: "/listing-experiences-detail",
    component: ListingExperiencesDetailPage,
  },
  //
  { path: "/listing-car", component: ListingCarPage },
  { path: "/listing-car-map", component: ListingCarMapPage },
  { path: "/listing-car-detail", component: ListingCarDetailPage },
  //
  { path: "/listing-real-estate-map", component: ListingRealEstateMapPage },
  { path: "/listing-real-estate", component: ListingRealEstatePage },
  //
  { path: "/listing-flights", component: ListingFlightsPage },
  //
  { path: "/author", component: AuthorPage },
  //
  { path: "/blog", component: BlogPage },
  { path: "/blog-single", component: BlogSingle },
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
  //
  { path: "/listing-stay", component: ListingStayPage },
  { path: "/listing-stay-map", component: ListingStayMapPage },
  // 
  { path: "/listing-stay-detail/:id", component: ListingStayDetailPage }, 
  //
  { path: "/checkout", component: CheckOutPage },
  { path: "/pay-done", component: PayPage },
  //
  { path: "/my-bookings", component: PageTenantBookings },
  { path: "/booking-history", component: PageBookingHistory },
  { path: "/booking-history/:id", component: PageBookingHistoryDetail },
  { path: "/write-review/:id", component: PageWriteReview },
  //
  { path: "/manage-blog", component: PageBlogList },
  { path: "/manage-blog/add", component: PageBlogAdd },
  { path: "/manage-blog/edit/:id", component: PageBlogEdit },
  //
  { path: "/subscription", component: PageSubcription },
  { path: "/host-dashboard", component: HostCondotelDashboard },
  //
];

const MyRoutes = () => {
  const WIN_WIDTH = useWindowSize().width || window.innerWidth;
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SiteHeader />

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

        {pages.map(({ component, path }) => {
          const Component = component;
          // Protect host dashboard - only Host role can access
          if(path === "/host-dashboard") {
            return (
              <Route key={path} path={path} element={
                <ProtectedRoute requireAuth={true} requireHost={true}>
                  <HostCondotelDashboard />
                </ProtectedRoute>
              } />
            );
          }
          
          // Skip add-listing routes (đã được handle ở trên)
          if(path && (path.startsWith("/add-listing") || path.startsWith("/add-condotel"))) {
            return null;
          }
          
          return <Route key={path} element={<Component />} path={path} />;
        })}
        
        {/* Protected Admin Route */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAuth={true} requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Page404 />} /> {/* Đã sửa lại Route cho Page404 */}
      </Routes>

      {WIN_WIDTH < 768 && <FooterNav />}
      <Footer />
    </BrowserRouter>
  );
};

export default MyRoutes;