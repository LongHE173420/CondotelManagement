import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { FC, Fragment } from "react";
import { useLanguage } from "i18n/LanguageContext";
import type { Language } from "i18n/LanguageContext";

interface LanguageOption {
  id: Language;
  name: string;
  nameNative: string;
  description: string;
}

const languages: LanguageOption[] = [
  {
    id: "vi",
    name: "Vietnamese",
    nameNative: "Tiếng Việt",
    description: "Vietnam",
  },
  {
    id: "en",
    name: "English",
    nameNative: "English",
    description: "United States",
  },
];

interface LangDropdownProps {
  panelClassName?: string;
}

const LangDropdown: FC<LangDropdownProps> = ({
  panelClassName = "z-10 w-screen max-w-[280px] px-4 mt-4 right-0 sm:px-0",
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="LangDropdown">
      <Popover className="relative">
        {({ open, close }) => (
          <>
            <Popover.Button
              className={`
                ${open ? "" : "text-opacity-80"}
             group px-3 py-1.5 border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 rounded-full inline-flex items-center text-sm text-gray-700 dark:text-neutral-300 font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            >
              <GlobeAltIcon className="w-[18px] h-[18px] opacity-80" />

              <span className="ml-2 select-none">{t.header.language}</span>
              <ChevronDownIcon
                className={`${open ? "-rotate-180" : "text-opacity-70"}
                  ml-2 h-4 w-4  group-hover:text-opacity-80 transition ease-in-out duration-150`}
                aria-hidden="true"
              />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className={`absolute ${panelClassName}`}>
                <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="relative grid gap-4 bg-white dark:bg-neutral-800 p-4">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          handleLanguageChange(lang.id);
                          close();
                        }}
                        className={`flex items-center p-3 -m-2 transition duration-150 ease-in-out rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 ${
                          language === lang.id
                            ? "bg-gray-100 dark:bg-neutral-700"
                            : "opacity-80"
                        }`}
                      >
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{lang.nameNative}</p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400">
                            {lang.description}
                          </p>
                        </div>
                        {language === lang.id && (
                          <svg
                            className="w-5 h-5 text-primary-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
};
export default LangDropdown;
