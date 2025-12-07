// src/api/adminPackageAPI.ts
import axiosClient from "./axiosClient";

export interface HostPackageItem {
    hostPackageId: number;
    hostName: string;
    email: string;
    phone: string;
    packageName: string;
    orderCode: string;
    amount: number;
    status: string;
    startDate: string;
    endDate: string;
    canActivate: boolean;
}

export interface ActivateResponse {
    message: string;
    hostName?: string;
}

// ============ THÊM CÁC TRƯỜNG FEATURES MỚI ============
export interface CatalogPackage {
    packageId: number;
    name: string;
    price: number;
    durationDays: number | null;
    description: string | null;
    isActive: boolean;

    // ======== THÊM CÁC TRƯỜNG FEATURES ========
    maxListingCount: number;           // Số condotel tối đa
    canUseFeaturedListing: boolean;    // Được đăng tin nổi bật không
    maxBlogRequestsPerMonth: number;   // Số blog tối đa mỗi tháng
    isVerifiedBadgeEnabled: boolean;   // Có badge xác minh không
    displayColorTheme: string;         // Theme màu hiển thị
    priorityLevel: number;             // Mức độ ưu tiên
}

export interface CreatePackageDto {
    name: string;
    price: number;
    durationDays: number;
    description: string;
    isActive: boolean;

    // ======== THÊM CÁC TRƯỜNG FEATURES ========
    maxListingCount: number;
    canUseFeaturedListing: boolean;
    maxBlogRequestsPerMonth: number;
    isVerifiedBadgeEnabled: boolean;
    displayColorTheme: string;
    priorityLevel: number;
}

export interface UpdatePackageDto {
    name: string;
    price: number;
    durationDays: number;
    description: string;
    isActive: boolean;

    // ======== THÊM CÁC TRƯỜNG FEATURES ========
    maxListingCount: number;
    canUseFeaturedListing: boolean;
    maxBlogRequestsPerMonth: number;
    isVerifiedBadgeEnabled: boolean;
    displayColorTheme: string;
    priorityLevel: number;
}

export const adminPackageAPI = {
    // ============ PHẦN CŨ ============
    getAll: async (search?: string): Promise<HostPackageItem[]> => {
        const response = await axiosClient.get<{ data: HostPackageItem[] } | HostPackageItem[]>(
            "/admin/packages",
            { params: search ? { search } : {} }
        );
        const result = (response as any).data || response;
        return Array.isArray(result) ? result : result.data || [];
    },

    activate: async (id: number): Promise<ActivateResponse> => {
        const response = await axiosClient.post<ActivateResponse>(
            `/admin/packages/${id}/activate`
        );
        return response.data;
    },

    // ============ THÊM PHẦN CATALOG ============
    getCatalog: async (): Promise<CatalogPackage[]> => {
        const response = await axiosClient.get<CatalogPackage[]>(
            "/admin/packages/catalog"
        );
        return response.data;
    },

    createCatalog: async (data: CreatePackageDto): Promise<any> => {
        const response = await axiosClient.post(
            "/admin/packages/catalog",
            data
        );
        return response.data;
    },

    updateCatalog: async (id: number, data: UpdatePackageDto): Promise<any> => {
        const response = await axiosClient.put(
            `/admin/packages/catalog/${id}`,
            data
        );
        return response.data;
    },

    deleteCatalog: async (id: number): Promise<any> => {
        const response = await axiosClient.delete(
            `/admin/packages/catalog/${id}`
        );
        return response.data;
    },
};

export default adminPackageAPI;