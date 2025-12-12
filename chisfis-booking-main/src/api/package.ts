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
    status: "Active" | "Inactive" | "Pending" | "Cancelled" | "Expired";
    startDate: string;
    endDate: string;
    maxListings: number;
    currentListings: number;
    canUseFeaturedListing: boolean;
    message?: string;
    paymentUrl?: string;
    orderCode?: number;
    amount?: number;
    isVerifiedBadgeEnabled: boolean;
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

export interface PaymentUrlResponseDto {
    paymentUrl: string;
    orderCode: number;
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

    purchasePackage: async (packageId: number): Promise<HostPackageDetailsDto> => {
        const response = await axiosClient.post<HostPackageDetailsDto>(
            "/host/packages/purchase",
            { packageId }
        );
        return response.data;
    },

    getPaymentUrl: async (orderCode: number): Promise<PaymentUrlResponseDto> => {
        const response = await axiosClient.get<PaymentUrlResponseDto>(
            `/host/packages/payment-url/${orderCode}`
        );
        return response.data;
    },

    cancelPackage: async (): Promise<CancelPackageResponseDto> => {
        const response = await axiosClient.post<CancelPackageResponseDto>("/host/packages/cancel");
        return response.data;
    },
};