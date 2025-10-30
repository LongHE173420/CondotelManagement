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

  // Liên kết 1-n
  images?: ImageDTO[];
  prices?: PriceDTO[];
  details?: DetailDTO[];

  // Liên kết n-n
  amenityIds?: number[];
  utilityIds?: number[];
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
};

export default condotelAPI;
