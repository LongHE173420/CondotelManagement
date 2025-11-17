import axiosClient from "./axiosClient";

// Resort DTO
export interface ResortDTO {
  resortId: number;
  name: string;
  description?: string;
  locationId?: number;
  address?: string;
  city?: string;
  country?: string;
}

// API Calls
export const resortAPI = {
  // GET /api/host/resorts - Lấy tất cả resorts
  getAll: async (): Promise<ResortDTO[]> => {
    const response = await axiosClient.get<any>("/host/resorts");
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const resorts = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return resorts.map((item: any) => ({
      resortId: item.ResortId || item.resortId,
      name: item.Name || item.name,
      description: item.Description || item.description,
      locationId: item.LocationId || item.locationId,
      address: item.Address || item.address,
      city: item.City || item.city,
      country: item.Country || item.country,
    }));
  },

  // GET /api/host/resorts/{id} - Lấy resort theo ID
  getById: async (id: number): Promise<ResortDTO> => {
    const response = await axiosClient.get<any>(`/host/resorts/${id}`);
    const data = response.data;
    
    return {
      resortId: data.ResortId || data.resortId,
      name: data.Name || data.name,
      description: data.Description || data.description,
      locationId: data.LocationId || data.locationId,
      address: data.Address || data.address,
      city: data.City || data.city,
      country: data.Country || data.country,
    };
  },

  // GET /api/host/resorts/location/{locationId} - Lấy resorts theo Location ID
  getByLocationId: async (locationId: number): Promise<ResortDTO[]> => {
    const response = await axiosClient.get<any>(`/host/resorts/location/${locationId}`);
    const data = response.data;
    
    // Normalize response
    const resorts = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return resorts.map((item: any) => ({
      resortId: item.ResortId || item.resortId,
      name: item.Name || item.name,
      description: item.Description || item.description,
      locationId: item.LocationId || item.locationId,
      address: item.Address || item.address,
      city: item.City || item.city,
      country: item.Country || item.country,
    }));
  },
};

export default resortAPI;





