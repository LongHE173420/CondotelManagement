import axiosClient from "./axiosClient";

// ReviewDTO từ backend
export interface ReviewDTO {
  reviewId?: number;
  bookingId: number;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  // Thông tin customer nếu backend trả về
  customerName?: string;
  customerImageUrl?: string;
}

export interface CreateReviewDTO {
  bookingId: number;
  rating: number;
  title?: string;
  comment?: string;
}

export interface UpdateReviewDTO {
  reviewId: number;
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ReviewQueryDTO {
  page?: number;
  pageSize?: number;
  rating?: number;
  sortBy?: string;
}

export interface ReviewResponse {
  success: boolean;
  data: ReviewDTO;
  message?: string;
}

export interface ReviewListResponse {
  success: boolean;
  data: ReviewDTO[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CanReviewResponse {
  canReview: boolean;
  message: string;
}

// Reported Review DTO - for admin
export interface ReportedReviewDTO extends ReviewDTO {
  reportCount?: number;
  status?: string; // "Active", "Reported", "Deleted"
}

// API Calls
export const reviewAPI = {
  // POST /api/tenant/reviews - Tạo review mới
  createReview: async (review: CreateReviewDTO): Promise<ReviewDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {
      BookingId: review.bookingId,
      Rating: review.rating,
    };

    if (review.title) {
      requestData.Title = review.title;
    }
    if (review.comment) {
      requestData.Comment = review.comment;
    }

    console.log("📤 Creating review with data:", JSON.stringify(requestData, null, 2));

    const response = await axiosClient.post<ReviewResponse>("/tenant/reviews", requestData);
    console.log("✅ Review created successfully:", response.data);

    // Normalize response từ backend (PascalCase -> camelCase)
    const data: any = response.data.data || response.data;
    return {
      reviewId: data.ReviewId || data.reviewId,
      bookingId: data.BookingId || data.bookingId,
      rating: data.Rating || data.rating,
      title: data.Title || data.title,
      comment: data.Comment || data.comment,
      createdAt: data.CreatedAt || data.createdAt,
      updatedAt: data.UpdatedAt || data.updatedAt,
    };
  },

  // GET /api/tenant/reviews - Lấy danh sách review của tôi
  getMyReviews: async (query?: ReviewQueryDTO): Promise<ReviewListResponse> => {
    const params: any = {};
    if (query?.page) params.page = query.page;
    if (query?.pageSize) params.pageSize = query.pageSize;
    if (query?.rating) params.rating = query.rating;
    if (query?.sortBy) params.sortBy = query.sortBy;

    const response = await axiosClient.get<any>("/tenant/reviews", { params });
    const data = response.data;

    // Normalize response
    const reviews = (data.data || []).map((item: any) => ({
      reviewId: item.ReviewId || item.reviewId,
      bookingId: item.BookingId || item.bookingId,
      rating: item.Rating || item.rating,
      title: item.Title || item.title,
      comment: item.Comment || item.comment,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
    }));

    return {
      success: data.success || true,
      data: reviews,
      pagination: data.pagination || {
        page: query?.page || 1,
        pageSize: query?.pageSize || 10,
        totalCount: data.pagination?.totalCount || 0,
        totalPages: data.pagination?.totalPages || 0,
      },
    };
  },

  // GET /api/tenant/reviews/{id} - Lấy chi tiết review
  getReviewById: async (id: number): Promise<ReviewDTO> => {
    const response = await axiosClient.get<any>(`/tenant/reviews/${id}`);
    const data: any = response.data.data || response.data;

    return {
      reviewId: data.ReviewId || data.reviewId,
      bookingId: data.BookingId || data.bookingId,
      rating: data.Rating || data.rating,
      title: data.Title || data.title,
      comment: data.Comment || data.comment,
      createdAt: data.CreatedAt || data.createdAt,
      updatedAt: data.UpdatedAt || data.updatedAt,
    };
  },

  // PUT /api/tenant/reviews/{id} - Cập nhật review
  updateReview: async (id: number, review: UpdateReviewDTO): Promise<ReviewDTO> => {
    // Map camelCase sang PascalCase
    const requestData: any = {
      ReviewId: id,
    };

    if (review.rating !== undefined) {
      requestData.Rating = review.rating;
    }
    if (review.title !== undefined) {
      requestData.Title = review.title;
    }
    if (review.comment !== undefined) {
      requestData.Comment = review.comment;
    }

    const response = await axiosClient.put<any>(`/tenant/reviews/${id}`, requestData);
    const data: any = response.data.data || response.data;

    return {
      reviewId: data.ReviewId || data.reviewId,
      bookingId: data.BookingId || data.bookingId,
      rating: data.Rating || data.rating,
      title: data.Title || data.title,
      comment: data.Comment || data.comment,
      createdAt: data.CreatedAt || data.createdAt,
      updatedAt: data.UpdatedAt || data.updatedAt,
    };
  },

  // DELETE /api/tenant/reviews/{id} - Xóa review
  deleteReview: async (id: number): Promise<void> => {
    await axiosClient.delete(`/tenant/reviews/${id}`);
  },

  // GET /api/tenant/reviews/can-review/{bookingId} - Kiểm tra có thể review booking không
  canReviewBooking: async (bookingId: number): Promise<CanReviewResponse> => {
    const response = await axiosClient.get<CanReviewResponse>(
      `/tenant/reviews/can-review/${bookingId}`
    );
    return response.data;
  },

  // GET /api/tenant/reviews/condotel/{condotelId} - Lấy tất cả reviews của một condotel (public)
  getReviewsByCondotel: async (
    condotelId: number,
    query?: ReviewQueryDTO
  ): Promise<ReviewListResponse> => {
    const params: any = {};
    if (query?.page) params.page = query.page;
    if (query?.pageSize) params.pageSize = query.pageSize;
    if (query?.rating) params.rating = query.rating;
    if (query?.sortBy) params.sortBy = query.sortBy;

    const response = await axiosClient.get<any>(`/tenant/reviews/condotel/${condotelId}`, { params });
    const data = response.data;

    // Normalize response
    const reviews = (data.data || data || []).map((item: any) => ({
      reviewId: item.ReviewId || item.reviewId,
      bookingId: item.BookingId || item.bookingId,
      rating: item.Rating || item.rating,
      title: item.Title || item.title,
      comment: item.Comment || item.comment,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
      customerName: item.CustomerName || item.customerName,
      customerImageUrl: item.CustomerImageUrl || item.customerImageUrl,
    }));

    return {
      success: data.success !== undefined ? data.success : true,
      data: reviews,
      pagination: data.pagination || {
        page: query?.page || 1,
        pageSize: query?.pageSize || 10,
        totalCount: reviews.length,
        totalPages: 1,
      },
    };
  },

  // ========== ADMIN API ==========
  // GET /api/admin/review/reported - Lấy danh sách review bị báo cáo
  getReportedReviews: async (): Promise<ReportedReviewDTO[]> => {
    const response = await axiosClient.get<any>("/admin/review/reported");
    const data = response.data;
    
    // Normalize response
    const reviews = (data.data || data || []).map((item: any) => ({
      reviewId: item.ReviewId || item.reviewId,
      bookingId: item.BookingId || item.bookingId,
      rating: item.Rating || item.rating,
      title: item.Title || item.title,
      comment: item.Comment || item.comment,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
      customerName: item.CustomerName || item.customerName,
      customerImageUrl: item.CustomerImageUrl || item.customerImageUrl,
      reportCount: item.ReportCount || item.reportCount || 0,
      status: item.Status || item.status || "Active",
    }));

    return reviews;
  },

  // DELETE /api/admin/review/{reviewId} - Admin xóa review
  deleteReviewByAdmin: async (reviewId: number): Promise<{ message: string }> => {
    const response = await axiosClient.delete<any>(`/admin/review/${reviewId}`);
    return {
      message: response.data?.message || "Đã xóa review",
    };
  },

  // ========== HOST API ==========
  // GET /api/host/review - Lấy tất cả reviews của condotel của host
  getHostReviews: async (): Promise<ReviewDTO[]> => {
    const response = await axiosClient.get<any>("/host/review");
    const data = response.data;
    
    // Normalize response
    const reviews = (data.data || data || []).map((item: any) => ({
      reviewId: item.ReviewId || item.reviewId,
      bookingId: item.BookingId || item.bookingId,
      rating: item.Rating || item.rating,
      title: item.Title || item.title,
      comment: item.Comment || item.comment,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
      customerName: item.CustomerName || item.customerName,
      customerImageUrl: item.CustomerImageUrl || item.customerImageUrl,
    }));

    return reviews;
  },

  // PUT /api/host/review/{reviewId}/reply - Host trả lời review
  replyToReview: async (reviewId: number, reply: string): Promise<{ message: string }> => {
    const response = await axiosClient.put<any>(`/host/review/${reviewId}/reply`, {
      Reply: reply,
    });
    return {
      message: response.data?.message || "Đã trả lời review",
    };
  },

  // PUT /api/host/review/{reviewId}/report - Host report review
  reportReview: async (reviewId: number): Promise<{ message: string }> => {
    const response = await axiosClient.put<any>(`/host/review/${reviewId}/report`);
    return {
      message: response.data?.message || "Đã report review",
    };
  },
};

export default reviewAPI;



