import axiosClient from "./axiosClient";

// HostReportDTO - Báo cáo của host
// Response từ GET /api/host/report: { success: true, data: { revenue, totalBookings, totalCustomers, averageBookingValue, pendingBookings, confirmedBookings, completedBookings, totalCancellations, totalRooms, roomsBooked, occupancyRate } }
export interface HostReportDTO {
  // Các trường chính từ API response
  revenue?: number; // Tổng doanh thu (từ booking Completed)
  totalRevenue?: number; // Alias cho revenue (backward compatibility)
  totalBookings?: number; // Tổng số booking (tất cả status)
  totalCustomers?: number; // Tổng số khách hàng unique (mới)
  averageBookingValue?: number; // Giá trị trung bình mỗi đặt phòng = Revenue / CompletedBookings (mới)
  pendingBookings?: number; // Đang xử lý - Status = "Pending" (mới)
  confirmedBookings?: number; // Đã xác nhận - Status = "Confirmed" (mới)
  completedBookings?: number; // Hoàn thành - Status = "Completed"
  totalCancellations?: number; // Đã hủy - Status = "Cancelled"
  cancelledBookings?: number; // Alias cho totalCancellations (backward compatibility)
  totalRooms?: number; // Tổng số phòng
  roomsBooked?: number; // Số phòng đã đặt
  occupancyRate?: number; // Tỷ lệ lấp đầy (%)
  
  // Các trường optional cho charts/analytics
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
  // Response: { success: true, data: { revenue, totalBookings, totalCustomers, averageBookingValue, pendingBookings, confirmedBookings, completedBookings, totalCancellations, totalRooms, roomsBooked, occupancyRate } }
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

    // Normalize response từ backend
    // Response format: { revenue, totalBookings, totalCustomers, averageBookingValue, pendingBookings, confirmedBookings, completedBookings, totalCancellations, totalRooms, roomsBooked, occupancyRate }
    // Ưu tiên camelCase (format mới), fallback sang PascalCase (backward compatibility)
    
    const revenue = data.revenue ?? data.Revenue ?? data.totalRevenue ?? (data as any).TotalRevenue ?? 0;
    const totalBookings = data.totalBookings ?? data.TotalBookings ?? 0;
    const totalCustomers = data.totalCustomers ?? data.TotalCustomers ?? 0;
    const completedBookings = data.completedBookings ?? data.CompletedBookings ?? 0;
    const totalCancellations = data.totalCancellations ?? data.TotalCancellations ?? data.cancelledBookings ?? (data as any).CancelledBookings ?? 0;
    
    // Tính averageBookingValue: ưu tiên từ backend, nếu không có hoặc = 0 thì tính = Revenue / CompletedBookings
    let averageBookingValue = data.averageBookingValue ?? data.AverageBookingValue ?? 0;
    if (averageBookingValue === 0 && completedBookings > 0 && revenue > 0) {
      averageBookingValue = revenue / completedBookings;
    }
    
    const pendingBookings = data.pendingBookings ?? data.PendingBookings ?? 0;
    const confirmedBookings = data.confirmedBookings ?? data.ConfirmedBookings ?? 0;
    const totalRooms = data.totalRooms ?? data.TotalRooms ?? 0;
    const roomsBooked = data.roomsBooked ?? data.RoomsBooked ?? 0;
    const occupancyRate = data.occupancyRate ?? data.OccupancyRate ?? 0;
    

    return {
      // Các trường chính từ API response
      revenue: revenue,
      totalRevenue: revenue, // Alias cho backward compatibility
      totalBookings: totalBookings,
      totalCustomers: totalCustomers,
      averageBookingValue: averageBookingValue,
      pendingBookings: pendingBookings,
      confirmedBookings: confirmedBookings,
      completedBookings: completedBookings,
      totalCancellations: totalCancellations,
      cancelledBookings: totalCancellations, // Alias cho backward compatibility
      totalRooms: totalRooms,
      roomsBooked: roomsBooked,
      occupancyRate: occupancyRate,
      // Các trường optional cho charts/analytics
      revenueByMonth: data.revenueByMonth ?? (data as any).RevenueByMonth ?? (data as any).RevenueByPeriod ?? [],
      bookingsByStatus: data.bookingsByStatus ?? (data as any).BookingsByStatus ?? [],
      topCondotels: data.topCondotels ?? (data as any).TopCondotels ?? [],
      dateFrom: data.dateFrom ?? (data as any).DateFrom ?? from,
      dateTo: data.dateTo ?? (data as any).DateTo ?? to,
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


    const response = await axiosClient.get<any>("/host/report/revenue", { params });
    
    // Handle response structure: { success: true, data: { monthlyRevenues: [...], yearlyRevenues: [...] } }
    let responseData = response.data;
    if (responseData && responseData.success && responseData.data) {
      responseData = responseData.data; // Extract data from wrapper
    }
    
    const data = responseData;


    // Backend trả về structure mới:
    // { success: true, data: { monthlyRevenues: [...], yearlyRevenues: [...] } }
    
    let revenueData: any[] = [];

    if (Array.isArray(data)) {
      // Case 1: Array trực tiếp (fallback)
      revenueData = data;

    } else if (data && typeof data === "object") {
      // Case 2: Object với monthlyRevenues/yearlyRevenues (format mới)
      const monthlyRevenues = data.monthlyRevenues || data.MonthlyRevenues || [];
      const yearlyRevenues = data.yearlyRevenues || data.YearlyRevenues || [];
      

      // Ưu tiên monthlyRevenues nếu có, nếu không thì dùng yearlyRevenues[].monthlyData
      if (monthlyRevenues.length > 0) {
        revenueData = monthlyRevenues;

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

      } else if (data.data && Array.isArray(data.data)) {
        // Case 3: Object với data property (fallback)
        revenueData = data.data;

      }
    }


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


    return mappedData;
  },
};

export default reportAPI;






