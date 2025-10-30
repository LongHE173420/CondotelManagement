import axiosClient from "./axiosClient";

export interface LocationCreateUpdateDTO {
  // Thêm các trường cần thiết, tạm ví dụ:
  locationName: string;
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface LocationDTO {
  locationId: number;
  locationName: string;
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

const locationAPI = {
  create: async (dto: LocationCreateUpdateDTO): Promise<LocationDTO> => {
    const res = await axiosClient.post<LocationDTO>("/host/location", dto);
    return res.data;
  },

  getAll: async (): Promise<LocationDTO[]> => {
    const res = await axiosClient.get<LocationDTO[]>("/host/location");
    return res.data;
  },

  getById: async (id: number): Promise<LocationDTO> => {
    const res = await axiosClient.get<LocationDTO>(`/host/location/${id}`);
    return res.data;
  }
};

export default locationAPI;
