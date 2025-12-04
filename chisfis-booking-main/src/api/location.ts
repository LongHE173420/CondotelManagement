import axiosClient from "./axiosClient";

export interface LocationCreateUpdateDTO {
  // Thêm các trường cần thiết, tạm ví dụ:
  locationName: string;
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface LocationDTO {
  locationId: number;
  locationName: string;
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

const locationAPI = {
  // ========== PUBLIC ENDPOINTS (không cần auth) ==========
  
  // GET /api/tenant/locations - Lấy tất cả locations (public, không cần đăng nhập)
  getAllPublic: async (): Promise<LocationDTO[]> => {
    try {
      const response = await axiosClient.get<any>("/tenant/locations");
      const data = response.data;
      
      // Normalize response - handle both array and object with data property
      const locations = Array.isArray(data) ? data : (data.data || []);
      
      // Normalize locations - handle both PascalCase and camelCase
      return locations.map((loc: any) => ({
        locationId: loc.LocationId || loc.locationId || loc.Id || loc.id,
        locationName: loc.LocationName || loc.locationName || loc.Name || loc.name,
        address: loc.Address || loc.address,
        city: loc.City || loc.city,
        country: loc.Country || loc.country,
        postalCode: loc.PostalCode || loc.postalCode,
      }));
    } catch (error: any) {
      console.error("Error loading locations:", error);
      throw error;
    }
  },

  // GET /api/tenant/locations/{id} - Lấy location theo ID (public, không cần đăng nhập)
  getByIdPublic: async (id: number): Promise<LocationDTO> => {
    try {
      const response = await axiosClient.get<any>(`/tenant/locations/${id}`);
      const data = response.data;
      
      // Normalize response - handle both PascalCase and camelCase
      return {
        locationId: data.LocationId || data.locationId || data.Id || data.id,
        locationName: data.LocationName || data.locationName || data.Name || data.name,
        address: data.Address || data.address,
        city: data.City || data.city,
        country: data.Country || data.country,
        postalCode: data.PostalCode || data.postalCode,
      };
    } catch (error: any) {
      console.error("Error loading location:", error);
      throw error;
    }
  },

  // GET /api/tenant/locations/search?keyword=abc - Search locations theo keyword (public, không cần đăng nhập)
  searchPublic: async (keyword: string): Promise<LocationDTO[]> => {
    try {
      const response = await axiosClient.get<any>("/tenant/locations/search", {
        params: { keyword },
      });
      const data = response.data;
      
      // Normalize response - handle both array and object with data property
      const locations = Array.isArray(data) ? data : (data.data || []);
      
      // Normalize locations - handle both PascalCase and camelCase
      return locations.map((loc: any) => ({
        locationId: loc.LocationId || loc.locationId || loc.Id || loc.id,
        locationName: loc.LocationName || loc.locationName || loc.Name || loc.name,
        address: loc.Address || loc.address,
        city: loc.City || loc.city,
        country: loc.Country || loc.country,
        postalCode: loc.PostalCode || loc.postalCode,
      }));
    } catch (error: any) {
      console.error("Error searching locations:", error);
      throw error;
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
  
  // GET /api/admin/locations - Lấy tất cả locations (admin only)
  getAllAdmin: async (): Promise<LocationDTO[]> => {
    const response = await axiosClient.get<any>("/admin/locations");
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const locations = data.success && data.data ? data.data : (Array.isArray(data) ? data : (data.data || []));
    
    return locations.map((loc: any) => ({
      locationId: loc.LocationId || loc.locationId || loc.Id || loc.id,
      locationName: loc.LocationName || loc.locationName || loc.Name || loc.name,
      address: loc.Address || loc.address,
      city: loc.City || loc.city,
      country: loc.Country || loc.country,
      postalCode: loc.PostalCode || loc.postalCode,
    }));
  },

  // GET /api/admin/locations/{id} - Lấy location theo ID (admin only)
  getByIdAdmin: async (id: number): Promise<LocationDTO> => {
    const response = await axiosClient.get<any>(`/admin/locations/${id}`);
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const location = data.success && data.data ? data.data : data;
    
    return {
      locationId: location.LocationId || location.locationId || location.Id || location.id,
      locationName: location.LocationName || location.locationName || location.Name || location.name,
      address: location.Address || location.address,
      city: location.City || location.city,
      country: location.Country || location.country,
      postalCode: location.PostalCode || location.postalCode,
    };
  },

  // POST /api/admin/locations - Tạo location mới (admin only)
  createAdmin: async (dto: LocationCreateUpdateDTO): Promise<LocationDTO> => {
    const response = await axiosClient.post<any>("/admin/locations", dto);
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const location = data.success && data.data ? data.data : data;
    
    return {
      locationId: location.LocationId || location.locationId,
      locationName: location.LocationName || location.locationName,
      address: location.Address || location.address,
      city: location.City || location.city,
      country: location.Country || location.country,
      postalCode: location.PostalCode || location.postalCode,
    };
  },

  // PUT /api/admin/locations/{id} - Cập nhật location (admin only)
  updateAdmin: async (id: number, dto: LocationCreateUpdateDTO): Promise<LocationDTO> => {
    const response = await axiosClient.put<any>(`/admin/locations/${id}`, dto);
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const location = data.success && data.data ? data.data : data;
    
    return {
      locationId: location.LocationId || location.locationId,
      locationName: location.LocationName || location.locationName,
      address: location.Address || location.address,
      city: location.City || location.city,
      country: location.Country || location.country,
      postalCode: location.PostalCode || location.postalCode,
    };
  },

  // DELETE /api/admin/locations/{id} - Xóa location (admin only)
  deleteAdmin: async (id: number): Promise<void> => {
    await axiosClient.delete(`/admin/locations/${id}`);
  },
};

export default locationAPI;












