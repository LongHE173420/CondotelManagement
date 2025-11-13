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
  adminGetAllPosts: async (): Promise<BlogPostSummaryDTO[]> => {
    try {
      const response = await axiosClient.get<any[]>("/admin/blog/posts");
      return (response.data || []).map(normalizePostSummary);
    } catch (error: any) {
      // Nếu endpoint chưa có, fallback về published posts
      if (error.response?.status === 404) {
        return blogAPI.getPublishedPosts();
      }
      throw error;
    }
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

    const response = await axiosClient.post<any>("/admin/blog/posts", requestData);
    return normalizePostDetail(response.data);
  },

  // PUT /api/admin/blog/posts/{postId} - Cập nhật post
  adminUpdatePost: async (postId: number, dto: AdminBlogCreateDTO): Promise<BlogPostDetailDTO> => {
    // Map camelCase sang PascalCase
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
    const response = await axiosClient.post<any>("/admin/blog/categories", {
      Name: name,
    });
    return normalizeCategory(response.data);
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
    return normalizeCategory(response.data);
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
};

export default blogAPI;

