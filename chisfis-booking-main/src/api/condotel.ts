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
// Lưu ý: HostId sẽ được backend tự động lấy từ JWT token, không cần gửi từ frontend
export interface CreateCondotelDTO {
  resortId?: number; // Optional
  name: string;
  description?: string;
  pricePerNight: number;
  beds: number;
  bathrooms: number;
  status: string; // "Pending", "Active", "Inactive", "Available", "Unavailable"

  // Liên kết 1-n
  images?: Array<{ 
    imageUrl: string; 
    caption?: string;
    // ImageId không cần khi create (sẽ được backend tự tạo)
  }>;
  
  prices?: Array<{ 
    startDate: string; // DateOnly format: YYYY-MM-DD
    endDate: string; // DateOnly format: YYYY-MM-DD
    basePrice: number;
    priceType: string;
    description: string; // Required trong backend PriceDTO
    // PriceId không cần khi create (sẽ được backend tự tạo)
  }>;
  
  details?: Array<{ 
    buildingName?: string;
    roomNumber?: string;
    beds?: number; // byte in C# - optional
    bathrooms?: number; // byte in C# - optional
    safetyFeatures?: string;
    hygieneStandards?: string;
  }>;

  // Liên kết n-n - chỉ cần IDs
  amenityIds?: number[];
  utilityIds?: number[];
}

// API Calls
export const condotelAPI = {
  // GET /api/tenant/condotel - Lấy tất cả condotels (public, không cần đăng nhập)
  getAll: async (): Promise<CondotelDTO[]> => {
    const response = await axiosClient.get<CondotelDTO[]>("/tenant/condotel");
    return response.data || [];
  },

  // GET /api/tenant/condotel/{id} - Lấy chi tiết condotel (public, không cần đăng nhập)
  getById: async (id: number): Promise<CondotelDetailDTO> => {
    const response = await axiosClient.get<CondotelDetailDTO>(`/tenant/condotel/${id}`);
    return response.data;
  },

  // GET /api/tenant/condotel/location?name=Da Nang - Tìm kiếm condotel theo location
  getCondotelsByLocation: async (locationName?: string): Promise<CondotelDTO[]> => {
    const params = locationName ? { name: locationName } : {};
    const response = await axiosClient.get<CondotelDTO[]>("/tenant/condotel/location", { params });
    return response.data || [];
  },

  // GET /api/tenant/condotel/location?name=Da Nang - Tìm kiếm condotel theo location (public, AllowAnonymous)
  // Sử dụng endpoint tenant vì nó là public và không cần authentication
  getCondotelsByLocationPublic: async (locationName?: string): Promise<CondotelDTO[]> => {
    const params = locationName ? { name: locationName } : {};
    const response = await axiosClient.get<CondotelDTO[]>("/tenant/condotel/location", { params });
    return response.data || [];
  },

  // GET /api/host/condotel - Lấy tất cả condotels của host (cần đăng nhập)
  getAllForHost: async (): Promise<CondotelDTO[]> => {
    const response = await axiosClient.get<CondotelDTO[]>("/host/condotel");
    return response.data;
  },

  // GET /api/host/condotel/{id} - Lấy condotel theo ID của host (cần đăng nhập)
  getByIdForHost: async (id: number): Promise<CondotelDetailDTO> => {
    const response = await axiosClient.get<CondotelDetailDTO>(`/host/condotel/${id}`);
    return response.data;
  },

  // POST /api/host/condotel - Tạo condotel mới
  // Lưu ý: HostId sẽ được backend tự động lấy từ JWT token (JsonIgnore trong DTO)
  create: async (condotel: CreateCondotelDTO): Promise<CondotelDetailDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {
      Name: condotel.name,
      PricePerNight: condotel.pricePerNight,
      Beds: condotel.beds,
      Bathrooms: condotel.bathrooms,
      Status: condotel.status,
    };
    
    // Optional fields
    if (condotel.resortId !== undefined && condotel.resortId !== null) {
      requestData.ResortId = condotel.resortId;
    }
    if (condotel.description) {
      requestData.Description = condotel.description;
    }
    
    // Images - map sang PascalCase (không gửi ImageId khi create)
    if (condotel.images && condotel.images.length > 0) {
      requestData.Images = condotel.images.map(img => ({
        ImageUrl: img.imageUrl,
        Caption: img.caption || null,
      }));
    }
    
    // Prices - map sang PascalCase (không gửi PriceId khi create, nhưng Description là required)
    if (condotel.prices && condotel.prices.length > 0) {
      requestData.Prices = condotel.prices.map(p => ({
        StartDate: p.startDate,
        EndDate: p.endDate,
        BasePrice: p.basePrice,
        PriceType: p.priceType,
        Description: p.description || "", // Required trong backend
      }));
    }
    
    // Details - map sang PascalCase
    if (condotel.details && condotel.details.length > 0) {
      requestData.Details = condotel.details.map(d => {
        const detail: any = {};
        if (d.buildingName) detail.BuildingName = d.buildingName;
        if (d.roomNumber) detail.RoomNumber = d.roomNumber;
        if (d.beds !== undefined) detail.Beds = d.beds;
        if (d.bathrooms !== undefined) detail.Bathrooms = d.bathrooms;
        if (d.safetyFeatures) detail.SafetyFeatures = d.safetyFeatures;
        if (d.hygieneStandards) detail.HygieneStandards = d.hygieneStandards;
        return detail;
      });
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

  // DELETE /api/condotel/{id} - "Xóa" condotel bằng cách chuyển status sang "Inactive"
  delete: async (id: number): Promise<CondotelDetailDTO> => {
    // Lấy thông tin condotel hiện tại
    const currentCondotel = await axiosClient.get<CondotelDetailDTO>(`/host/condotel/${id}`).then(res => res.data);
    
    // Cập nhật status thành "Inactive" thay vì xóa thật sự
    const updatedCondotel: CondotelDetailDTO = {
      ...currentCondotel,
      status: "Inactive",
    };
    
    // Gọi API update để thay đổi status
    const response = await axiosClient.put<CondotelDetailDTO>(`/host/condotel/${id}`, updatedCondotel);
    return response.data;
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
