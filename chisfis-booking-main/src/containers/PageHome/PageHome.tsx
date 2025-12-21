import SectionHero from "components/SectionHero/SectionHero";
import SectionSliderNewCategories from "components/SectionSliderNewCategories/SectionSliderNewCategories";
import React, { useState, useEffect } from "react";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import SectionOurFeatures from "components/SectionOurFeatures/SectionOurFeatures";
import SectionGridFeaturePlaces from "./SectionGridFeaturePlaces";
import SectionHowItWork from "components/SectionHowItWork/SectionHowItWork";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import BgGlassmorphism from "components/BgGlassmorphism/BgGlassmorphism";
import { TaxonomyType, AuthorType } from "data/types";
import SectionGridAuthorBox from "components/SectionGridAuthorBox/SectionGridAuthorBox";
import SectionGridCategoryBox from "components/SectionGridCategoryBox/SectionGridCategoryBox";
import SectionBecomeAnAuthor from "components/SectionBecomeAnAuthor/SectionBecomeAnAuthor";
import SectionVideos from "./SectionVideos";
import SectionWhyChooseCondotel from "components/SectionWhyChooseCondotel/SectionWhyChooseCondotel";
import { useTranslation } from "i18n/LanguageContext";
import locationAPI, { LocationDTO } from "api/location";
import condotelAPI from "api/condotel";
import hostAPI, { TopHostDTO } from "api/host";
import { toastError } from "utils/toast";

function PageHome() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<TaxonomyType[]>([]);
  const [locations2, setLocations2] = useState<TaxonomyType[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<TaxonomyType[]>([]);
  const [topHosts, setTopHosts] = useState<AuthorType[]>([]);
  const [loading, setLoading] = useState(true);

  // Load locations from API
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        const locationsData = await locationAPI.getAllPublic();
        
        // Convert LocationDTO to TaxonomyType
        const convertedLocations: TaxonomyType[] = locationsData.map((loc: LocationDTO, index: number) => ({
          id: loc.locationId.toString(),
          href: `/listing-stay?locationId=${loc.locationId}`,
          name: loc.name || `Location ${loc.locationId}`,
          taxonomy: "category",
          count: 0, // Will be updated after fetching condotel count
          thumbnail: loc.imageUrl || `https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80&sig=${loc.locationId}`,
        }));

        // Fetch condotel count for each location
        const locationsWithCount = await Promise.all(
          convertedLocations.map(async (loc) => {
            try {
              const condotels = await condotelAPI.getCondotelsByLocationId(Number(loc.id));
              return { ...loc, count: condotels.length };
            } catch (err) {
              return { ...loc, count: 0 };
            }
          })
        );

        // Split into three arrays: first section gets 3 locations, second section gets 2 locations, nearby section gets remaining
        const firstSection = locationsWithCount.slice(0, 3); // Lấy 3 locations đầu tiên
        const secondSection = locationsWithCount.slice(3, 5); // Lấy 2 locations tiếp theo (từ vị trí 3 đến 5)
        
        // Nearby section: 
        // - Nếu có >= 6 locations: lấy từ vị trí 5 trở đi, tối đa 8 locations
        // - Nếu có < 6 locations: lấy tất cả locations (để hiển thị trong nearby section)
        let nearbySection: TaxonomyType[] = [];
        if (locationsWithCount.length >= 6) {
          nearbySection = locationsWithCount.slice(5, Math.min(13, locationsWithCount.length));
        } else {
          // Nếu có ít locations, lấy tất cả để hiển thị trong nearby section
          nearbySection = locationsWithCount.slice(0, Math.min(8, locationsWithCount.length));
        }

        setLocations(firstSection.length > 0 ? firstSection : []);
        setLocations2(secondSection.length > 0 ? secondSection : []);
        setNearbyLocations(nearbySection.length > 0 ? nearbySection : []);
      } catch (err: any) {
        toastError("Không thể tải danh sách địa điểm");
        // Fallback to demo data on error
        setLocations([]);
        setLocations2([]);
        setNearbyLocations([]);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  // Load top hosts from API
  useEffect(() => {
    const loadTopHosts = async () => {
      try {
        const topHostsData = await hostAPI.getTopRated(10);
        
        if (!topHostsData || !Array.isArray(topHostsData) || topHostsData.length === 0) {
          setTopHosts([]);
          return;
        }
        
        // Map TopHostDTO to AuthorType
        const mappedHosts: AuthorType[] = topHostsData.map((host: TopHostDTO) => {
          const nameParts = (host.fullName || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const displayName = host.fullName || 'Host';
          
          return {
            id: host.hostId,
            firstName: firstName,
            lastName: lastName,
            displayName: displayName,
            avatar: host.avatarUrl || '',
            count: host.totalCondotels || 0,
            desc: `${host.totalReviews || 0} đánh giá • ${host.totalCondotels || 0} condotel`,
            jobName: host.companyName || 'Host',
            href: `/author/${host.hostId}`,
            starRating: host.averageRating || 0,
          };
        });
        
        setTopHosts(mappedHosts);
      } catch (err: any) {
        toastError("Không thể tải danh sách host nổi bật");
        setTopHosts([]);
      }
    };

    loadTopHosts();
  }, []);

  // Fallback demo data if API fails or no locations
  const DEMO_CATS: TaxonomyType[] = [
    {
      id: "1",
      href: "/listing-stay",
      name: t.home.destinations.hanoi,
      taxonomy: "category",
      count: 15234,
      thumbnail:
        "https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "2",
      href: "/listing-stay",
      name: t.home.destinations.hoChiMinh,
      taxonomy: "category",
      count: 18956,
      thumbnail:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "3",
      href: "/listing-stay",
      name: t.home.destinations.daNang,
      taxonomy: "category",
      count: 12456,
      thumbnail:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "4",
      href: "/listing-stay",
      name: t.home.destinations.haLong,
      taxonomy: "category",
      count: 9876,
      thumbnail:
        "https://images.unsplash.com/photo-1552465011-bf9c67938f1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "5",
      href: "/listing-stay",
      name: t.home.destinations.hoiAn,
      taxonomy: "category",
      count: 11234,
      thumbnail:
        "https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "6",
      href: "/listing-stay",
      name: t.home.destinations.nhaTrang,
      taxonomy: "category",
      count: 8765,
      thumbnail:
        "https://images.unsplash.com/photo-1552465011-bf9c67938f1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "7",
      href: "/listing-stay",
      name: t.home.destinations.phuQuoc,
      taxonomy: "category",
      count: 6543,
      thumbnail:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "8",
      href: "/listing-stay",
      name: t.home.destinations.sapa,
      taxonomy: "category",
      count: 5432,
      thumbnail:
        "https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
  ];

  const DEMO_CATS_2: TaxonomyType[] = [
    {
      id: "1",
      href: "/listing-stay",
      name: t.home.destinations.hue,
      taxonomy: "category",
      count: 8765,
      thumbnail:
        "https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "2",
      href: "/listing-stay",
      name: t.home.destinations.daLat,
      taxonomy: "category",
      count: 7654,
      thumbnail:
        "https://images.unsplash.com/photo-1552465011-bf9c67938f1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "3",
      href: "/listing-stay",
      name: t.home.destinations.muiNe,
      taxonomy: "category",
      count: 5432,
      thumbnail:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "4",
      href: "/listing-stay",
      name: t.home.destinations.vungTau,
      taxonomy: "category",
      count: 4321,
      thumbnail:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      id: "5",
      href: "/listing-stay",
      name: t.home.destinations.catBa,
      taxonomy: "category",
      count: 3210,
      thumbnail:
        "https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
  ];

  return (
    <div className="nc-PageHome relative overflow-hidden">
      {/* GLASSMOPHIN */}
      <BgGlassmorphism />

      <div className="container relative space-y-24 mb-24 lg:space-y-28 lg:mb-28">
        {/* SECTION HERO */}
        <SectionHero className="pt-10 lg:pt-16 lg:pb-16" />

        {/* SECTION 1 - 3 locations */}
        <SectionSliderNewCategories
          categories={locations.length > 0 ? locations : DEMO_CATS.slice(0, 3)}
          heading={locations.length > 0 ? "Điểm đến nổi bật" : t.home.popularDestinations}
          subHeading={locations.length > 0 ? "Khám phá những địa điểm du lịch hấp dẫn nhất" : t.home.popularDestinationsSubtitle}
          uniqueClassName="PageHome_s1"
        />

        {/* SECTION2 */}
        <SectionOurFeatures />

        {/* SECTION */}
        <div className="relative py-16">
          <BackgroundSection />
          <SectionGridFeaturePlaces />
        </div>

        {/* SECTION */}
        <SectionHowItWork />

        {/* SECTION 2 - 2 locations */}
        <div className="relative py-16">
          <BackgroundSection className="bg-orange-50 dark:bg-black dark:bg-opacity-20 " />
          <SectionSliderNewCategories
            categories={locations2.length > 0 ? locations2 : DEMO_CATS_2.slice(0, 2)}
            categoryCardType="card4"
            itemPerRow={4}
            heading={locations2.length > 0 ? "Điểm đến được yêu thích" : t.home.popularDestinations}
            subHeading={locations2.length > 0 ? "Những địa điểm được du khách đánh giá cao" : t.home.popularDestinationsSubtitle}
            sliderStyle="style2"
            uniqueClassName="PageHome_s2"
          />
        </div>

        {/* SECTION */}
        <SectionSubscribe2 />

        {/* SECTION - Top Hosts */}
        <div className="relative py-16">
          <BackgroundSection className="bg-orange-50 dark:bg-black dark:bg-opacity-20 " />
          <SectionGridAuthorBox 
            authors={topHosts.length > 0 ? topHosts : undefined}
            key={`top-hosts-${topHosts.length}`}
          />
        </div>

        {/* SECTION - Khám phá gần đây */}
        <SectionGridCategoryBox 
          categories={nearbyLocations.length > 0 ? nearbyLocations : undefined}
        />

        {/* SECTION */}
        <div className="relative py-16">
          <BackgroundSection />
          <SectionBecomeAnAuthor />
        </div>

        {/* SECTION - Why Choose Condotel */}
        <div className="relative py-16">
          <BackgroundSection className="bg-amber-50 dark:bg-black dark:bg-opacity-20 " />
          <SectionWhyChooseCondotel />
        </div>

        {/* SECTION */}
        <SectionVideos />

        {/* SECTION */}
        <div className="relative py-16">
          <BackgroundSection />
          <SectionOurFeatures type="type2" />
        </div>
      </div>
    </div>
  );
}

export default PageHome;
