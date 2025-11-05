import axiosClient from "./axiosClient";

// Sub DTOs for CondotelDetailDTO
export interface ImageDTO {
  imageId?: number; // Optional - không cần khi create
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
  beds?: number; // Optional - có thể lấy từ condotel level
  bathrooms?: number; // Optional - có thể lấy từ condotel level
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

// CreateCondotelDTO - For creating new condotel (matches CondotelCreateDTO from backend)
export interface CreateCondotelDTO {
  hostId: number;
  resortId?: number; // Optional
  name: string;
  description?: string;
  pricePerNight: number;
  beds: number;
  bathrooms: number;
  status: string; // "Pending", "Active", "Inactive", "Available", "Unavailable"

  // Liên kết 1-n
  images?: Array<{ imageUrl: string; caption?: string }>; // Không cần imageId khi create
  prices?: Array<{ startDate: string; endDate: string; basePrice: number; priceType: string; description?: string }>; // Không cần priceId khi create
  details?: Array<{ buildingName?: string; roomNumber?: string; beds?: number; bathrooms?: number; safetyFeatures?: string; hygieneStandards?: string }>; // Beds, bathrooms optional (có thể dùng từ condotel level)

  // Liên kết n-n - chỉ cần IDs
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
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {
      HostId: condotel.hostId,
      Name: condotel.name,
      PricePerNight: condotel.pricePerNight,
      Beds: condotel.beds,
      Bathrooms: condotel.bathrooms,
      Status: condotel.status,
    };
    
    // Optional fields
    if (condotel.resortId) {
      requestData.ResortId = condotel.resortId;
    }
    if (condotel.description) {
      requestData.Description = condotel.description;
    }
    
    // Images - map sang PascalCase
    if (condotel.images && condotel.images.length > 0) {
      requestData.Images = condotel.images.map(img => ({
        ImageUrl: img.imageUrl,
        Caption: img.caption,
      }));
    }
    
    // Prices - map sang PascalCase
    if (condotel.prices && condotel.prices.length > 0) {
      requestData.Prices = condotel.prices.map(p => ({
        StartDate: p.startDate,
        EndDate: p.endDate,
        BasePrice: p.basePrice,
        PriceType: p.priceType,
        Description: p.description,
      }));
    }
    
    // Details - map sang PascalCase
    if (condotel.details && condotel.details.length > 0) {
      requestData.Details = condotel.details.map(d => ({
        BuildingName: d.buildingName,
        RoomNumber: d.roomNumber,
        Beds: d.beds,
        Bathrooms: d.bathrooms,
        SafetyFeatures: d.safetyFeatures,
        HygieneStandards: d.hygieneStandards,
      }));
    }
    
    // AmenityIds và UtilityIds
    if (condotel.amenityIds && condotel.amenityIds.length > 0) {
      requestData.AmenityIds = condotel.amenityIds;
    }
    if (condotel.utilityIds && condotel.utilityIds.length > 0) {
      requestData.UtilityIds = condotel.utilityIds;
    }
    
    console.log("📤 Creating condotel with data:", JSON.stringify(requestData, null, 2));
    
    const response = await axiosClient.post<CondotelDetailDTO>("/host/condotel", requestData);
    
    console.log("✅ Condotel created successfully:", response.data);
    
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
