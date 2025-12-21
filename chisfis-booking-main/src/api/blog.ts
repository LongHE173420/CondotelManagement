import axiosClient from "./axiosClient";

// DTOs từ backend Blog - khớp với C# DTOs
export interface BlogPostSummaryDTO {
  postId: number;
  PostId?: number; // Support both camelCase and PascalCase
  title: string;
  Title?: string;
  slug: string;
  Slug?: string;
  featuredImageUrl?: string;
  FeaturedImageUrl?: string;
  publishedAt?: string;
  PublishedAt?: string;
  authorName: string;
  AuthorName?: string;
  categoryName: string;
  CategoryName?: string;

}

export interface BlogPostDetailDTO extends BlogPostSummaryDTO {
  content: string;
  Content?: string;
  categoryId?: number;  // Thêm dòng này
  CategoryId?: number;
  status?: string;
  Status?: string;
}

export interface BlogCategoryDTO {
  categoryId: number;
  CategoryId?: number;
  name: string;
  Name?: string;
  slug: string;
  Slug?: string;
}

// Admin DTOs
export interface AdminBlogCreateDTO {
  title: string;
  Title?: string;
  content: string;
  Content?: string;
  featuredImageUrl?: string;
  FeaturedImageUrl?: string;
  status: string;
  Status?: string;
  categoryId?: number;
  CategoryId?: number;
}
export interface BlogRequestDTO {
  blogRequestId: number;
  hostId: number;
  hostName: string;
  title: string;
  content: string;
  featuredImageUrl?: string;
  status: string;
  requestDate: string; // ISO Date string
  rejectionReason?: string;
  categoryName?: string;

}

export interface HostCreateRequestDTO {
  title: string;
  content: string;
  featuredImageUrl?: string;
  categoryId?: number;
}
export interface HostBlogSummaryDTO {
  id: number;
  title: string;
  thumbnail: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  createdDate: string;
  content?: string;
  categoryId?: number;
}
// Helper function normalize cho Request
const normalizeBlogRequest = (item: any): BlogRequestDTO => {
  return {
    blogRequestId: item.blogRequestId ?? item.BlogRequestId ?? 0,
    hostId: item.hostId ?? item.HostId ?? 0,
    hostName: item.hostName ?? item.HostName ?? "Unknown Host",
    title: item.title ?? item.Title ?? "",
    content: item.content ?? item.Content ?? "",
    featuredImageUrl: item.featuredImageUrl ?? item.FeaturedImageUrl ?? "",
    status: item.status ?? item.Status ?? "Pending",
    requestDate: item.requestDate ?? item.RequestDate ?? new Date().toISOString(),
    rejectionReason: item.rejectionReason ?? item.RejectionReason,
    categoryName: item.categoryName ?? item.CategoryName ?? "Chung",

  };
};
const normalizeHostBlogSummary = (item: any): HostBlogSummaryDTO => {
  return {
    id: item.id ?? item.Id ?? item.BlogRequestId ?? 0,
    title: item.title ?? item.Title ?? "",
    thumbnail: item.thumbnail ?? item.FeaturedImageUrl ?? "",
    status: item.status ?? item.Status ?? "Pending",
    rejectionReason: item.rejectionReason ?? item.RejectionReason,
    createdDate: item.createdDate ?? item.RequestDate ?? new Date().toISOString(),
    // Map thêm Content và CategoryId để dùng cho chức năng Edit
    content: item.content ?? item.Content ?? "",
    categoryId: item.categoryId ?? item.CategoryId,
  };
};
// Alias for backward compatibility
export type BlogPostDTO = BlogPostSummaryDTO;

// Helper function to normalize DTOs (handle both camelCase and PascalCase)
const normalizePostSummary = (item: any): BlogPostSummaryDTO => {
  return {
    postId: item.postId ?? item.PostId ?? 0,
    title: item.title ?? item.Title ?? "",
    slug: item.slug ?? item.Slug ?? "",
    featuredImageUrl: item.featuredImageUrl ?? item.FeaturedImageUrl,
    publishedAt: item.publishedAt ?? item.PublishedAt,
    authorName: item.authorName ?? item.AuthorName ?? "",
    categoryName: item.categoryName ?? item.CategoryName ?? "",
  };
};

const normalizePostDetail = (item: any): BlogPostDetailDTO => {
  const summary = normalizePostSummary(item);
  return {
    ...summary,
    content: item.content ?? item.Content ?? "",
    status: item.status ?? item.Status,
    categoryId: item.categoryId ?? item.CategoryId,
  };
};

const normalizeCategory = (item: any): BlogCategoryDTO => {
  return {
    categoryId: item.categoryId ?? item.CategoryId ?? 0,
    name: item.name ?? item.Name ?? "",
    slug: item.slug ?? item.Slug ?? "",
  };
};

// API Calls
export const blogAPI = {
  // GET /api/blog/posts - Lấy tất cả published posts (trả về BlogPostSummaryDto[])
  getPublishedPosts: async (): Promise<BlogPostSummaryDTO[]> => {
    const response = await axiosClient.get<any[]>("/blog/posts");
    return (response.data || []).map(normalizePostSummary);
  },

  // GET /api/blog/posts/{slug} - Lấy post theo slug (trả về BlogPostDetailDto)
  getPostBySlug: async (slug: string): Promise<BlogPostDetailDTO | null> => {
    try {
      const response = await axiosClient.get<any>(`/blog/posts/${slug}`);
      return normalizePostDetail(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // GET /api/blog/categories - Lấy tất cả categories (trả về BlogCategoryDto[])
  getCategories: async (): Promise<BlogCategoryDTO[]> => {
    const response = await axiosClient.get<any[]>("/blog/categories");
    return (response.data || []).map(normalizeCategory);
  },

  // ========== USER ENDPOINTS ==========

  // POST /api/blog/posts - User tạo blog post mới (trải nghiệm)
  createPost: async (dto: AdminBlogCreateDTO): Promise<BlogPostDetailDTO> => {
    // Map camelCase sang PascalCase để khớp với backend
    const requestData: any = {
      Title: dto.title || dto.Title || "",
      Content: dto.content || dto.Content || "",
      Status: dto.status || dto.Status || "Draft",
    };

    if (dto.featuredImageUrl || dto.FeaturedImageUrl) {
      requestData.FeaturedImageUrl = dto.featuredImageUrl || dto.FeaturedImageUrl;
    }

    if (dto.categoryId !== undefined || dto.CategoryId !== undefined) {
      requestData.CategoryId = dto.categoryId ?? dto.CategoryId ?? null;
    }

    const response = await axiosClient.post<any>("/blog/posts", requestData);
    return normalizePostDetail(response.data);
  },

  // GET /api/blog/my-posts - Lấy các bài viết của user hiện tại
  getMyPosts: async (): Promise<BlogPostSummaryDTO[]> => {
    try {
      const response = await axiosClient.get<any[]>("/blog/my-posts");
      return (response.data || []).map(normalizePostSummary);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // ========== ADMIN ENDPOINTS ==========

  // GET /api/admin/blog/posts - Lấy tất cả posts cho admin (bao gồm draft)
  adminGetAllPosts: async (includeDrafts: boolean = true): Promise<BlogPostSummaryDTO[]> => {
    const response = await axiosClient.get<any[]>("/admin/blog/posts", {
      params: { includeDrafts }
    });
    return (response.data || []).map(normalizePostSummary);
  },

  // GET /api/admin/blog/posts/{postId} - Lấy post detail cho admin
  adminGetPostById: async (postId: number): Promise<BlogPostDetailDTO | null> => {
    try {
      const response = await axiosClient.get<any>(`/admin/blog/posts/${postId}`);
      return normalizePostDetail(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // POST /api/admin/blog/posts - Tạo post mới
  adminCreatePost: async (dto: AdminBlogCreateDTO): Promise<BlogPostDetailDTO> => {
    // Backend nhận camelCase (từ curl request: title, content, featuredImageUrl, status, categoryId)
    const requestData: any = {
      title: dto.title || dto.Title || "",
      content: dto.content || dto.Content || "",
      status: dto.status || dto.Status || "Draft",
    };

    if (dto.featuredImageUrl || dto.FeaturedImageUrl) {
      requestData.featuredImageUrl = dto.featuredImageUrl || dto.FeaturedImageUrl || "";
    }

    if (dto.categoryId !== undefined || dto.CategoryId !== undefined) {
      const catId = dto.categoryId ?? dto.CategoryId;
      if (catId !== null && catId !== undefined) {
        requestData.categoryId = catId;
      }
    }

    const response = await axiosClient.post<any>("/admin/blog/posts", requestData);
    return normalizePostDetail(response.data);
  },

  // PUT /api/admin/blog/posts/{postId} - Cập nhật post
  adminUpdatePost: async (postId: number, dto: AdminBlogCreateDTO): Promise<BlogPostDetailDTO> => {
    // Backend nhận camelCase
    const requestData: any = {
      title: dto.title || dto.Title || "",
      content: dto.content || dto.Content || "",
      status: dto.status || dto.Status || "Draft",
    };

    if (dto.featuredImageUrl || dto.FeaturedImageUrl) {
      requestData.featuredImageUrl = dto.featuredImageUrl || dto.FeaturedImageUrl || "";
    }

    if (dto.categoryId !== undefined || dto.CategoryId !== undefined) {
      const catId = dto.categoryId ?? dto.CategoryId;
      if (catId !== null && catId !== undefined) {
        requestData.categoryId = catId;
      }
    }

    const response = await axiosClient.put<any>(`/admin/blog/posts/${postId}`, requestData);
    return normalizePostDetail(response.data);
  },

  // DELETE /api/admin/blog/posts/{postId} - Xóa post
  adminDeletePost: async (postId: number): Promise<boolean> => {
    try {
      await axiosClient.delete(`/admin/blog/posts/${postId}`);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  },

  // GET /api/admin/blog/categories - Lấy tất cả categories (admin)
  adminGetCategories: async (): Promise<BlogCategoryDTO[]> => {
    const response = await axiosClient.get<any[]>("/admin/blog/categories");
    return (response.data || []).map(normalizeCategory);
  },

  // POST /api/admin/blog/categories - Tạo category mới
  adminCreateCategory: async (name: string): Promise<BlogCategoryDTO> => {
    try {
      const response = await axiosClient.post<any>("/admin/blog/categories", {
        Name: name,
      });

      // Backend CreatedAtAction có thể trả về object trong response.data
      // Hoặc có thể là response.data trực tiếp
      const categoryData = response.data;

      if (!categoryData) {
        throw new Error("Không nhận được dữ liệu từ server");
      }

      return normalizeCategory(categoryData);
    } catch (error: any) {
      // Re-throw để component có thể xử lý
      throw error;
    }
  },

  // PUT /api/admin/blog/categories/{categoryId} - Cập nhật category
  adminUpdateCategory: async (categoryId: number, name: string, slug?: string): Promise<BlogCategoryDTO> => {
    const requestData: any = {
      Name: name,
    };
    if (slug) {
      requestData.Slug = slug;
    }
    const response = await axiosClient.put<any>(`/admin/blog/categories/${categoryId}`, requestData);
    // Backend có thể trả về object trực tiếp hoặc trong response.data
    const categoryData = response.data || response;
    return normalizeCategory(categoryData);
  },

  // DELETE /api/admin/blog/categories/{categoryId} - Xóa category
  adminDeleteCategory: async (categoryId: number): Promise<boolean> => {
    try {
      await axiosClient.delete(`/admin/blog/categories/${categoryId}`);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  },
  hostCreateRequest: async (dto: HostCreateRequestDTO): Promise<{ success: boolean; message: string; remainingQuota?: number }> => {
    // Chuẩn hóa dữ liệu gửi đi
    const requestData = {
      Title: dto.title,
      Content: dto.content,
      FeaturedImageUrl: dto.featuredImageUrl,
      CategoryId: dto.categoryId
    };

    try {
      const response = await axiosClient.post<any>("/host/blog/requests", requestData);
      return response.data; // Giả sử backend trả về { message: "...", remainingQuota: 5 }
    } catch (error: any) {
      // Ném lỗi ra để component xử lý (hiển thị thông báo gói cước/hết lượt)
      throw error;
    }

  },

  // ========== ADMIN APPROVAL ENDPOINTS ==========

  // GET /api/admin/blog/requests - Lấy danh sách chờ duyệt
  adminGetPendingRequests: async (): Promise<BlogRequestDTO[]> => {
    const response = await axiosClient.get<any[]>("/admin/blog/requests");
    return (response.data || []).map(normalizeBlogRequest);
  },

  // POST /api/admin/blog/requests/{requestId}/approve - Duyệt bài
  adminApproveRequest: async (requestId: number): Promise<boolean> => {
    try {
      await axiosClient.post(`/admin/blog/requests/${requestId}/approve`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // POST /api/admin/blog/requests/{requestId}/reject - Từ chối bài
  adminRejectRequest: async (requestId: number, reason: string): Promise<boolean> => {
    try {
      // Backend C# nhận [FromBody] string reason, nên cần gửi đúng format JSON string
      await axiosClient.post(
        `/admin/blog/requests/${requestId}/reject`,
        JSON.stringify(reason),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return true;
    } catch (error) {
      throw error;
    }
  },
  getHostRequests: async (): Promise<HostBlogSummaryDTO[]> => {
    const response = await axiosClient.get<any[]>("/host/blog/my-history");
    return (response.data || []).map(normalizeHostBlogSummary);
  },

  // PUT /api/host/blog/requests/{requestId} - Sửa bài bị Reject/Pending
  updateHostRequest: async (requestId: number, dto: HostCreateRequestDTO): Promise<{ success: boolean, message: string }> => {
    // Map dữ liệu sang PascalCase cho khớp Backend C#
    const requestData = {
      Title: dto.title,
      Content: dto.content,
      FeaturedImageUrl: dto.featuredImageUrl,
      CategoryId: dto.categoryId
    };
    const response = await axiosClient.put<any>(`/host/blog/requests/${requestId}`, requestData);
    return response.data;
  },

  // DELETE /api/host/blog/requests/{requestId} - Xóa bài
  deleteHostRequest: async (requestId: number): Promise<{ success: boolean, message: string }> => {
    const response = await axiosClient.delete<any>(`/host/blog/requests/${requestId}`);
    return response.data;
  },
  // GET /api/host/blog/requests/{requestId} - Lấy chi tiết 1 request để edit
  getHostRequestDetail: async (requestId: number): Promise<HostBlogSummaryDTO> => {
    const response = await axiosClient.get<any>(`/host/blog/requests/${requestId}`);
    return normalizeHostBlogSummary(response.data);
  },
};

export default blogAPI;

