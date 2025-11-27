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

export const adminPackageAPI = {
    // GET /api/admin/packages?search=abc
    getAll: async (search?: string): Promise<HostPackageItem[]> => {
        const response = await axiosClient.get<{ data: HostPackageItem[] } | HostPackageItem[]>(
            "/admin/packages",
            { params: search ? { search } : {} }
        );

        // Hỗ trợ cả 2 kiểu trả về: { data: [...] } hoặc mảng trực tiếp
        const result = (response as any).data || response;
        return Array.isArray(result) ? result : result.data || [];
    },

    // POST /api/admin/packages/{id}/activate
    activate: async (id: number): Promise<ActivateResponse> => {
        const response = await axiosClient.post<ActivateResponse>(
            `/admin/packages/${id}/activate`
        );
        return response.data;
    },
};

export default adminPackageAPI;