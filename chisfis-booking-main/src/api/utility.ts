import axiosClient from "./axiosClient";

export interface UtilityDTO {
  utilityId: number;
  name: string;
  description?: string;
  hostId?: number; // For admin utilities, HostId = 0 means system utility
}

export interface UtilityCreateUpdateDTO {
  name: string;
  description?: string;
  hostId?: number; // For admin: HostId = 0 for system utilities
}

// Helper function to normalize utility response
const normalizeUtility = (item: any): UtilityDTO => ({
  utilityId: item.UtilityId || item.utilityId,
  name: item.Name || item.name,
  description: item.Description || item.description,
  hostId: item.HostId || item.hostId,
});

const utilityAPI = {
  // ========== HOST ENDPOINTS ==========
  
  // GET /api/host/utility - Lấy danh sách utilities của host hiện tại
  getAll: async (): Promise<UtilityDTO[]> => {
    const response = await axiosClient.get<any>("/host/utility");
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const utilities = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return utilities.map(normalizeUtility);
  },

  // ========== ADMIN ENDPOINTS ==========
  
  // GET /api/admin/utilities - Lấy tất cả utilities (admin only)
  getAllAdmin: async (): Promise<UtilityDTO[]> => {
    const response = await axiosClient.get<any>("/admin/utilities");
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const utilities = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return utilities.map(normalizeUtility);
  },

  // GET /api/admin/utilities/{id} - Lấy utility theo ID (admin only)
  getByIdAdmin: async (id: number): Promise<UtilityDTO> => {
    const response = await axiosClient.get<any>(`/admin/utilities/${id}`);
    return normalizeUtility(response.data);
  },

  // POST /api/admin/utilities - Tạo utility mới (admin only)
  // HostId = 0 cho system utilities
  createAdmin: async (utility: UtilityCreateUpdateDTO): Promise<UtilityDTO> => {
    const response = await axiosClient.post<any>("/admin/utilities", {
      Name: utility.name,
      Description: utility.description,
      HostId: utility.hostId || 0, // Default to 0 for system utilities
    });
    return normalizeUtility(response.data);
  },

  // PUT /api/admin/utilities/{id} - Cập nhật utility (admin only)
  updateAdmin: async (id: number, utility: UtilityCreateUpdateDTO): Promise<UtilityDTO> => {
    const response = await axiosClient.put<any>(`/admin/utilities/${id}`, {
      Name: utility.name,
      Description: utility.description,
      HostId: utility.hostId,
    });
    return normalizeUtility(response.data);
  },

  // DELETE /api/admin/utilities/{id} - Xóa utility (admin only)
  deleteAdmin: async (id: number): Promise<void> => {
    await axiosClient.delete(`/admin/utilities/${id}`);
  },
};

export default utilityAPI;







