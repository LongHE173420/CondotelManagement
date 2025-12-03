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
    const data = response.data;

    console.log("📊 [Revenue Report] Raw response:", data);
    console.log("📊 [Revenue Report] Response type:", Array.isArray(data) ? "Array" : typeof data);
    console.log("📊 [Revenue Report] Response keys:", data && typeof data === "object" ? Object.keys(data) : "N/A");

    // Backend có thể trả về:
    // 1. Array trực tiếp: [{ Period, Revenue, Bookings }, ...]
    // 2. Object với monthlyRevenues: { monthlyRevenues: [...], yearlyRevenues: [...] }
    // 3. Object với data: { data: [...] }
    
    let revenueData: any[] = [];

    if (Array.isArray(data)) {
      // Case 1: Array trực tiếp
      revenueData = data;
      console.log("📊 [Revenue Report] Response is Array, count:", revenueData.length);
    } else if (data && typeof data === "object") {
      // Case 2: Object với monthlyRevenues/yearlyRevenues
      const monthlyRevenues = data.monthlyRevenues || data.MonthlyRevenues || [];
      const yearlyRevenues = data.yearlyRevenues || data.YearlyRevenues || [];
      
      console.log("📊 [Revenue Report] monthlyRevenues count:", monthlyRevenues.length);
      console.log("📊 [Revenue Report] yearlyRevenues count:", yearlyRevenues.length);
      console.log("📊 [Revenue Report] monthlyRevenues:", monthlyRevenues);
      console.log("📊 [Revenue Report] yearlyRevenues:", yearlyRevenues);

      // Ưu tiên monthlyRevenues nếu có, nếu không thì dùng yearlyRevenues
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
          } else {
            // Nếu không có monthlyData, dùng chính yearItem
            flattened.push(yearItem);
          }
        });
        revenueData = flattened;
        console.log("📊 [Revenue Report] Using yearlyRevenues (flattened), count:", revenueData.length);
      } else if (data.data) {
        // Case 3: Object với data property
        revenueData = Array.isArray(data.data) ? data.data : [];
        console.log("📊 [Revenue Report] Using data.data, count:", revenueData.length);
      }
    }

    console.log("📊 [Revenue Report] Processed data count:", revenueData.length);
    console.log("📊 [Revenue Report] Processed data:", revenueData);

    // Map và normalize data (PascalCase -> camelCase)
    // KHÔNG filter items có Revenue = 0, vì có thể có tháng không có doanh thu
    const mappedData = revenueData
      .map((item: any) => {
        // Hỗ trợ nhiều format:
        // 1. Format cũ: { Period: "YYYY-MM", Revenue: number, Bookings: number }
        // 2. Format mới: { year: 2025, month: 9, monthName: 'Tháng 9', revenue: number, totalBookings: number }
        
        let period = item.Period || item.period || "";
        let revenue = item.Revenue !== undefined ? item.Revenue : (item.revenue !== undefined ? item.revenue : 0);
        let bookings = item.Bookings !== undefined ? item.Bookings : (item.bookings !== undefined ? item.bookings : (item.totalBookings !== undefined ? item.totalBookings : 0));
        
        // Nếu không có period nhưng có year và month, tạo period từ đó
        if (!period && item.year && item.month) {
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






