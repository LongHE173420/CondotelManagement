# Package Documentation

This document describes all packages and folders in the Chisfis Booking System project.

## Package List

| No | Package | Description |
|---|---|---|
| 01 | **api** | This package is responsible for handling communication with the backend server. It contains API client modules that make HTTP requests to various endpoints, including authentication, booking, payment, condotel management, and other business operations. |
| 02 | **components** | This package contains reusable React UI components used throughout the application. It includes header, footer, search forms, cards, modals, and various section components that provide the user interface elements. |
| 03 | **containers** | This package manages all page-level components that represent full pages of the application. It includes home page, login, registration, listing pages, detail pages, checkout, payment, account management, admin pages, and host dashboard pages. |
| 04 | **contains** | This package contains constants and fake data used for development and testing purposes. |
| 05 | **contexts** | This package manages global application state using React Context. It includes authentication context that handles user login, logout, and user profile management across the application. |
| 06 | **data** | This package is responsible for managing static data, type definitions, and JSON data files. It includes navigation data, listing data, taxonomy data, and various data type definitions used throughout the application. |
| 07 | **fonts** | This package contains font files used in the application, including various font families such as Be Vietnam, Inter, Kodchasan, Line Awesome, Merriweather Sans, and Poppins. |
| 08 | **hooks** | This package contains custom React hooks that provide reusable logic for components. It includes hooks for window resize detection, outside click detection, tab filtering, and ID generation. |
| 09 | **i18n** | This package handles internationalization and multi-language support for the application. It includes language context provider and translation files for Vietnamese and English languages. |
| 10 | **routers** | This package manages application routing and navigation. It contains route definitions, route protection logic, and components that handle navigation between different pages of the application. |
| 11 | **shared** | This package contains shared UI components that are used across the entire application. It includes common components such as buttons, inputs, avatars, badges, modals, pagination, navigation, footer, and other reusable UI elements. |
| 12 | **styles** | This package contains styling files (SCSS/CSS) that define the visual appearance and layout of the application. |
| 13 | **types** | This package contains TypeScript type definitions and interfaces used throughout the application for type safety and code documentation. |
| 14 | **utils** | This package contains utility functions that provide support functions for common operations such as date conversion, number formatting, color conversion, viewport detection, ID generation, and other helper functions. |
| 15 | **index.tsx** | This is the main entry point of the React application. It initializes ReactDOM, renders the root App component, and imports global styles and fonts. |
| 16 | **App.tsx** | This is the root application component that wraps the entire application with providers (GoogleOAuthProvider, AuthProvider, LanguageProvider) and renders the main router. |
| 17 | **type.d.ts** | This file contains TypeScript declaration files for external modules and third-party libraries. |
| 18 | **custom.d.ts** | This file contains custom TypeScript declaration files for project-specific type definitions. |
