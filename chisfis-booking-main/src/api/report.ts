import axiosClient from "./axiosClient";

// HostReportDTO - Báo cáo của host
export interface HostReportDTO {
  totalRevenue?: number;
  totalBookings?: number;
  totalCustomers?: number;
  averageBookingValue?: number;
  confirmedBookings?: number;
  pendingBookings?: number;
  cancelledBookings?: number;
  completedBookings?: number;
  revenueByMonth?: RevenueByPeriod[];
  bookingsByStatus?: BookingsByStatus[];
  topCondotels?: TopCondotelReport[];
  dateFrom?: string;
  dateTo?: string;
}

export interface RevenueByPeriod {
  period: string; // "YYYY-MM" hoặc "YYYY-MM-DD"
  revenue: number;
  bookings: number;
}

export interface BookingsByStatus {
  status: string;
  count: number;
  revenue?: number;
}

export interface TopCondotelReport {
  condotelId: number;
  condotelName: string;
  bookings: number;
  revenue: number;
}

// API Calls
export const reportAPI = {
  // GET /api/host/report?from=YYYY-MM-DD&to=YYYY-MM-DD
  getReport: async (from?: string, to?: string): Promise<HostReportDTO> => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await axiosClient.get<HostReportDTO>("/host/report", { params });
    const data = response.data;

    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      totalRevenue: data.totalRevenue !== undefined ? data.totalRevenue : (data as any).TotalRevenue,
      totalBookings: data.totalBookings !== undefined ? data.totalBookings : (data as any).TotalBookings,
      totalCustomers: data.totalCustomers !== undefined ? data.totalCustomers : (data as any).TotalCustomers,
      averageBookingValue: data.averageBookingValue !== undefined ? data.averageBookingValue : (data as any).AverageBookingValue,
      confirmedBookings: data.confirmedBookings !== undefined ? data.confirmedBookings : (data as any).ConfirmedBookings,
      pendingBookings: data.pendingBookings !== undefined ? data.pendingBookings : (data as any).PendingBookings,
      cancelledBookings: data.cancelledBookings !== undefined ? data.cancelledBookings : (data as any).CancelledBookings,
      completedBookings: data.completedBookings !== undefined ? data.completedBookings : (data as any).CompletedBookings,
      revenueByMonth: data.revenueByMonth || (data as any).RevenueByMonth || (data as any).RevenueByPeriod,
      bookingsByStatus: data.bookingsByStatus || (data as any).BookingsByStatus,
      topCondotels: data.topCondotels || (data as any).TopCondotels,
      dateFrom: data.dateFrom || (data as any).DateFrom || from,
      dateTo: data.dateTo || (data as any).DateTo || to,
    };
  },
};

export default reportAPI;

