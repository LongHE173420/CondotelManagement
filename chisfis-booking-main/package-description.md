# Bảng Mô Tả Các Package Trong Dự Án

| No | Package | Description |
|---|---|---|
| 1 | **api** | Chứa các API clients để giao tiếp với backend server. Bao gồm các file như auth.ts, booking.ts, condotel.ts, payment.ts, v.v. Sử dụng axiosClient làm base. |
| 2 | **components** | Chứa các React UI components tái sử dụng. Bao gồm Header, FooterNav, HeroSearchForm, CondotelCard, StayCard, ExperiencesCard, FlightCard, ProtectedRoute, và các component khác. |
| 3 | **containers** | Chứa các page containers (các trang chính của ứng dụng). Bao gồm PageHome, PageLogin, PageSignUp, ListingStayPage, ListingDetailPage, CheckOutPage, PayPage, AccountPage, AdminPage, HostCondotelDashboard, BlogPage, và nhiều trang khác. |
| 4 | **contains** | Chứa các constants và fake data. Bao gồm contants.ts và fakeData.ts. |
| 5 | **contexts** | Chứa React Context providers. Hiện tại có AuthContext.tsx để quản lý authentication state. |
| 6 | **data** | Chứa các file dữ liệu và type definitions. Bao gồm authors.ts, listings.ts, navigation.ts, posts.ts, taxonomies.ts, types.ts, và thư mục jsons/ chứa các file JSON. |
| 7 | **fonts** | Chứa các file font (TTF, EOT, SVG, WOFF). Bao gồm các font families: Be_Vietnam, Inter, Kodchasan, line-awesome, Merriweather_Sans, Poppins. |
| 8 | **hooks** | Chứa các custom React hooks. Bao gồm useDemoTabFilter.tsx, useNcId.ts, useOutsideAlerter.ts, useWindowResize.ts. |
| 9 | **i18n** | Chứa các file internationalization (đa ngôn ngữ). Bao gồm LanguageContext.tsx và thư mục translations/ với các file vi.ts và en.ts. |
| 10 | **routers** | Chứa logic routing của ứng dụng. Bao gồm index.tsx (định nghĩa routes), ScrollToTop.tsx, và types.ts. |
| 11 | **shared** | Chứa các shared components được sử dụng chung trong toàn bộ ứng dụng. Bao gồm Footer, Navigation, Button, Input, Avatar, Badge, Modal, Pagination, Logo, SocialsList, và nhiều component khác. |
| 12 | **styles** | Chứa các file styling (SCSS/CSS). Bao gồm index.scss và các file style khác. |
| 13 | **types** | Chứa các TypeScript type definitions. Bao gồm chatTypes.ts và các type definitions khác. |
| 14 | **utils** | Chứa các utility functions. Bao gồm converSelectedDateToString.ts, convertNumbThousand.ts, getTwClassByNumber.ts, hexToRgb.ts, isInViewport.ts, isInViewPortIntersectionObserver.ts, ncNanoId.ts, twFocusClass.ts. |
| 15 | **index.tsx** | Entry point chính của ứng dụng React. Khởi tạo ReactDOM và render App component. |
| 16 | **App.tsx** | Component chính của ứng dụng. Bao bọc toàn bộ ứng dụng với các providers (GoogleOAuthProvider, AuthProvider, LanguageProvider) và chứa router. |
| 17 | **type.d.ts** | TypeScript declaration file cho các module bên ngoài (ví dụ: react-helmet). |
| 18 | **custom.d.ts** | Custom TypeScript declaration file cho các type definitions tùy chỉnh. |



