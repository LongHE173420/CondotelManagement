import axiosClient from "./axiosClient";

// DTOs từ backend ServicePackage
// ServicePackage gồm 6 trường chính: ServiceID, Name, Description, Price, Status, HostID
export interface ServicePackageDTO {
  servicePackageId: number; // ServiceID
  name: string; // Name
  description?: string; // Description
  price: number; // Price
  status: "Active" | "Inactive"; // Status
  hostId?: number; // HostID
  
  // Các trường optional cho backward compatibility với code cũ
  packageId?: number; // Alias cho servicePackageId
  serviceId?: number; // ID từ API tenant
  title?: string; // Alias cho name
  isActive?: boolean; // Alias cho status === "Active"
  duration?: number;
  durationUnit?: string;
  features?: string[];
  featuresList?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServicePackageDTO {
  name: string; // Required, max 100 ký tự
  description?: string; // Optional, max 255 ký tự
  price: number; // Required, từ 0.01 đến 9,999,999,999.99
  // Optional fields for backward compatibility
  duration?: number;
  durationUnit?: string;
  features?: string[];
  isActive?: boolean;
}

export interface UpdateServicePackageDTO {
  name?: string; // max 100 ký tự
  description?: string; // max 255 ký tự
  price?: number; // từ 0.01 đến 9,999,999,999.99
  status?: "Active" | "Inactive";
  // Optional fields for backward compatibility
  duration?: number;
  durationUnit?: string;
  features?: string[];
  isActive?: boolean;
}

// Helper function để normalize service package từ PascalCase sang camelCase
const normalizeServicePackage = (item: any): ServicePackageDTO => {
  const servicePackageId = item.ServicePackageId || item.servicePackageId || item.Id || item.id;
  const status = item.Status || item.status || "Active";
  
  return {
    servicePackageId: servicePackageId,
    packageId: servicePackageId, // Alias cho backward compatibility
    serviceId: item.ServiceId || item.serviceId,
    hostId: item.HostId !== undefined ? item.HostId : item.hostId,
    name: item.Name || item.name || item.Title || item.title,
    title: item.Title || item.title || item.Name || item.name, // Alias cho backward compatibility
    description: item.Description || item.description,
    price: item.Price !== undefined ? item.Price : item.price,
    status: status,
    isActive: status === "Active", // Alias cho backward compatibility
    duration: item.Duration !== undefined ? item.Duration : item.duration,
    durationUnit: item.DurationUnit || item.durationUnit,
    features: item.Features || item.features || (item.FeaturesList || item.featuresList ? 
      (typeof (item.FeaturesList || item.featuresList) === 'string' ? 
        (item.FeaturesList || item.featuresList).split(',').map((f: string) => f.trim()) : 
        (item.FeaturesList || item.featuresList)) : undefined),
    featuresList: item.FeaturesList || item.featuresList,
    createdAt: item.CreatedAt || item.createdAt,
    updatedAt: item.UpdatedAt || item.updatedAt,
  };
};

// API Calls
export const servicePackageAPI = {
  // GET /api/host/service-packages - Lấy danh sách service packages của host hiện tại
  // Quyền: Role "Host"
  // Logic: Lấy hostId từ user đăng nhập, trả về các service packages có Status = "Active" của host đó
  getAll: async (): Promise<ServicePackageDTO[]> => {
    const response = await axiosClient.get<any>("/host/service-packages");
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const packages = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return packages.map((item: any) => normalizeServicePackage(item));
  },

  // GET /api/host/service-packages/{id} - Lấy chi tiết một service package
  // Quyền: Role "Host"
  getById: async (id: number): Promise<ServicePackageDTO> => {
    const response = await axiosClient.get<any>(`/host/service-packages/${id}`);
    const data = response.data;
    
    // Handle response format: có thể là object trực tiếp hoặc trong data property
    const item = data.data || data;
    
    return normalizeServicePackage(item);
  },

  // POST /api/host/service-packages - Tạo service package mới
  // Quyền: Role "Host"
  // Request Body: { name, description?, price }
  // Validation: Name (Required, max 100), Description (Optional, max 255), Price (Required, 0.01-9,999,999,999.99)
  // Logic: Tự động set Status = "Active", Gán HostID từ user đăng nhập
  create: async (servicePackage: CreateServicePackageDTO): Promise<ServicePackageDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {
      Name: servicePackage.name,
      Price: servicePackage.price,
    };
    
    if (servicePackage.description) {
      requestData.Description = servicePackage.description;
    }
    
    const response = await axiosClient.post<any>("/host/service-packages", requestData);
    const data = response.data;
    
    // Handle response format
    const item = data.data || data;
    
    return normalizeServicePackage(item);
  },

  // PUT /api/host/service-packages/{id} - Cập nhật service package
  // Quyền: Role "Host"
  // Request Body: { name?, description?, price?, status? }
  update: async (
    id: number,
    servicePackage: UpdateServicePackageDTO
  ): Promise<ServicePackageDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {};
    
    if (servicePackage.name !== undefined) {
      requestData.Name = servicePackage.name;
    }
    if (servicePackage.description !== undefined) {
      requestData.Description = servicePackage.description;
    }
    if (servicePackage.price !== undefined) {
      requestData.Price = servicePackage.price;
    }
    if (servicePackage.status !== undefined) {
      requestData.Status = servicePackage.status;
    }
    
    const response = await axiosClient.put<any>(`/host/service-packages/${id}`, requestData);
    const data = response.data;
    
    // Handle response format
    const item = data.data || data;
    
    return normalizeServicePackage(item);
  },

  // DELETE /api/host/service-packages/{id} - Xóa service package (soft delete)
  // Quyền: Role "Host"
  // Logic: Đổi Status = "Inactive" thay vì xóa khỏi database
  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosClient.delete<any>(`/host/service-packages/${id}`);
    const data = response.data;
    
    // Backend có thể trả về { success, message } hoặc chỉ message
    if (data.success !== undefined) {
      return {
        success: data.success,
        message: data.message || data.Message,
      };
    }
    
    // Nếu không có success field, coi như thành công nếu không có lỗi
    return {
      success: true,
      message: data.message || data.Message || "Đã xóa service package thành công",
    };
  },

  // GET /api/tenant/condotels/{id}/service-packages - Lấy danh sách service packages của một condotel (cho tenant xem khi đặt phòng)
  // Quyền: Public (AllowAnonymous)
  // Logic: Tìm condotel theo ID, Lấy HostId của condotel, Trả về các service packages Active của host đó
  getByCondotel: async (condotelId: number): Promise<ServicePackageDTO[]> => {
    const response = await axiosClient.get<any>(`/tenant/condotels/${condotelId}/service-packages`);
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const packages = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return packages.map((item: any) => normalizeServicePackage(item));
  },
};

export default servicePackageAPI;






