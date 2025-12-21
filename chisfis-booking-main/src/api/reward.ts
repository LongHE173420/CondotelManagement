import axiosClient from "./axiosClient";

// DTOs từ backend Reward
export interface RewardPointsDTO {
  userId: number;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  lastUpdated?: string;
}

export interface RewardHistoryItemDTO {
  transactionId?: number;
  points: number;
  type: string; // "Earned" | "Redeemed" | "Expired"
  description?: string;
  bookingId?: number;
  createdAt: string;
}

export interface RewardHistoryQueryDTO {
  page?: number;
  pageSize?: number;
  type?: string; // "Earned" | "Redeemed" | "All"
  startDate?: string;
  endDate?: string;
}

export interface RewardHistoryResponseDTO {
  history: RewardHistoryItemDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RedeemPointsDTO {
  pointsToRedeem: number;
  bookingId?: number; // Optional: nếu đổi điểm cho booking cụ thể
}

export interface RedeemPointsResponseDTO {
  success: boolean;
  message: string;
  pointsRedeemed?: number;
  discountAmount?: number;
  remainingPoints?: number;
}

export interface PromotionDTO {
  promotionId: number;
  title: string;
  description?: string;
  pointsRequired?: number;
  discountPercentage?: number;
  discountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CalculateDiscountResponseDTO {
  points: number;
  discountAmount: number;
  formula: string;
}

export interface ValidateRedeemResponseDTO {
  isValid: boolean;
  message: string;
  discountAmount: number;
}

// API Calls
export const rewardAPI = {
  // GET /api/tenant/rewards/points - Lấy số điểm hiện tại
  getMyPoints: async (): Promise<RewardPointsDTO> => {
    try {
      const response = await axiosClient.get<{
        success: boolean;
        data: RewardPointsDTO | any;
        info?: {
          pointsToMoneyRate?: string;
          minPointsToRedeem?: number;
          currentValue?: string;
        };
      }>("/tenant/rewards/points");
      
      const data = response.data.data;
      // Normalize data structure - handle both camelCase and PascalCase
      return {
        userId: data.userId ?? data.UserId ?? 0,
        totalPoints: data.totalPoints ?? data.TotalPoints ?? 0,
        availablePoints: data.availablePoints ?? data.AvailablePoints ?? 0,
        usedPoints: data.usedPoints ?? data.UsedPoints ?? 0,
        lastUpdated: data.lastUpdated ?? data.LastUpdated,
      };
    } catch (error: any) {
      throw error;
    }
  },

  // GET /api/tenant/rewards/history - Lịch sử tích điểm/dùng điểm
  getPointsHistory: async (
    query?: RewardHistoryQueryDTO
  ): Promise<RewardHistoryResponseDTO> => {
    const params: any = {};
    // ASP.NET Core thường bind query parameters theo camelCase
    if (query?.page !== undefined) params.page = query.page;
    if (query?.pageSize !== undefined) params.pageSize = query.pageSize;
    if (query?.type) params.type = query.type;
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const response = await axiosClient.get<{
      success: boolean;
      data: RewardHistoryItemDTO[];
      pagination: {
        page?: number;
        Page?: number;
        pageSize?: number;
        PageSize?: number;
        totalCount?: number;
        TotalCount?: number;
        totalPages?: number;
        TotalPages?: number;
      };
    }>("/tenant/rewards/history", { params });

    const pagination = response.data.pagination;
    return {
      history: response.data.data,
      totalCount: pagination.totalCount ?? pagination.TotalCount ?? 0,
      page: pagination.page ?? pagination.Page ?? (query?.page || 1),
      pageSize: pagination.pageSize ?? pagination.PageSize ?? (query?.pageSize || 10),
      totalPages: pagination.totalPages ?? pagination.TotalPages ?? 0,
    };
  },

  // POST /api/tenant/rewards/redeem - Đổi điểm
  redeemPoints: async (
    dto: RedeemPointsDTO
  ): Promise<RedeemPointsResponseDTO> => {
    const response = await axiosClient.post<{
      success: boolean;
      message: string;
      data: RedeemPointsResponseDTO;
    }>("/tenant/rewards/redeem", dto);
    return response.data.data;
  },

  // GET /api/tenant/rewards/promotions - Xem promotions
  getAvailablePromotions: async (): Promise<PromotionDTO[]> => {
    try {
      const response = await axiosClient.get<{
        success: boolean;
        data: PromotionDTO[];
        count: number;
      }>("/tenant/rewards/promotions");
      return response.data.data || [];
    } catch (error: any) {
      // Trả về mảng rỗng thay vì throw error để trang vẫn hiển thị được
      return [];
    }
  },

  // GET /api/tenant/rewards/calculate-discount?points=5000 - Tính discount
  calculateDiscount: async (
    points: number
  ): Promise<CalculateDiscountResponseDTO> => {
    const response = await axiosClient.get<{
      success: boolean;
      points: number;
      Points?: number;
      discountAmount: number;
      DiscountAmount?: number;
      formula: string;
      Formula?: string;
    }>("/tenant/rewards/calculate-discount", {
      params: { points },
    });
    return {
      points: response.data.points ?? response.data.Points ?? points,
      discountAmount: response.data.discountAmount ?? response.data.DiscountAmount ?? 0,
      formula: response.data.formula ?? response.data.Formula ?? "1000 points = $1",
    };
  },

  // GET /api/tenant/rewards/validate-redeem?points=5000 - Validate redeem
  validateRedeem: async (
    points: number
  ): Promise<ValidateRedeemResponseDTO> => {
    const response = await axiosClient.get<{
      isValid: boolean;
      message: string;
      discountAmount: number;
    }>("/tenant/rewards/validate-redeem", {
      params: { points },
    });
    return {
      isValid: response.data.isValid,
      message: response.data.message,
      discountAmount: response.data.discountAmount,
    };
  },
};

export default rewardAPI;

