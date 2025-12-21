import { Tab } from "@headlessui/react";
import React, { Fragment, useState, useEffect } from "react";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import CommonLayout from "./CommonLayout";
import CondotelCard from "components/CondotelCard/CondotelCard";
import { CondotelDTO } from "api/condotel";
import condotelAPI from "api/condotel";
import { useTranslation } from "i18n/LanguageContext";

const AccountSavelists = () => {
  const { t } = useTranslation();
  let [categories] = useState(["Condotels"]);
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCondotels = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await condotelAPI.getAll();
        setCondotels(data);
      } catch (err: any) {
        setError("Không thể tải danh sách condotels");
      } finally {
        setLoading(false);
      }
    };

    loadCondotels();
  }, []);

  const renderSection1 = () => {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-3xl font-semibold">Danh sách Condotels</h2>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        {error && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div>
            <Tab.Group>
              <Tab.List className="flex space-x-1 overflow-x-auto">
                {categories.map((item) => (
                  <Tab key={item} as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`flex-shrink-0 block !leading-none font-medium px-5 py-2.5 text-sm sm:text-base sm:px-6 sm:py-3 capitalize rounded-full focus:outline-none ${
                          selected
                            ? "bg-secondary-900 text-secondary-50 "
                            : "text-neutral-500 dark:text-neutral-400 dark:hover:text-neutral-100 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        } `}
                      >
                        {item}
                      </button>
                    )}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel className="mt-8">
                  {condotels.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {condotels.slice(0, 8).map((condotel) => (
                        <CondotelCard key={condotel.condotelId} data={condotel} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-neutral-500 dark:text-neutral-400">
                        Chưa có condotel nào
                      </p>
                    </div>
                  )}
                  {condotels.length > 8 && (
                    <div className="flex mt-11 justify-center items-center">
                      <ButtonSecondary onClick={() => window.location.href = "/listing-stay"}>
                        {t.condotel.viewMore || "Xem thêm"}
                      </ButtonSecondary>
                    </div>
                  )}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <CommonLayout>{renderSection1()}</CommonLayout>
    </div>
  );
};

export default AccountSavelists;
