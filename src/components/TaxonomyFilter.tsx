import { useState, useRef, useEffect } from 'react';
import {
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
  CATEGORIES_BY_TYPE,
} from '../lib/listings';

interface TaxonomyFilterProps {
  activeType?: string;
  activeCategory?: string;
  activeSubcategory?: string;
  onFilter: (params: { by_type?: string; by_category?: string; by_subcategory?: string }) => void;
}

export function TaxonomyFilter({ activeType, activeCategory, activeSubcategory, onFilter }: TaxonomyFilterProps) {
  const [openType, setOpenType] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        tabsRef.current && !tabsRef.current.contains(e.target as Node)
      ) {
        setOpenType(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeClick = (type: string) => {
    if (openType === type) {
      setOpenType(null);
      return;
    }
    setOpenType(type);
  };

  const handleTypeFilter = (type: string) => {
    onFilter({ by_type: activeType === type ? undefined : type });
    setOpenType(null);
  };

  const handleCategoryClick = (type: string, category: string) => {
    onFilter({ by_type: type, by_category: category });
    setOpenType(null);
  };

  const handleSubcategoryClick = (type: string, category: string, subcategory: string) => {
    onFilter({ by_type: type, by_category: category, by_subcategory: subcategory });
    setOpenType(null);
  };

  const handleClearAll = () => {
    onFilter({});
    setOpenType(null);
  };

  const hasActiveFilter = activeType || activeCategory || activeSubcategory;

  return (
    <div className="relative">
      {/* Type tabs */}
      <div ref={tabsRef} className="flex items-center gap-1.5 flex-wrap">
        {Object.entries(LISTING_TYPES).map(([key, config]) => {
          const isActive = activeType === key;
          const isOpen = openType === key;
          return (
            <button
              key={key}
              onClick={() => handleTypeClick(key)}
              className={`
                group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${isActive
                  ? `${config.badgeColor} ring-2 ring-offset-1 ring-current/20`
                  : isOpen
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-white border border-border text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }
              `}
            >
              {config.label}
              <svg
                className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          );
        })}

        {hasActiveFilter && (
          <button
            onClick={handleClearAll}
            className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilter && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {activeType && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${LISTING_TYPES[activeType]?.badgeColor ?? 'bg-gray-100 text-gray-800'}`}>
              {LISTING_TYPES[activeType]?.label ?? activeType}
              <button
                onClick={() => onFilter({})}
                className="hover:opacity-70 ml-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {activeCategory && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${LISTING_CATEGORIES[activeCategory]?.badgeColor ?? 'bg-gray-100 text-gray-800'}`}>
              {LISTING_CATEGORIES[activeCategory]?.label ?? activeCategory}
              <button
                onClick={() => onFilter({ by_type: activeType })}
                className="hover:opacity-70 ml-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {activeSubcategory && activeCategory && LISTING_SUBCATEGORIES[activeCategory]?.[activeSubcategory] && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {LISTING_SUBCATEGORIES[activeCategory][activeSubcategory].label}
              <button
                onClick={() => onFilter({ by_type: activeType, by_category: activeCategory })}
                className="hover:opacity-70 ml-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      {/* Mega dropdown panel */}
      {openType && (
        <div
          ref={panelRef}
          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-border shadow-lg p-5 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {LISTING_TYPES[openType]?.label}
            </h3>
            <button
              onClick={() => handleTypeFilter(openType)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                activeType === openType
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {activeType === openType ? 'Remove filter' : `Show all ${LISTING_TYPES[openType]?.label}`}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {(CATEGORIES_BY_TYPE[openType] ?? []).map((catKey) => {
              const catConfig = LISTING_CATEGORIES[catKey];
              const subcats = LISTING_SUBCATEGORIES[catKey] ?? {};
              const isCatActive = activeCategory === catKey;

              return (
                <div key={catKey}>
                  <button
                    onClick={() => handleCategoryClick(openType, catKey)}
                    className={`text-xs font-semibold uppercase tracking-wide mb-1.5 transition-colors ${
                      isCatActive
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {catConfig?.label ?? catKey}
                  </button>
                  <ul className="space-y-0.5">
                    {Object.entries(subcats).map(([subKey, subConfig]) => {
                      const isSubActive = activeCategory === catKey && activeSubcategory === subKey;
                      return (
                        <li key={subKey}>
                          <button
                            onClick={() => handleSubcategoryClick(openType, catKey, subKey)}
                            className={`text-sm w-full text-left px-1.5 py-0.5 rounded transition-colors ${
                              isSubActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {subConfig.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
