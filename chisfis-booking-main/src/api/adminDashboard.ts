import axiosClient from "./axiosClient";

// Dashboard DTOs - Match with backend
export interface DashboardOverview {
  totalCondotels: number;
  totalTenants: number;
  totalBookings: number;
  totalRevenue: number;
}

export interface RevenueChart {
  year: number;
  month: number;
  totalRevenue: number;
}

export interface TopCondotel {
  condotelName: string;
  bookingCount: number;
  totalRevenue: number;
}

export interface TenantAnalytics {
  tenantName: string;
  bookingCount: number;
  totalSpent: number;
}

// API Calls
export const adminDashboardAPI = {
  // GET /api/admin/dashboard/overview
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await axiosClient.get<{ data: DashboardOverview }>(
      "/admin/dashboard/overview"
    );
    return response.data.data;
  },

  // GET /api/admin/dashboard/revenue/chart
  getRevenueChart: async (): Promise<RevenueChart[]> => {
    const response = await axiosClient.get<{ data: RevenueChart[] }>(
      "/admin/dashboard/revenue/chart"
    );
    return response.data.data;
  },

  // GET /api/admin/dashboard/top-condotels
  getTopCondotels: async (): Promise<TopCondotel[]> => {
    const response = await axiosClient.get<{ data: TopCondotel[] }>(
      "/admin/dashboard/top-condotels"
    );
    return response.data.data;
  },

  // GET /api/admin/dashboard/tenant-analytics
  getTenantAnalytics: async (): Promise<TenantAnalytics[]> => {
    const response = await axiosClient.get<{ data: TenantAnalytics[] }>(
      "/admin/dashboard/tenant-analytics"
    );
    return response.data.data;
  },
};

export default adminDashboardAPI;
