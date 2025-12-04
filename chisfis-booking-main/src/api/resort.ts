import axiosClient from "./axiosClient";

// Resort DTO
export interface ResortDTO {
  resortId: number;
  name: string;
  description?: string;
  locationId?: number;
  address?: string;
  city?: string;
  country?: string;
}

// API Calls
export const resortAPI = {
  // GET /api/host/resorts - Lấy tất cả resorts
  getAll: async (): Promise<ResortDTO[]> => {
    const response = await axiosClient.get<any>("/host/resorts");
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const resorts = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return resorts.map((item: any) => ({
      resortId: item.ResortId || item.resortId,
      name: item.Name || item.name,
      description: item.Description || item.description,
      locationId: item.LocationId || item.locationId,
      address: item.Address || item.address,
      city: item.City || item.city,
      country: item.Country || item.country,
    }));
  },

  // GET /api/host/resorts/{id} - Lấy resort theo ID
  getById: async (id: number): Promise<ResortDTO> => {
    const response = await axiosClient.get<any>(`/host/resorts/${id}`);
    const data = response.data;
    
    return {
      resortId: data.ResortId || data.resortId,
      name: data.Name || data.name,
      description: data.Description || data.description,
      locationId: data.LocationId || data.locationId,
      address: data.Address || data.address,
      city: data.City || data.city,
      country: data.Country || data.country,
    };
  },

  // GET /api/host/resorts/location/{locationId} - Lấy resorts theo Location ID
  getByLocationId: async (locationId: number): Promise<ResortDTO[]> => {
    const response = await axiosClient.get<any>(`/host/resorts/location/${locationId}`);
    const data = response.data;
    
    // Normalize response
    const resorts = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return resorts.map((item: any) => ({
      resortId: item.ResortId || item.resortId,
      name: item.Name || item.name,
      description: item.Description || item.description,
      locationId: item.LocationId || item.locationId,
      address: item.Address || item.address,
      city: item.City || item.city,
      country: item.Country || item.country,
    }));
  },

  // ========== ADMIN ENDPOINTS (cần role Admin) ==========
  
  // GET /api/admin/resorts - Lấy tất cả resorts (admin only)
  getAllAdmin: async (): Promise<ResortDTO[]> => {
    const response = await axiosClient.get<any>("/admin/resorts");
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const resorts = data.success && data.data ? data.data : (Array.isArray(data) ? data : (data.data || []));
    
    return resorts.map((item: any) => ({
      resortId: item.ResortId || item.resortId,
      name: item.Name || item.name,
      description: item.Description || item.description,
      locationId: item.LocationId || item.locationId,
      address: item.Address || item.address,
      city: item.City || item.city,
      country: item.Country || item.country,
    }));
  },

  // GET /api/admin/resorts/{id} - Lấy resort theo ID (admin only)
  getByIdAdmin: async (id: number): Promise<ResortDTO> => {
    const response = await axiosClient.get<any>(`/admin/resorts/${id}`);
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const resort = data.success && data.data ? data.data : data;
    
    return {
      resortId: resort.ResortId || resort.resortId,
      name: resort.Name || resort.name,
      description: resort.Description || resort.description,
      locationId: resort.LocationId || resort.locationId,
      address: resort.Address || resort.address,
      city: resort.City || resort.city,
      country: resort.Country || resort.country,
    };
  },

  // GET /api/admin/resorts/location/{locationId} - Lấy resorts theo LocationId (admin only)
  getByLocationIdAdmin: async (locationId: number): Promise<ResortDTO[]> => {
    const response = await axiosClient.get<any>(`/admin/resorts/location/${locationId}`);
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const resorts = data.success && data.data ? data.data : (Array.isArray(data) ? data : (data.data || []));
    
    return resorts.map((item: any) => ({
      resortId: item.ResortId || item.resortId,
      name: item.Name || item.name,
      description: item.Description || item.description,
      locationId: item.LocationId || item.locationId,
      address: item.Address || item.address,
      city: item.City || item.city,
      country: item.Country || item.country,
    }));
  },

  // POST /api/admin/resorts - Tạo resort mới (admin only)
  createAdmin: async (dto: ResortDTO | Omit<ResortDTO, 'resortId'>): Promise<ResortDTO> => {
    const response = await axiosClient.post<any>("/admin/resorts", dto);
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const resort = data.success && data.data ? data.data : data;
    
    return {
      resortId: resort.ResortId || resort.resortId,
      name: resort.Name || resort.name,
      description: resort.Description || resort.description,
      locationId: resort.LocationId || resort.locationId,
      address: resort.Address || resort.address,
      city: resort.City || resort.city,
      country: resort.Country || resort.country,
    };
  },

  // PUT /api/admin/resorts/{id} - Cập nhật resort (admin only)
  updateAdmin: async (id: number, dto: Omit<ResortDTO, 'resortId'>): Promise<ResortDTO> => {
    const response = await axiosClient.put<any>(`/admin/resorts/${id}`, dto);
    const data = response.data;
    
    // Backend trả về { success, data, message }
    const resort = data.success && data.data ? data.data : data;
    
    return {
      resortId: resort.ResortId || resort.resortId,
      name: resort.Name || resort.name,
      description: resort.Description || resort.description,
      locationId: resort.LocationId || resort.locationId,
      address: resort.Address || resort.address,
      city: resort.City || resort.city,
      country: resort.Country || resort.country,
    };
  },

  // DELETE /api/admin/resorts/{id} - Xóa resort (admin only)
  deleteAdmin: async (id: number): Promise<void> => {
    await axiosClient.delete(`/admin/resorts/${id}`);
  },
};

export default resortAPI;







