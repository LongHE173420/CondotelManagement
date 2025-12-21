import axiosClient from "./axiosClient";

// PaymentRequestDTO - DTO để tạo payment link
export interface PaymentRequestDTO {
  bookingId: number;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

// PaymentResponseDTO - Response từ PayOS
export interface PaymentResponseDTO {
  code: string;
  desc: string;
  data?: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
}

// PaymentCallbackDTO - DTO từ PayOS webhook
export interface PaymentCallbackDTO {
  code: string;
  desc: string;
  data?: {
    orderCode: string;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId: string;
    counterAccountBankName: string;
    counterAccountName: string;
    counterAccountNumber: string;
    virtualAccountName: string;
    virtualAccountNumber: string;
  };
}

// API Calls
export const paymentAPI = {
  // POST /api/payment/create - Tạo payment link (backward compatibility, redirects to /payment/payos/create)
  createPayment: async (request: PaymentRequestDTO): Promise<PaymentResponseDTO> => {
    
    // Build request payload - use PascalCase to match C# DTO (PaymentRequestDTO)
    // Only include fields with actual values (omit null/undefined to avoid validation issues)
    const payload: any = {
      BookingId: request.bookingId,
    };
    
    // Add optional fields only if they have values
    // PayOS requires description to be max 25 characters
    if (request.description) {
      // Ensure description is max 25 characters
      const description = String(request.description).substring(0, 25);
      if (description.length > 0) {
        payload.Description = description;
      }
    }
    if (request.returnUrl) {
      payload.ReturnUrl = request.returnUrl;
    }
    if (request.cancelUrl) {
      payload.CancelUrl = request.cancelUrl;
    }
    
    
    try {
      const response = await axiosClient.post<any>("/payment/create", payload);

      const responseData = response.data;
      
      // New backend response structure: { success: true, data: { checkoutUrl, qrCode, amount, orderCode } }
      if (!responseData.success) {
        // Check if it's a PayOS error
        const errorMessage = responseData.message || "Failed to create payment link";
        if (errorMessage.includes("PayOS error")) {
          let detailedMessage = `Lỗi PayOS: ${errorMessage}`;
          
          // Check for specific PayOS error codes
          if (errorMessage.includes("Code: 20") || errorMessage.includes("25 kí tự")) {
            detailedMessage += `\n\nLỗi: Mô tả (description) tối đa 25 ký tự. Vui lòng rút ngắn mô tả.`;
          } else if (errorMessage.includes("TotalPrice") || errorMessage.includes("tổng tiền")) {
            detailedMessage += `\n\nLỗi: Booking chưa có tổng tiền (TotalPrice = 0 hoặc null). Vui lòng kiểm tra lại thông tin booking.`;
          } else {
            detailedMessage += `\n\nCó thể booking chưa có tổng tiền (TotalPrice) hoặc số tiền không hợp lệ. Vui lòng kiểm tra lại thông tin booking.`;
          }
          
          throw new Error(detailedMessage);
        }
        throw new Error(errorMessage);
      }

    const paymentData = responseData.data;
    
    if (!paymentData || !paymentData.checkoutUrl) {
      throw new Error("Invalid payment response: checkoutUrl is missing");
    }

      // Map to PaymentResponseDTO format
      return {
        code: "00",
        desc: responseData.message || "Success",
        data: {
          bin: "",
          accountNumber: "",
          accountName: "",
          amount: paymentData.amount || 0,
          description: request.description || "",
          orderCode: paymentData.orderCode || request.bookingId,
          currency: "VND",
          paymentLinkId: paymentData.paymentLinkId || "",
          status: "PENDING",
          checkoutUrl: paymentData.checkoutUrl,
          qrCode: paymentData.qrCode || "",
        },
      };
    } catch (error: any) {
      // Handle PayOS errors specifically
      if (error.response?.data?.message?.includes("PayOS error")) {
        const payosError = error.response.data.message;
        
        let errorMessage = `Không thể tạo link thanh toán: ${payosError}`;
        
        // Check for specific PayOS error codes
        if (payosError.includes("Code: 20") || payosError.includes("25 kí tự")) {
          errorMessage += `\n\nLỗi: Mô tả (description) tối đa 25 ký tự. Vui lòng rút ngắn mô tả.`;
        } else if (payosError.includes("TotalPrice") || payosError.includes("tổng tiền")) {
          errorMessage += `\n\nLỗi: Booking chưa có tổng tiền (TotalPrice = 0 hoặc null). Vui lòng kiểm tra lại thông tin booking.`;
        } else {
          errorMessage += `\n\nCó thể booking chưa có tổng tiền (TotalPrice = 0 hoặc null) hoặc thông tin không hợp lệ. Vui lòng kiểm tra lại thông tin booking hoặc liên hệ hỗ trợ.`;
        }
        
        throw new Error(errorMessage);
      }
      // Re-throw other errors
      throw error;
    }
  },

  // GET /api/payment/status/{orderCode} - Lấy trạng thái thanh toán (backward compatibility)
  getPaymentStatus: async (orderCode: number): Promise<PaymentResponseDTO> => {
    const response = await axiosClient.get<any>(`/payment/status/${orderCode}`);
    const responseData = response.data;
    
    // New backend response structure: { success: true, data: { status, amount, orderCode, checkoutUrl, qrCode } }
    if (!responseData.success) {
      throw new Error(responseData.message || "Failed to get payment status");
    }

    const paymentData = responseData.data;
    
    return {
      code: "00",
      desc: responseData.message || "Success",
      data: {
        bin: "",
        accountNumber: "",
        accountName: "",
        amount: paymentData.amount || 0,
        description: "",
        orderCode: paymentData.orderCode || orderCode,
        currency: "VND",
        paymentLinkId: paymentData.paymentLinkId || "",
        status: paymentData.status || "PENDING",
        checkoutUrl: paymentData.checkoutUrl || "",
        qrCode: paymentData.qrCode || "",
      },
    };
  },

  // POST /api/payment/cancel/{orderCode} - Hủy payment link (backward compatibility)
  cancelPayment: async (orderCode: number, cancellationReason?: string): Promise<void> => {
    // Backend expects CancelPaymentRequest object with Reason property
    const response = await axiosClient.post<any>(`/payment/cancel/${orderCode}`, {
      Reason: cancellationReason || "User cancelled"
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to cancel payment");
    }
  },

  // POST /api/payment/generate-qr - Tạo QR code chuyển tiền
  generateQR: async (request: {
    bankCode: string; // Mã ngân hàng (MB, VCB, TCB, etc.)
    accountNumber: string; // Số tài khoản
    amount: number; // Số tiền (tối thiểu 1,000 VND)
    accountHolderName: string; // Tên chủ tài khoản
    content?: string; // Nội dung chuyển khoản (optional)
  }): Promise<{
    compactUrl: string; // QR code URL nhỏ gọn
    printUrl: string; // QR code URL để in
  }> => {
    const payload = {
      BankCode: request.bankCode,
      AccountNumber: request.accountNumber,
      Amount: request.amount,
      AccountHolderName: request.accountHolderName,
      Content: request.content,
    };

    const response = await axiosClient.post<any>("/payment/generate-qr", payload);
    const responseData = response.data;

    if (!responseData.success) {
      throw new Error(responseData.message || "Failed to generate QR code");
    }

    // Backend trả về { success: true, data: { qrCodeUrlCompact, qrCodeUrlPrint, qrCodeUrl } }
    // Support cả camelCase và PascalCase, và cả qrCodeUrl (fallback)
    const data = responseData.data || {};
    return {
      compactUrl: data.qrCodeUrlCompact || data.compactUrl || data.CompactUrl || data.qrCodeUrl || "",
      printUrl: data.qrCodeUrlPrint || data.printUrl || data.PrintUrl || data.qrCodeUrl || "",
    };
  },
};

export default paymentAPI;



