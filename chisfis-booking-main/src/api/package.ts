import axiosClient from "./axiosClient";

export interface PackageDto {
    packageId: number;
    name: string;
    price: number;
    duration: string;
    description: string;
    maxListings: number;
    canUseFeaturedListing: boolean;
}

export interface HostPackageDetailsDto {
    packageName: string;
    status: string;
    startDate: string;
    endDate: string;
    maxListings: number;
    currentListings: number;
    canUseFeaturedListing: boolean;
    message?: string;
    paymentUrl?: string;
    orderCode?: number;
    amount?: number;
}

export interface CancelPackageResponseDto {
    success: boolean;
    message: string;
    refundAmount?: number;
    refundUrl?: string;
}

export interface PurchasePackageRequestDto {
    packageId: number;
}

export const packageAPI = {
    getAllPackages: async (): Promise<PackageDto[]> => {
        const response = await axiosClient.get<PackageDto[]>("/Package");
        return response.data;
    },

    getMyPackage: async (): Promise<HostPackageDetailsDto | null> => {
        try {
            const response = await axiosClient.get<HostPackageDetailsDto>("/host/packages/my-package");
            return response.data.packageName ? response.data : null;
        } catch {
            return null;
        }
    },

    // TRẢ VỀ THÔNG TIN ĐỂ GỌI PAYOS
    purchasePackage: async (packageId: number): Promise<HostPackageDetailsDto> => {
        const response = await axiosClient.post<HostPackageDetailsDto>(
            "/host/packages/purchase",
            { packageId }
        );
        return response.data;
    },

    // POST /api/host/packages/cancel - Hủy package và hoàn tiền
    cancelPackage: async (): Promise<CancelPackageResponseDto> => {
        const response = await axiosClient.post<CancelPackageResponseDto>("/host/packages/cancel");
        return response.data;
    },
};