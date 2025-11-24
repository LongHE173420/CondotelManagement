import axiosClient from "./axiosClient";

// DTOs từ backend ServicePackage
export interface ServicePackageDTO {
  packageId?: number;
  servicePackageId?: number;
  name: string;
  title?: string;
  description?: string;
  price: number;
  duration?: number; // Số ngày/tháng
  durationUnit?: string; // "day", "month", "year"
  features?: string[]; // Danh sách tính năng
  featuresList?: string; // JSON string hoặc comma-separated
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServicePackageDTO {
  name: string;
  title?: string;
  description?: string;
  price: number;
  duration?: number;
  durationUnit?: string;
  features?: string[];
  featuresList?: string;
  isActive?: boolean;
  status?: string;
}

export interface UpdateServicePackageDTO {
  name?: string;
  title?: string;
  description?: string;
  price?: number;
  duration?: number;
  durationUnit?: string;
  features?: string[];
  featuresList?: string;
  isActive?: boolean;
  status?: string;
}

// API Calls
export const servicePackageAPI = {
  // GET /api/host/service-packages - Lấy tất cả service packages của host
  getAll: async (): Promise<ServicePackageDTO[]> => {
    const response = await axiosClient.get<any[]>("/host/service-packages");
    // Normalize response từ backend (PascalCase -> camelCase)
    return response.data.map((item: any) => ({
      packageId: item.PackageId || item.packageId || item.ServicePackageId || item.servicePackageId,
      servicePackageId: item.ServicePackageId || item.servicePackageId || item.PackageId || item.packageId,
      name: item.Name || item.name || item.Title || item.title,
      title: item.Title || item.title || item.Name || item.name,
      description: item.Description || item.description,
      price: item.Price !== undefined ? item.Price : item.price,
      duration: item.Duration !== undefined ? item.Duration : item.duration,
      durationUnit: item.DurationUnit || item.durationUnit,
      features: item.Features || item.features || (item.FeaturesList || item.featuresList ? 
        (typeof (item.FeaturesList || item.featuresList) === 'string' ? 
          (item.FeaturesList || item.featuresList).split(',').map((f: string) => f.trim()) : 
          (item.FeaturesList || item.featuresList)) : undefined),
      featuresList: item.FeaturesList || item.featuresList,
      isActive: item.IsActive !== undefined ? item.IsActive : item.isActive !== undefined ? item.isActive : true,
      status: item.Status || item.status,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
    }));
  },

  // GET /api/host/service-packages/{id} - Lấy service package theo ID
  getById: async (id: number): Promise<ServicePackageDTO> => {
    const response = await axiosClient.get<any>(`/host/service-packages/${id}`);
    const item = response.data;
    return {
      packageId: item.PackageId || item.packageId || item.ServicePackageId || item.servicePackageId,
      servicePackageId: item.ServicePackageId || item.servicePackageId || item.PackageId || item.packageId,
      name: item.Name || item.name || item.Title || item.title,
      title: item.Title || item.title || item.Name || item.name,
      description: item.Description || item.description,
      price: item.Price !== undefined ? item.Price : item.price,
      duration: item.Duration !== undefined ? item.Duration : item.duration,
      durationUnit: item.DurationUnit || item.durationUnit,
      features: item.Features || item.features || (item.FeaturesList || item.featuresList ? 
        (typeof (item.FeaturesList || item.featuresList) === 'string' ? 
          (item.FeaturesList || item.featuresList).split(',').map((f: string) => f.trim()) : 
          (item.FeaturesList || item.featuresList)) : undefined),
      featuresList: item.FeaturesList || item.featuresList,
      isActive: item.IsActive !== undefined ? item.IsActive : item.isActive !== undefined ? item.isActive : true,
      status: item.Status || item.status,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
    };
  },

  // POST /api/host/service-packages - Tạo service package mới
  create: async (servicePackage: CreateServicePackageDTO): Promise<ServicePackageDTO> => {
    const response = await axiosClient.post<any>("/host/service-packages", servicePackage);
    const item = response.data;
    return {
      packageId: item.PackageId || item.packageId || item.ServicePackageId || item.servicePackageId,
      servicePackageId: item.ServicePackageId || item.servicePackageId || item.PackageId || item.packageId,
      name: item.Name || item.name || item.Title || item.title,
      title: item.Title || item.title || item.Name || item.name,
      description: item.Description || item.description,
      price: item.Price !== undefined ? item.Price : item.price,
      duration: item.Duration !== undefined ? item.Duration : item.duration,
      durationUnit: item.DurationUnit || item.durationUnit,
      features: item.Features || item.features,
      featuresList: item.FeaturesList || item.featuresList,
      isActive: item.IsActive !== undefined ? item.IsActive : item.isActive,
      status: item.Status || item.status,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
    };
  },

  // PUT /api/host/service-packages/{id} - Cập nhật service package
  update: async (
    id: number,
    servicePackage: UpdateServicePackageDTO
  ): Promise<ServicePackageDTO> => {
    const response = await axiosClient.put<any>(`/host/service-packages/${id}`, servicePackage);
    const item = response.data;
    return {
      packageId: item.PackageId || item.packageId || item.ServicePackageId || item.servicePackageId,
      servicePackageId: item.ServicePackageId || item.servicePackageId || item.PackageId || item.packageId,
      name: item.Name || item.name || item.Title || item.title,
      title: item.Title || item.title || item.Name || item.name,
      description: item.Description || item.description,
      price: item.Price !== undefined ? item.Price : item.price,
      duration: item.Duration !== undefined ? item.Duration : item.duration,
      durationUnit: item.DurationUnit || item.durationUnit,
      features: item.Features || item.features,
      featuresList: item.FeaturesList || item.featuresList,
      isActive: item.IsActive !== undefined ? item.IsActive : item.isActive,
      status: item.Status || item.status,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
    };
  },

  // DELETE /api/host/service-packages/{id} - Xóa service package
  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/host/service-packages/${id}`);
  },
};

export default servicePackageAPI;






