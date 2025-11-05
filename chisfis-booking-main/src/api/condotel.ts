import axiosClient from "./axiosClient";

// Sub DTOs for CondotelDetailDTO
export interface ImageDTO {
  imageId: number;
  imageUrl: string;
  caption?: string;
}

export interface PriceDTO {
  priceId: number;
  startDate: string; // DateOnly in C# = string in TypeScript
  endDate: string;
  basePrice: number;
  priceType: string;
  description: string;
}

export interface DetailDTO {
  buildingName?: string;
  roomNumber?: string;
  beds: number;
  bathrooms: number;
  safetyFeatures?: string;
  hygieneStandards?: string;
}

export interface AmenityDTO {
  amenityId: number;
  name: string;
}

export interface UtilityDTO {
  utilityId: number;
  name: string;
}

// Promotion DTOs - Promotion là một phần của Condotel
export interface PromotionDTO {
  promotionId: number;
  condotelId: number;
  condotelName?: string;
  name: string;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status?: string; // Optional compatibility with backends using string status
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionDTO {
  condotelId: number;
  name: string;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  status?: string; // Optional
}

export interface UpdatePromotionDTO {
  condotelId?: number;
  name?: string;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  status?: string; // Optional
}

// CondotelDTO - Simplified version for list view
export interface CondotelDTO {
  condotelId: number;
  name: string;
  pricePerNight: number;
  beds: number;
  bathrooms: number;
  status: string;
  thumbnailUrl?: string;
  resortName?: string;
  hostName?: string;
}

// CondotelDetailDTO - Full details for detail/update
export interface CondotelDetailDTO {
  condotelId: number;
  hostId: number;
  resortId?: number;
  name: string;
  description?: string;
  pricePerNight: number;
  beds: number;
  bathrooms: number;
  status: string;

  // Host info (nếu backend trả về)
  hostName?: string;
  hostImageUrl?: string;

  // Liên kết 1-n
  images?: ImageDTO[];
  prices?: PriceDTO[];
  details?: DetailDTO[];

  // Liên kết n-n (backend trả về object lists, không có IDs)
  amenities?: AmenityDTO[];
  utilities?: UtilityDTO[];
}

// CreateCondotelDTO - For creating new condotel (without condotelId)
export interface CreateCondotelDTO {
  hostId: number;
  resortId?: number;
  name: string;
  description?: string;
  pricePerNight: number;
  beds: number;
  bathrooms: number;
  status: string;

  // Liên kết 1-n
  images?: ImageDTO[];
  prices?: PriceDTO[];
  details?: DetailDTO[];

  // Liên kết n-n
  amenityIds?: number[];
  utilityIds?: number[];
}

// API Calls
export const condotelAPI = {
  // GET /api/condotel - Lấy tất cả condotels
  getAll: async (): Promise<CondotelDTO[]> => {
    const response = await axiosClient.get<CondotelDTO[]>("/host/condotel");
    return response.data;
  },

  // GET /api/condotel/{id} - Lấy condotel theo ID
  getById: async (id: number): Promise<CondotelDetailDTO> => {
    const response = await axiosClient.get<CondotelDetailDTO>(`/host/condotel/${id}`);
    return response.data;
  },

  // POST /api/condotel - Tạo condotel mới
  create: async (condotel: CreateCondotelDTO): Promise<CondotelDetailDTO> => {
    const response = await axiosClient.post<CondotelDetailDTO>("/host/condotel", condotel);
    return response.data;
  },

  // PUT /api/condotel/{id} - Cập nhật condotel
  update: async (
    id: number,
    condotel: CondotelDetailDTO
  ): Promise<CondotelDetailDTO> => {
    const response = await axiosClient.put<CondotelDetailDTO>(`/host/condotel/${id}`, condotel);
    return response.data;
  },

  // DELETE /api/condotel/{id} - Xóa condotel
  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/host/condotel/${id}`);
  },

  // Promotion APIs - Sử dụng endpoints từ PromotionController
  // GET /api/promotion - Lấy tất cả promotions
  getPromotions: async (condotelId?: number): Promise<PromotionDTO[]> => {
    if (condotelId) {
      // GET /api/promotion/condotel/{condotelId} - Lấy promotions theo condotelId
      const response = await axiosClient.get<PromotionDTO[]>(`/promotion/condotel/${condotelId}`);
      return response.data;
    }
    // GET /api/promotion - Lấy tất cả promotions
    const response = await axiosClient.get<PromotionDTO[]>("/promotion");
    return response.data;
  },

  // GET /api/promotion/{id} - Lấy promotion theo ID
  getPromotionById: async (promotionId: number): Promise<PromotionDTO> => {
    const response = await axiosClient.get<PromotionDTO>(`/promotion/${promotionId}`);
    return response.data;
  },

  // POST /api/promotion - Tạo promotion mới
  createPromotion: async (promotion: CreatePromotionDTO): Promise<PromotionDTO> => {
    const response = await axiosClient.post<PromotionDTO>("/promotion", promotion);
    return response.data;
  },

  // PUT /api/promotion/{id} - Cập nhật promotion
  updatePromotion: async (
    promotionId: number,
    promotion: UpdatePromotionDTO
  ): Promise<{ message: string }> => {
    const response = await axiosClient.put<{ message: string }>(
      `/promotion/${promotionId}`,
      promotion
    );
    return response.data;
  },

  // DELETE /api/promotion/{id} - Xóa promotion
  deletePromotion: async (promotionId: number): Promise<void> => {
    await axiosClient.delete(`/promotion/${promotionId}`);
  },
};

export default condotelAPI;
