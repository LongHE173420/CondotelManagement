import axios from "axios";

// API từ https://provinces.open-api.vn/ - Miễn phí, không cần authentication
const VIETNAM_ADDRESS_API_BASE = "https://provinces.open-api.vn/api";

export interface ProvinceDTO {
  code: string;
  name: string;
}

export interface DistrictDTO {
  code: string;
  name: string;
  province_code: string;
}

export interface WardDTO {
  code: string;
  name: string;
  district_code: string;
}

// Map tên tỉnh/thành phố Việt Nam với mã tỉnh
const PROVINCE_NAME_TO_CODE: Record<string, string> = {
  "Hà Nội": "01",
  "Hồ Chí Minh": "79",
  "Đà Nẵng": "48",
  "Hải Phòng": "31",
  "Cần Thơ": "92",
  "An Giang": "89",
  "Bà Rịa - Vũng Tàu": "77",
  "Bạc Liêu": "95",
  "Bắc Giang": "24",
  "Bắc Kạn": "06",
  "Bắc Ninh": "27",
  "Bến Tre": "83",
  "Bình Định": "52",
  "Bình Dương": "74",
  "Bình Phước": "70",
  "Bình Thuận": "60",
  "Cà Mau": "96",
  "Cao Bằng": "04",
  "Đắk Lắk": "33",
  "Đắk Nông": "67",
  "Điện Biên": "11",
  "Đồng Nai": "75",
  "Đồng Tháp": "87",
  "Gia Lai": "64",
  "Hà Giang": "02",
  "Hà Nam": "35",
  "Hà Tĩnh": "42",
  "Hải Dương": "30",
  "Hậu Giang": "93",
  "Hòa Bình": "17",
  "Hưng Yên": "33",
  "Khánh Hòa": "56",
  "Kiên Giang": "91",
  "Kon Tum": "62",
  "Lai Châu": "12",
  "Lâm Đồng": "68",
  "Lạng Sơn": "20",
  "Lào Cai": "10",
  "Long An": "80",
  "Nam Định": "36",
  "Nghệ An": "40",
  "Ninh Bình": "37",
  "Ninh Thuận": "58",
  "Phú Thọ": "25",
  "Phú Yên": "54",
  "Quảng Bình": "44",
  "Quảng Nam": "49",
  "Quảng Ngãi": "51",
  "Quảng Ninh": "22",
  "Quảng Trị": "45",
  "Sóc Trăng": "94",
  "Sơn La": "14",
  "Tây Ninh": "72",
  "Thái Bình": "34",
  "Thái Nguyên": "19",
  "Thanh Hóa": "38",
  "Thừa Thiên Huế": "46",
  "Tiền Giang": "82",
  "Trà Vinh": "84",
  "Tuyên Quang": "08",
  "Vĩnh Long": "86",
  "Vĩnh Phúc": "26",
  "Yên Bái": "15",
};

// Map tên thành phố/thị xã về tên tỉnh
const CITY_TO_PROVINCE: Record<string, string> = {
  "Nha Trang": "Khánh Hòa",
  "Cam Ranh": "Khánh Hòa",
  "Vũng Tàu": "Bà Rịa - Vũng Tàu",
  "Bà Rịa": "Bà Rịa - Vũng Tàu",
  "Phan Thiết": "Bình Thuận",
  "Mũi Né": "Bình Thuận",
  "Quy Nhon": "Bình Định",
  "Quy Nhơn": "Bình Định",
  "Pleiku": "Gia Lai",
  "Buôn Ma Thuột": "Đắk Lắk",
  "Buon Ma Thuot": "Đắk Lắk",
  "Đà Lạt": "Lâm Đồng",
  "Dalat": "Lâm Đồng",
  "Huế": "Thừa Thiên Huế",
  "Hue": "Thừa Thiên Huế",
  "Hội An": "Quảng Nam",
  "Hoi An": "Quảng Nam",
  "Tam Kỳ": "Quảng Nam",
  "Tam Ky": "Quảng Nam",
  "Quảng Ngãi": "Quảng Ngãi",
  "Quang Ngai": "Quảng Ngãi",
  "Hạ Long": "Quảng Ninh",
  "Ha Long": "Quảng Ninh",
  "Cẩm Phả": "Quảng Ninh",
  "Cam Pha": "Quảng Ninh",
  "Móng Cái": "Quảng Ninh",
  "Mong Cai": "Quảng Ninh",
  "Uông Bí": "Quảng Ninh",
  "Uong Bi": "Quảng Ninh",
  "Vinh": "Nghệ An",
  "Thanh Hóa": "Thanh Hóa",
  "Thanh Hoa": "Thanh Hóa",
  "Nam Định": "Nam Định",
  "Nam Dinh": "Nam Định",
  "Thái Bình": "Thái Bình",
  "Thai Binh": "Thái Bình",
  "Hải Phòng": "Hải Phòng",
  "Hai Phong": "Hải Phòng",
  "Hải Dương": "Hải Dương",
  "Hai Duong": "Hải Dương",
  "Hưng Yên": "Hưng Yên",
  "Hung Yen": "Hưng Yên",
  "Thái Nguyên": "Thái Nguyên",
  "Thai Nguyen": "Thái Nguyên",
  "Bắc Ninh": "Bắc Ninh",
  "Bac Ninh": "Bắc Ninh",
  "Hà Giang": "Hà Giang",
  "Ha Giang": "Hà Giang",
  "Cao Bằng": "Cao Bằng",
  "Cao Bang": "Cao Bằng",
  "Lào Cai": "Lào Cai",
  "Lao Cai": "Lào Cai",
  "Sapa": "Lào Cai",
  "Sa Pa": "Lào Cai",
  "Điện Biên": "Điện Biên",
  "Dien Bien": "Điện Biên",
  "Lai Châu": "Lai Châu",
  "Lai Chau": "Lai Châu",
  "Sơn La": "Sơn La",
  "Son La": "Sơn La",
  "Yên Bái": "Yên Bái",
  "Yen Bai": "Yên Bái",
  "Tuyên Quang": "Tuyên Quang",
  "Tuyen Quang": "Tuyên Quang",
  "Phú Thọ": "Phú Thọ",
  "Phu Tho": "Phú Thọ",
  "Vĩnh Phúc": "Vĩnh Phúc",
  "Vinh Phuc": "Vĩnh Phúc",
  "Bắc Giang": "Bắc Giang",
  "Bac Giang": "Bắc Giang",
  "Lạng Sơn": "Lạng Sơn",
  "Lang Son": "Lạng Sơn",
  "Quảng Ninh": "Quảng Ninh",
  "Quang Ninh": "Quảng Ninh",
  "Bắc Kạn": "Bắc Kạn",
  "Bac Kan": "Bắc Kạn",
  "Hòa Bình": "Hòa Bình",
  "Hoa Binh": "Hòa Bình",
  "Hà Nam": "Hà Nam",
  "Ha Nam": "Hà Nam",
  "Ninh Bình": "Ninh Bình",
  "Ninh Binh": "Ninh Bình",
  "Hà Tĩnh": "Hà Tĩnh",
  "Ha Tinh": "Hà Tĩnh",
  "Quảng Bình": "Quảng Bình",
  "Quang Binh": "Quảng Bình",
  "Quảng Trị": "Quảng Trị",
  "Quang Tri": "Quảng Trị",
  "Phú Yên": "Phú Yên",
  "Phu Yen": "Phú Yên",
  "Tuy Hòa": "Phú Yên",
  "Tuy Hoa": "Phú Yên",
  "Ninh Thuận": "Ninh Thuận",
  "Ninh Thuan": "Ninh Thuận",
  "Phan Rang": "Ninh Thuận",
  "Phan Rang - Tháp Chàm": "Ninh Thuận",
  "Kon Tum": "Kon Tum",
  "Kontum": "Kon Tum",
  "Gia Lai": "Gia Lai",
  "Đắk Lắk": "Đắk Lắk",
  "Dak Lak": "Đắk Lắk",
  "Đắk Nông": "Đắk Nông",
  "Dak Nong": "Đắk Nông",
  "Lâm Đồng": "Lâm Đồng",
  "Lam Dong": "Lâm Đồng",
  "Bình Phước": "Bình Phước",
  "Binh Phuoc": "Bình Phước",
  "Tây Ninh": "Tây Ninh",
  "Tay Ninh": "Tây Ninh",
  "Bình Dương": "Bình Dương",
  "Binh Duong": "Bình Dương",
  "Thủ Dầu Một": "Bình Dương",
  "Thu Dau Mot": "Bình Dương",
  "Đồng Nai": "Đồng Nai",
  "Dong Nai": "Đồng Nai",
  "Biên Hòa": "Đồng Nai",
  "Bien Hoa": "Đồng Nai",
  "Bà Rịa - Vũng Tàu": "Bà Rịa - Vũng Tàu",
  "Ba Ria - Vung Tau": "Bà Rịa - Vũng Tàu",
  "Long An": "Long An",
  "Tân An": "Long An",
  "Tan An": "Long An",
  "Tiền Giang": "Tiền Giang",
  "Tien Giang": "Tiền Giang",
  "Mỹ Tho": "Tiền Giang",
  "My Tho": "Tiền Giang",
  "Bến Tre": "Bến Tre",
  "Ben Tre": "Bến Tre",
  "Trà Vinh": "Trà Vinh",
  "Tra Vinh": "Trà Vinh",
  "Vĩnh Long": "Vĩnh Long",
  "Vinh Long": "Vĩnh Long",
  "Đồng Tháp": "Đồng Tháp",
  "Dong Thap": "Đồng Tháp",
  "Cao Lãnh": "Đồng Tháp",
  "Cao Lanh": "Đồng Tháp",
  "An Giang": "An Giang",
  "Long Xuyên": "An Giang",
  "Long Xuyen": "An Giang",
  "Châu Đốc": "An Giang",
  "Chau Doc": "An Giang",
  "Kiên Giang": "Kiên Giang",
  "Kien Giang": "Kiên Giang",
  "Rạch Giá": "Kiên Giang",
  "Rach Gia": "Kiên Giang",
  "Phú Quốc": "Kiên Giang",
  "Phu Quoc": "Kiên Giang",
  "Đảo Phú Quốc": "Kiên Giang",
  "Dao Phu Quoc": "Kiên Giang",
  "Cần Thơ": "Cần Thơ",
  "Can Tho": "Cần Thơ",
  "Hậu Giang": "Hậu Giang",
  "Hau Giang": "Hậu Giang",
  "Vị Thanh": "Hậu Giang",
  "Vi Thanh": "Hậu Giang",
  "Sóc Trăng": "Sóc Trăng",
  "Soc Trang": "Sóc Trăng",
  "Bạc Liêu": "Bạc Liêu",
  "Bac Lieu": "Bạc Liêu",
  "Cà Mau": "Cà Mau",
  "Ca Mau": "Cà Mau",
};

// Tìm tên tỉnh từ tên thành phố/thị xã/huyện đảo
const getProvinceNameFromCity = (cityName: string): string | null => {
  // Normalize tên thành phố (loại bỏ dấu, lowercase, trim)
  const normalized = cityName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Tìm trong map thành phố -> tỉnh (exact match trước)
  for (const [city, province] of Object.entries(CITY_TO_PROVINCE)) {
    const normalizedCity = city
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    // Exact match
    if (normalizedCity === normalized) {
      return province;
    }
    
    // Partial match (một trong hai chứa cái kia)
    if (normalizedCity.includes(normalized) || normalized.includes(normalizedCity)) {
      // Kiểm tra độ dài để tránh match quá ngắn
      if (normalized.length >= 3 && normalizedCity.length >= 3) {
        return province;
      }
    }
  }

  return null;
};

// Tìm mã tỉnh từ tên tỉnh hoặc tên thành phố
const getProvinceCode = (locationName: string): string | null => {
  // Bước 1: Kiểm tra xem có phải là tên thành phố không, nếu có thì lấy tên tỉnh
  const provinceName = getProvinceNameFromCity(locationName) || locationName;

  // Normalize tên tỉnh (loại bỏ dấu, lowercase, trim)
  const normalized = provinceName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Tìm trong map tỉnh -> mã
  for (const [name, code] of Object.entries(PROVINCE_NAME_TO_CODE)) {
    const normalizedName = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    if (normalizedName === normalized || normalizedName.includes(normalized) || normalized.includes(normalizedName)) {
      return code;
    }
  }

  return null;
};

// API Calls
export const vietnamAddressAPI = {
  // Lấy danh sách quận/huyện từ tên tỉnh/thành phố/huyện đảo
  getDistrictsByProvinceName: async (provinceName: string): Promise<string[]> => {
    try {
      // Bước 1: Map tên thành phố/huyện đảo về tên tỉnh nếu cần
      const actualProvinceName = getProvinceNameFromCity(provinceName) || provinceName;
      
      // Bước 2: Lấy mã tỉnh
      const provinceCode = getProvinceCode(actualProvinceName);
      if (!provinceCode) {
        console.warn(`Không tìm thấy mã tỉnh cho: ${provinceName} (mapped to: ${actualProvinceName})`);
        return [];
      }

      console.log(`📍 Loading districts for: ${provinceName} -> ${actualProvinceName} (code: ${provinceCode})`);

      const response = await axios.get<any>(
        `${VIETNAM_ADDRESS_API_BASE}/p/${provinceCode}?depth=2`,
        {
          timeout: 10000, // 10 seconds timeout
        }
      );

      // API trả về province với districts nested
      const province = response.data;
      const districts = province.districts || [];

      const districtNames = districts.map((d: any) => d.name || d.Name || "").filter((name: string) => name);
      console.log(`✅ Loaded ${districtNames.length} districts for ${actualProvinceName}:`, districtNames.slice(0, 5));
      
      return districtNames;
    } catch (error: any) {
      console.error("Error loading districts from external API:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return [];
    }
  },

  // Lấy danh sách xã/phường từ tên tỉnh và tên quận/huyện
  getWardsByProvinceAndDistrict: async (
    provinceName: string,
    districtName: string
  ): Promise<string[]> => {
    try {
      // Bước 1: Map tên thành phố về tên tỉnh nếu cần
      const actualProvinceName = getProvinceNameFromCity(provinceName) || provinceName;
      
      // Bước 2: Lấy mã tỉnh
      const provinceCode = getProvinceCode(actualProvinceName);
      if (!provinceCode) {
        console.warn(`Không tìm thấy mã tỉnh cho: ${provinceName} (mapped to: ${actualProvinceName})`);
        return [];
      }

      console.log(`📍 Loading wards for: ${provinceName} -> ${actualProvinceName}, district: ${districtName}`);

      // Lấy danh sách quận/huyện để tìm mã quận/huyện
      const response = await axios.get<any>(
        `${VIETNAM_ADDRESS_API_BASE}/p/${provinceCode}?depth=2`
      );

      const province = response.data;
      const districts = province.districts || [];

      // Tìm quận/huyện theo tên (fuzzy match)
      const normalizedDistrictName = districtName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

      const district = districts.find((d: any) => {
        const dName = d.name || d.Name || "";
        const normalizedDName = dName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
        return normalizedDName === normalizedDistrictName || 
               normalizedDName.includes(normalizedDistrictName) ||
               normalizedDistrictName.includes(normalizedDName);
      });

      if (!district || !district.code) {
        console.warn(`Không tìm thấy mã quận/huyện cho: ${districtName} trong tỉnh ${actualProvinceName}`);
        return [];
      }

      console.log(`✅ Found district: ${district.name} (code: ${district.code})`);

      // Lấy danh sách xã/phường
      const wardsResponse = await axios.get<any>(
        `${VIETNAM_ADDRESS_API_BASE}/d/${district.code}?depth=2`
      );

      const districtData = wardsResponse.data;
      const wards = districtData.wards || [];

      const wardNames = wards.map((w: any) => w.name || w.Name || "").filter((name: string) => name);
      console.log(`✅ Loaded ${wardNames.length} wards for ${district.name}`);
      
      return wardNames;
    } catch (error: any) {
      console.error("Error loading wards from external API:", error);
      return [];
    }
  },

  // Lấy danh sách tất cả tỉnh/thành phố
  getAllProvinces: async (): Promise<ProvinceDTO[]> => {
    try {
      const response = await axios.get<ProvinceDTO[]>(`${VIETNAM_ADDRESS_API_BASE}/p/`);
      return response.data;
    } catch (error: any) {
      console.error("Error loading provinces from external API:", error);
      return [];
    }
  },
};

export default vietnamAddressAPI;

