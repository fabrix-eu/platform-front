import { LISTING_TYPES, LISTING_CATEGORIES, LISTING_SUBCATEGORIES, CATEGORIES_BY_TYPE } from '../lib/listings';

interface SpecialtySelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function SpecialtySelector({ value, onChange }: SpecialtySelectorProps) {
  const toggleCategory = (category: string) => {
    if (value.includes(category)) {
      // Remove category + all its subcategories
      const subKeys = Object.keys(LISTING_SUBCATEGORIES[category] ?? {});
      onChange(value.filter((v) => v !== category && !subKeys.includes(v)));
    } else {
      onChange([...value, category]);
    }
  };

  const toggleSubcategory = (sub: string) => {
    if (value.includes(sub)) {
      onChange(value.filter((v) => v !== sub));
    } else {
      onChange([...value, sub]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Specialties
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Select the areas that describe your activities, then refine with specific skills.
      </p>

      <div className="space-y-4">
        {Object.entries(CATEGORIES_BY_TYPE).map(([type, categories]) => (
          <div key={type}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {LISTING_TYPES[type].label}
            </p>
            <div className="space-y-2">
              {categories.map((cat) => {
                const catSelected = value.includes(cat);
                const subcategories = LISTING_SUBCATEGORIES[cat];
                const hasSubcategories = subcategories && Object.keys(subcategories).length > 0;

                return (
                  <div key={cat}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        catSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {catSelected && (
                        <svg className="w-3 h-3 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                      {LISTING_CATEGORIES[cat].label}
                    </button>

                    {catSelected && hasSubcategories && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 ml-4 pl-3 border-l-2 border-primary/20">
                        {Object.entries(subcategories).map(([subKey, sub]) => {
                          const subSelected = value.includes(subKey);
                          return (
                            <button
                              key={subKey}
                              type="button"
                              onClick={() => toggleSubcategory(subKey)}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                                subSelected
                                  ? 'bg-primary/10 text-primary border-primary/30'
                                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                              }`}
                            >
                              {subSelected && (
                                <svg className="w-2.5 h-2.5 inline-block mr-0.5 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              )}
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-gray-500 mt-3">
          {value.length} specialt{value.length === 1 ? 'y' : 'ies'} selected
        </p>
      )}
    </div>
  );
}
