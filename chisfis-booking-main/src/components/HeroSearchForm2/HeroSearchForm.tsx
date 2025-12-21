import React, { FC } from "react";
import StaySearchForm, { StaySearchFormFields } from "./StaySearchForm";

export type SearchTab = "Stays";

export interface HeroSearchFormProps {
  className?: string;
  defaultTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
  defaultFieldFocus?: StaySearchFormFields;
}

const HeroSearchForm: FC<HeroSearchFormProps> = ({
  className = "",
  defaultTab = "Stays",
  onTabChange,
  defaultFieldFocus,
}) => {
  const renderForm = () => {
    return <StaySearchForm defaultFieldFocus={defaultFieldFocus} />;
  };

  return (
    <div
      className={`nc-HeroSearchForm ${className}`}
      data-nc-id="HeroSearchForm"
    >
      <div className="mt-2">{renderForm()}</div>
    </div>
  );
};

export default HeroSearchForm;
