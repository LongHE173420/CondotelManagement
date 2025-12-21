import axiosClient from "./axiosClient";
import logger from "utils/logger";

export interface LocationCreateUpdateDTO {
  name: string;
  description?: string;
  imageUrl?: string;
  ward?: string; // Xã/Phường
  district?: string; // Quận/Huyện
}

export interface LocationDTO {
  locationId: number;
  name: string; // Tên tỉnh/thành phố
  description?: string;
  imageUrl?: string;
  ward?: string; // Xã/Phường
  district?: string; // Quận/Huyện
}

// API Response Types (support both PascalCase and camelCase from backend)
interface LocationResponseRaw {
  LocationId?: number;
  locationId?: number;
  Id?: number;
  id?: number;
  Name?: string;
  name?: string;
  LocationName?: string;
  locationName?: string;
  Description?: string;
  description?: string;
  ImageUrl?: string;
  imageUrl?: string;
  ImageURL?: string;
  imageURL?: string;
  Ward?: string;
  ward?: string;
  District?: string;
  district?: string;
}

interface ApiResponseWrapper<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

interface WardDistrictResponseRaw {
  Ward?: string;
  ward?: string;
  Name?: string;
  name?: string;
}

// Helper function to normalize location response
const normalizeLocation = (loc: LocationResponseRaw): LocationDTO => {
  return {
    locationId: loc.LocationId ?? loc.locationId ?? loc.Id ?? loc.id ?? 0,
    name: loc.Name ?? loc.name ?? loc.LocationName ?? loc.locationName ?? "",
    description: loc.Description ?? loc.description ?? "",
    imageUrl: loc.ImageUrl ?? loc.imageUrl ?? loc.ImageURL ?? loc.imageURL ?? "",
    ward: loc.Ward ?? loc.ward ?? "",
    district: loc.District ?? loc.district ?? "",
  };
};

// Helper function to normalize array response
const normalizeLocationArray = (data: unknown): LocationDTO[] => {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeLocation(item as LocationResponseRaw));
  }
  
  const wrapper = data as ApiResponseWrapper<LocationResponseRaw[]>;
  if (wrapper.success && Array.isArray(wrapper.data)) {
    return wrapper.data.map(normalizeLocation);
  }
  
  if (wrapper.data && Array.isArray(wrapper.data)) {
    return wrapper.data.map(normalizeLocation);
  }
  
  return [];
};

// Helper function to normalize single location response
const normalizeLocationSingle = (data: unknown): LocationDTO => {
  const wrapper = data as ApiResponseWrapper<LocationResponseRaw>;
  const location = (wrapper.success && wrapper.data) 
    ? wrapper.data 
    : (data as LocationResponseRaw);
  
  return normalizeLocation(location);
};

// Helper function to normalize ward/district array
const normalizeWardDistrictArray = (data: unknown): string[] => {
  if (Array.isArray(data)) {
    return data.map((item) => {
      const raw = item as WardDistrictResponseRaw | string;
      if (typeof raw === 'string') return raw;
      return raw.Ward ?? raw.ward ?? raw.Name ?? raw.name ?? String(raw);
    });
  }
  
  const wrapper = data as ApiResponseWrapper<(WardDistrictResponseRaw | string)[]>;
  if (wrapper.success && Array.isArray(wrapper.data)) {
    return wrapper.data.map((item) => {
      const raw = item as WardDistrictResponseRaw | string;
      if (typeof raw === 'string') return raw;
      return raw.Ward ?? raw.ward ?? raw.Name ?? raw.name ?? String(raw);
    });
  }
  
  if (wrapper.data && Array.isArray(wrapper.data)) {
    return wrapper.data.map((item) => {
      const raw = item as WardDistrictResponseRaw | string;
      if (typeof raw === 'string') return raw;
      return raw.Ward ?? raw.ward ?? raw.Name ?? raw.name ?? String(raw);
    });
  }
  
  return [];
};

const locationAPI = {
  // ========== PUBLIC ENDPOINTS (không cần auth) ==========
  
  // GET /api/tenant/locations - Lấy tất cả locations (public, không cần đăng nhập)
  getAllPublic: async (): Promise<LocationDTO[]> => {
    try {
      const response = await axiosClient.get<LocationResponseRaw[] | ApiResponseWrapper<LocationResponseRaw[]>>("/tenant/locations");
      return normalizeLocationArray(response.data);
    } catch (error: unknown) {
      logger.error("Error loading locations:", error);
      throw error;
    }
  },

  // GET /api/tenant/locations/{id} - Lấy location theo ID (public, không cần đăng nhập)
  getByIdPublic: async (id: number): Promise<LocationDTO> => {
    try {
      const response = await axiosClient.get<LocationResponseRaw | ApiResponseWrapper<LocationResponseRaw>>(`/tenant/locations/${id}`);
      return normalizeLocationSingle(response.data);
    } catch (error: unknown) {
      logger.error("Error loading location:", error);
      throw error;
    }
  },

  // GET /api/tenant/locations/search?keyword=abc - Search locations theo keyword (public, không cần đăng nhập)
  searchPublic: async (keyword: string): Promise<LocationDTO[]> => {
    try {
      const response = await axiosClient.get<LocationResponseRaw[] | ApiResponseWrapper<LocationResponseRaw[]>>("/tenant/locations/search", {
        params: { keyword },
      });
      return normalizeLocationArray(response.data);
    } catch (error: unknown) {
      logger.error("Error searching locations:", error);
      throw error;
    }
  },

  // GET /api/tenant/locations/{locationId}/wards - Lấy danh sách xã/phường theo locationId (public, không cần đăng nhập)
  getWardsByLocationIdPublic: async (locationId: number): Promise<string[]> => {
    try {
      const response = await axiosClient.get<(WardDistrictResponseRaw | string)[] | ApiResponseWrapper<(WardDistrictResponseRaw | string)[]>>(`/tenant/locations/${locationId}/wards`);
      return normalizeWardDistrictArray(response.data);
    } catch (error: unknown) {
      logger.error("Error loading wards:", error);
      // Nếu API không tồn tại, trả về mảng rỗng
      return [];
    }
  },

  // GET /api/tenant/locations/{locationId}/districts - Lấy danh sách quận/huyện theo locationId (public, không cần đăng nhập)
  getDistrictsByLocationIdPublic: async (locationId: number): Promise<string[]> => {
    try {
      const response = await axiosClient.get<(WardDistrictResponseRaw | string)[] | ApiResponseWrapper<(WardDistrictResponseRaw | string)[]>>(`/tenant/locations/${locationId}/districts`);
      return normalizeWardDistrictArray(response.data);
    } catch (error: unknown) {
      logger.error("Error loading districts:", error);
      // Nếu API không tồn tại, trả về mảng rỗng
      return [];
    }
  },

  // ========== HOST ENDPOINTS (cần role Host) ==========
  
  // POST /api/host/location - Tạo location mới (host only)
  create: async (dto: LocationCreateUpdateDTO): Promise<LocationDTO> => {
    const res = await axiosClient.post<LocationDTO>("/host/location", dto);
    return res.data;
  },

  // GET /api/host/location - Lấy tất cả locations của host (host only)
  getAll: async (): Promise<LocationDTO[]> => {
    const res = await axiosClient.get<LocationDTO[]>("/host/location");
    return res.data;
  },

  // GET /api/host/location/{id} - Lấy location theo ID (host only)
  getById: async (id: number): Promise<LocationDTO> => {
    const res = await axiosClient.get<LocationDTO>(`/host/location/${id}`);
    return res.data;
  },

  // ========== ADMIN ENDPOINTS (cần role Admin) ==========
  
  // GET /api/admin/location/all - Lấy tất cả locations (admin only)
  getAllAdmin: async (): Promise<LocationDTO[]> => {
    const response = await axiosClient.get<LocationResponseRaw[] | ApiResponseWrapper<LocationResponseRaw[]>>("/admin/location/all");
    return normalizeLocationArray(response.data);
  },

  // GET /api/admin/location/{id} - Lấy location theo ID (admin only)
  getByIdAdmin: async (id: number): Promise<LocationDTO> => {
    const response = await axiosClient.get<LocationResponseRaw | ApiResponseWrapper<LocationResponseRaw>>(`/admin/location/${id}`);
    return normalizeLocationSingle(response.data);
  },

  // POST /api/admin/location - Tạo location mới (admin only)
  createAdmin: async (dto: LocationCreateUpdateDTO): Promise<LocationDTO> => {
    const response = await axiosClient.post<LocationResponseRaw | ApiResponseWrapper<LocationResponseRaw>>("/admin/location", dto);
    return normalizeLocationSingle(response.data);
  },

  // PUT /api/admin/location/{id} - Cập nhật location (admin only)
  updateAdmin: async (id: number, dto: LocationCreateUpdateDTO): Promise<LocationDTO> => {
    const response = await axiosClient.put<LocationResponseRaw | ApiResponseWrapper<LocationResponseRaw>>(`/admin/location/${id}`, dto);
    return normalizeLocationSingle(response.data);
  },

  // DELETE /api/admin/location/{id} - Xóa location (admin only)
  deleteAdmin: async (id: number): Promise<void> => {
    await axiosClient.delete(`/admin/location/${id}`);
  },

  // GET /api/admin/location/{locationId}/wards - Lấy danh sách xã/phường theo locationId (admin only)
  getWardsByLocationId: async (locationId: number): Promise<string[]> => {
    try {
      const response = await axiosClient.get<(WardDistrictResponseRaw | string)[] | ApiResponseWrapper<(WardDistrictResponseRaw | string)[]>>(`/admin/location/${locationId}/wards`);
      return normalizeWardDistrictArray(response.data);
    } catch (error: unknown) {
      logger.error("Error loading wards:", error);
      // Nếu API không tồn tại, trả về mảng rỗng
      return [];
    }
  },

  // GET /api/admin/location/{locationId}/districts - Lấy danh sách quận/huyện theo locationId (admin only)
  getDistrictsByLocationId: async (locationId: number): Promise<string[]> => {
    try {
      const response = await axiosClient.get<(WardDistrictResponseRaw | string)[] | ApiResponseWrapper<(WardDistrictResponseRaw | string)[]>>(`/admin/location/${locationId}/districts`);
      return normalizeWardDistrictArray(response.data);
    } catch (error: unknown) {
      logger.error("Error loading districts:", error);
      // Nếu API không tồn tại, trả về mảng rỗng
      return [];
    }
  },
};

export default locationAPI;












