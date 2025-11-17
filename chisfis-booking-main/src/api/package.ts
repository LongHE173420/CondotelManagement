import axiosClient from "./axiosClient";
// XÓA DÒNG NÀY: import { AxiosResponse } from "axios"; 

// DTO này phải khớp với PackageDto (C#)
export interface PackageDto {
    packageId: number;
    name: string;
    price: number;
    duration: string; // Model C# của bạn đang là string
    description: string;
    // Các quyền lợi (từ PackageFeatureService)
    maxListings: number;
    canUseFeaturedListing: boolean;
}

// DTO này phải khớp với HostPackageDetailsDto (C#)
export interface HostPackageDetailsDto {
    packageName: string;
    status: string;
    startDate: string; // FE nhận về string (ISO Date)
    endDate: string;   // FE nhận về string (ISO Date)
    // Các quyền lợi
    maxListings: number;
    currentListings: number;
    canUseFeaturedListing: boolean;
}

// ✅ THÊM INTERFACE MỚI: Phản hồi từ API khi khởi tạo thanh toán
export interface PaymentResponse {
    paymentUrl: string; // URL để chuyển hướng người dùng đến cổng thanh toán
    message?: string; // (Tùy chọn) Có thể có thêm thông báo
}

// Request DTO khi mua
export interface PurchasePackageRequestDto {
    packageId: number;
}

export const packageAPI = {
    /**
     * (Public) Lấy tất cả gói để hiển thị bảng giá
     * GET /api/Package
     */
    getAllPackages: async (): Promise<PackageDto[]> => {
        const response = await axiosClient.get<PackageDto[]>("/Package");
        return response.data;
    },

    /**
     * (Host) Lấy gói dịch vụ đang active của Host
     * GET /api/host/packages/my-package
     */
    getMyPackage: async (): Promise<HostPackageDetailsDto | null> => {
        try {
            const response = await axiosClient.get<HostPackageDetailsDto>("/host/packages/my-package");
            // BE trả về 200 OK ngay cả khi không có gói (với { message: "..." })
            // Chúng ta kiểm tra xem có packageName không
            if (response.data && response.data.packageName) {
                return response.data;
            }
            return null; // Không có gói active
        } catch (error: any) {
            // Bất kỳ lỗi nào (401, 404) đều coi là không có gói
            console.error("getMyPackage error:", error);
            return null;
        }
    },

    /**
     * (Host) Mua hoặc nâng cấp gói mới
     * POST /api/host/packages/purchase
     * ✅ THAY ĐỔI: Trả về PaymentResponse thay vì HostPackageDetailsDto
     */
    purchasePackage: async (packageId: number): Promise<PaymentResponse> => {
        const requestData: PurchasePackageRequestDto = { packageId };

        // Không cần khai báo kiểu AxiosResponse tường minh nữa
        const response = await axiosClient.post<PaymentResponse>(
            "/host/packages/purchase",
            requestData
        );

        return response.data;
    },
};