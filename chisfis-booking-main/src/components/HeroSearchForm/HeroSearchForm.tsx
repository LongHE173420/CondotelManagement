import React, { FC } from "react";
import StaySearchForm from "./StaySearchForm";

export type SearchTab = "Stays";

export interface HeroSearchFormProps {
  className?: string;
  currentTab?: SearchTab;
  currentPage?: "Stays";
}

const HeroSearchForm: FC<HeroSearchFormProps> = ({
  className = "",
  currentTab = "Stays",
  currentPage,
}) => {
  const renderForm = () => {
    const isArchivePage = !!currentPage && !!currentTab;
    return <StaySearchForm haveDefaultValue={isArchivePage} />;
  };

  return (
    <div
      className={`nc-HeroSearchForm w-full max-w-6xl py-5 lg:py-0 ${className}`}
      data-nc-id="HeroSearchForm"
    >
      {renderForm()}
    </div>
  );
};

export default HeroSearchForm;
