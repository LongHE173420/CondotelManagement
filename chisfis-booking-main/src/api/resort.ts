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

// Resort Utility Request DTO - Dùng khi thêm utility vào resort
export interface ResortUtilityRequestDTO {
  utilityId: number;
  status?: string; // Active, Inactive
  operatingHours?: string; // "8:00 - 22:00"
  cost?: number; // Chi phí sử dụng
  descriptionDetail?: string; // Mô tả chi tiết
  maximumCapacity?: number; // Sức chứa tối đa
}

// Resort Utility DTO - Utility với thông tin bổ sung khi đã được thêm vào resort
export interface ResortUtilityDTO {
  utilityId: number;
  name: string;
  description?: string;
  category?: string;
  status?: string;
  operatingHours?: string;
  cost?: number;
  descriptionDetail?: string;
  maximumCapacity?: number;
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

  // POST /api/admin/resorts/{resortId}/utilities - Thêm utility vào resort (admin only)
  addUtility: async (resortId: number, utility: ResortUtilityRequestDTO): Promise<void> => {
    const requestData: any = {
      utilityId: utility.utilityId,
    };
    
    if (utility.status) {
      requestData.status = utility.status;
    }
    
    if (utility.operatingHours) {
      requestData.operatingHours = utility.operatingHours;
    }
    
    if (utility.cost !== undefined) {
      requestData.cost = utility.cost;
    }
    
    if (utility.descriptionDetail) {
      requestData.descriptionDetail = utility.descriptionDetail;
    }
    
    if (utility.maximumCapacity !== undefined) {
      requestData.maximumCapacity = utility.maximumCapacity;
    }
    
    await axiosClient.post(`/admin/resorts/${resortId}/utilities`, requestData);
  },

  // GET /api/admin/resorts/{resortId}/utilities - Lấy danh sách utilities của resort (admin only)
  getUtilitiesByResortAdmin: async (resortId: number): Promise<ResortUtilityDTO[]> => {
    const response = await axiosClient.get<any>(`/admin/resorts/${resortId}/utilities`);
    const data = response.data;
    
    // Backend có thể trả về { success, data, message } hoặc array trực tiếp
    const utilities = data.success && data.data 
      ? data.data 
      : (Array.isArray(data) ? data : (data.data || []));
    
    // Normalize utilities - có thể có thêm thông tin như status, operatingHours, cost, etc.
    return utilities.map((item: any): ResortUtilityDTO => ({
      utilityId: item.UtilityId || item.utilityId,
      name: item.Name || item.name,
      description: item.Description || item.description,
      category: item.Category || item.category,
      status: item.Status || item.status,
      operatingHours: item.OperatingHours || item.operatingHours,
      cost: item.Cost !== undefined ? item.Cost : item.cost,
      descriptionDetail: item.DescriptionDetail || item.descriptionDetail,
      maximumCapacity: item.MaximumCapacity !== undefined ? item.MaximumCapacity : item.maximumCapacity,
    }));
  },

  // DELETE /api/admin/resorts/{resortId}/utilities/{utilityId} - Xóa utility khỏi resort (admin only)
  removeUtility: async (resortId: number, utilityId: number): Promise<void> => {
    await axiosClient.delete(`/admin/resorts/${resortId}/utilities/${utilityId}`);
  },
};

export default resortAPI;







