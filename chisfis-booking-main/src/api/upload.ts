import axiosClient from "./axiosClient";

export interface UploadImageResponse {
  message: string;
  imageUrl: string;
}

// API Calls for Upload
export const uploadAPI = {
  // POST /api/Upload/user-image
  // Upload ảnh cho user hiện tại (yêu cầu authentication)
  uploadUserImage: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post<UploadImageResponse>(
      "/Upload/user-image",
      formData
    );

    return response.data;
  },

  // POST /api/Upload/image
  // Upload ảnh chung (không cần authentication)
  uploadImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post<{ imageUrl: string }>(
      "/Upload/image",
      formData
    );

    return response.data;
  },
};

export default uploadAPI;

