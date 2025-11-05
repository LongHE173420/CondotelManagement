import React, { useEffect, useState } from "react";
import CondotelCard from "components/CondotelCard/CondotelCard";
import Button from "shared/Button/Button";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import condotelAPI, { CondotelDTO } from "api/condotel";
import HostPromotionContent from "containers/HostPromotionPage/HostPromotionContent";

const HostCondotelDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "condotels";

  // Ensure only Host can access
  useEffect(() => {
    if (isAuthenticated && user?.roleName !== "Host") {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (activeTab === "condotels") {
      fetchCondotels();
    }
  }, [activeTab]);

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
    navigate("/add-condotel");
  };

  const handleTabChange = (tab: string) => {
    navigate(`/host-dashboard?tab=${tab}`);
  };

  return (
    <div className="px-4 max-w-6xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Host Dashboard</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Quản lý condotel và khuyến mãi của bạn
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleTabChange("condotels")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "condotels"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Condotels
          </button>
          <button
            onClick={() => handleTabChange("promotions")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "promotions"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Khuyến mãi
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "promotions" ? (
        <div className="mt-6">
          <HostPromotionContent />
        </div>
      ) : (
        <>
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
                <div key={item.condotelId} className="space-y-3">
                  <CondotelCard data={item} />
                  <div className="flex gap-2">
                    <ButtonPrimary onClick={() => navigate(`/edit-condotel/${item.condotelId}`)}>
                      Sửa
                    </ButtonPrimary>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HostCondotelDashboard;






