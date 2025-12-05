import axiosClient from "./axiosClient";

export interface UtilityDTO {
  utilityId: number;
  name: string;
  description?: string;
}

const utilityAPI = {
  // GET /api/host/utility - Lấy danh sách utilities của host hiện tại
  getAll: async (): Promise<UtilityDTO[]> => {
    const response = await axiosClient.get<any>("/host/utility");
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const utilities = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return utilities.map((item: any) => ({
      utilityId: item.UtilityId || item.utilityId,
      name: item.Name || item.name,
      description: item.Description || item.description,
    }));
  },
};

export default utilityAPI;







