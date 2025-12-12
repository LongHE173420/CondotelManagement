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

// Revenue Report DTO - Doanh thu theo tháng/năm
export interface RevenueReportDTO {
  period: string; // "YYYY-MM" format
  revenue: number;
  bookings?: number;
}

// API Calls
export const reportAPI = {
  // GET /api/host/report?from=YYYY-MM-DD&to=YYYY-MM-DD
  getReport: async (from?: string, to?: string): Promise<HostReportDTO> => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await axiosClient.get<any>("/host/report", { params });
    
    // Handle response structure: { success: true, data: { ... } }
    let data: any = response.data;
    if (data && data.data && typeof data.data === 'object') {
      data = data.data; // Extract data from wrapper
    }

    // Normalize response từ backend (PascalCase -> camelCase)
    // Map từ format mới: { revenue, totalBookings, totalCancellations, completedBookings, ... }
    // Sang format cũ: { totalRevenue, totalBookings, cancelledBookings, completedBookings, ... }
    return {
      totalRevenue: data.revenue !== undefined ? data.revenue : (data.totalRevenue !== undefined ? data.totalRevenue : (data as any).TotalRevenue || (data as any).Revenue || 0),
      totalBookings: data.totalBookings !== undefined ? data.totalBookings : (data as any).TotalBookings || 0,
      totalCustomers: data.totalCustomers !== undefined ? data.totalCustomers : (data as any).TotalCustomers || 0,
      averageBookingValue: data.averageBookingValue !== undefined ? data.averageBookingValue : (data as any).AverageBookingValue || 0,
      confirmedBookings: data.confirmedBookings !== undefined ? data.confirmedBookings : (data as any).ConfirmedBookings || 0,
      pendingBookings: data.pendingBookings !== undefined ? data.pendingBookings : (data as any).PendingBookings || 0,
      cancelledBookings: data.totalCancellations !== undefined ? data.totalCancellations : (data.cancelledBookings !== undefined ? data.cancelledBookings : (data as any).CancelledBookings || (data as any).TotalCancellations || 0),
      completedBookings: data.completedBookings !== undefined ? data.completedBookings : (data as any).CompletedBookings || 0,
      revenueByMonth: data.revenueByMonth || (data as any).RevenueByMonth || (data as any).RevenueByPeriod || [],
      bookingsByStatus: data.bookingsByStatus || (data as any).BookingsByStatus || [],
      topCondotels: data.topCondotels || (data as any).TopCondotels || [],
      dateFrom: data.dateFrom || (data as any).DateFrom || from,
      dateTo: data.dateTo || (data as any).DateTo || to,
    };
  },

  // GET /api/host/report/revenue?year=2024&month=1
  getRevenueReport: async (year?: number, month?: number): Promise<RevenueReportDTO[]> => {
    const params: any = {};
    if (year !== undefined && year !== null) {
      params.year = year;
    }
    if (month !== undefined && month !== null) {
      params.month = month;
    }

    console.log("📊 [Revenue Report] Request params:", { year, month, params });
    console.log("📊 [Revenue Report] Full URL will be: /host/report/revenue?" + new URLSearchParams(params).toString());

    const response = await axiosClient.get<any>("/host/report/revenue", { params });
    
    // Handle response structure: { success: true, data: { monthlyRevenues: [...], yearlyRevenues: [...] } }
    let responseData = response.data;
    if (responseData && responseData.success && responseData.data) {
      responseData = responseData.data; // Extract data from wrapper
    }
    
    const data = responseData;

    console.log("📊 [Revenue Report] Raw response:", data);
    console.log("📊 [Revenue Report] Response type:", Array.isArray(data) ? "Array" : typeof data);
    console.log("📊 [Revenue Report] Response keys:", data && typeof data === "object" ? Object.keys(data) : "N/A");

    // Backend trả về structure mới:
    // { success: true, data: { monthlyRevenues: [...], yearlyRevenues: [...] } }
    
    let revenueData: any[] = [];

    if (Array.isArray(data)) {
      // Case 1: Array trực tiếp (fallback)
      revenueData = data;
      console.log("📊 [Revenue Report] Response is Array, count:", revenueData.length);
    } else if (data && typeof data === "object") {
      // Case 2: Object với monthlyRevenues/yearlyRevenues (format mới)
      const monthlyRevenues = data.monthlyRevenues || data.MonthlyRevenues || [];
      const yearlyRevenues = data.yearlyRevenues || data.YearlyRevenues || [];
      
      console.log("📊 [Revenue Report] monthlyRevenues count:", monthlyRevenues.length);
      console.log("📊 [Revenue Report] yearlyRevenues count:", yearlyRevenues.length);
      console.log("📊 [Revenue Report] monthlyRevenues:", monthlyRevenues);
      console.log("📊 [Revenue Report] yearlyRevenues:", yearlyRevenues);

      // Ưu tiên monthlyRevenues nếu có, nếu không thì dùng yearlyRevenues[].monthlyData
      if (monthlyRevenues.length > 0) {
        revenueData = monthlyRevenues;
        console.log("📊 [Revenue Report] Using monthlyRevenues");
      } else if (yearlyRevenues.length > 0) {
        // Nếu yearlyRevenues có monthlyData, flatten nó
        const flattened: any[] = [];
        yearlyRevenues.forEach((yearItem: any) => {
          const monthlyData = yearItem.monthlyData || yearItem.MonthlyData || [];
          if (monthlyData.length > 0) {
            flattened.push(...monthlyData);
          }
        });
        revenueData = flattened;
        console.log("📊 [Revenue Report] Using yearlyRevenues[].monthlyData (flattened), count:", revenueData.length);
      } else if (data.data && Array.isArray(data.data)) {
        // Case 3: Object với data property (fallback)
        revenueData = data.data;
        console.log("📊 [Revenue Report] Using data.data, count:", revenueData.length);
      }
    }

    console.log("📊 [Revenue Report] Processed data count:", revenueData.length);
    console.log("📊 [Revenue Report] Processed data:", revenueData);

    // Map và normalize data
    // Format mới: { year: 2024, month: 1, monthName: 'Tháng 1', revenue: number, totalBookings: number }
    const mappedData = revenueData
      .map((item: any) => {
        // Hỗ trợ format mới: { year, month, monthName, revenue, totalBookings }
        let period = item.Period || item.period || "";
        let revenue = item.Revenue !== undefined ? item.Revenue : (item.revenue !== undefined ? item.revenue : 0);
        let bookings = item.Bookings !== undefined ? item.Bookings : (item.bookings !== undefined ? item.bookings : (item.totalBookings !== undefined ? item.totalBookings : 0));
        
        // Nếu không có period nhưng có year và month, tạo period từ đó
        if (!period && (item.year || item.Year) && (item.month || item.Month)) {
          const year = item.year || item.Year;
          const month = item.month || item.Month;
          if (year && month) {
            // Format: "YYYY-MM" với month có 2 chữ số
            period = `${year}-${String(month).padStart(2, '0')}`;
          }
        }
        
        return {
          period,
          revenue: typeof revenue === "number" ? revenue : 0,
          bookings: typeof bookings === "number" ? bookings : 0,
        };
      })
      .filter((item) => item.period !== ""); // Chỉ filter items không có period

    console.log("📊 [Revenue Report] Mapped results:", mappedData);
    console.log("📊 [Revenue Report] Mapped results count:", mappedData.length);
    console.log("📊 [Revenue Report] Total revenue:", mappedData.reduce((sum: number, item: RevenueReportDTO) => sum + item.revenue, 0));
    
    // Log chi tiết từng item
    mappedData.forEach((item, index) => {
      console.log(`📊 [Revenue Report] Item ${index + 1}:`, {
        period: item.period,
        revenue: item.revenue,
        bookings: item.bookings,
      });
    });

    return mappedData;
  },
};

export default reportAPI;






