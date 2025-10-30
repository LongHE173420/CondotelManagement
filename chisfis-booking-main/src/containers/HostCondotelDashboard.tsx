import React, { useEffect, useState } from "react";
import CondotelCard from "components/CondotelCard/CondotelCard";
import Button from "shared/Button/Button";
import { useNavigate } from "react-router-dom";
import condotelAPI, { CondotelDTO } from "api/condotel";

const HostCondotelDashboard = () => {
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCondotels();
  }, []);

  const fetchCondotels = async () => {
    try {
      setLoading(true);
      const data = await condotelAPI.getAll();
      setCondotels(data);
    } catch {
      setCondotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate("/add-listing-1");
  };

  return (
    <div className="px-4 max-w-6xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Danh sách căn hộ của bạn</h2>
        <Button onClick={handleAdd}>+ Thêm căn hộ</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-14">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600"></div>
        </div>
      ) : condotels.length === 0 ? (
        <p>Chưa có căn hộ nào.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {condotels.map((item) => (
            <CondotelCard key={item.condotelId} data={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HostCondotelDashboard;
