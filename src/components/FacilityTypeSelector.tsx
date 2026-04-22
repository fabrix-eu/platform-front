import { useState } from 'react';
import { facilityTypes } from '../lib/facility-types';

interface FacilityTypeSelectorProps {
  facilityTypes: string[];
  processingTypes: string[];
  onFacilityTypesChange: (types: string[]) => void;
  onProcessingTypesChange: (types: string[]) => void;
}

const FACILITY_ICONS: Record<string, string> = {
  'Raw Material Processing or Production': 'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z',
  'Textile or Material Production': 'M7.848 8.25l1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.993.143 1.982.41 2.94M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.994.143-1.983.41-2.941M9.384 14.863l2.077-1.199m0 0 2.077-1.199m-2.077 1.199 2.077 1.199M11.461 13.664l2.077-1.199m0 0a2.164 2.164 0 0 0 1.083-1.838c.005-.994.143-1.983.41-2.941m-1.493 4.779 1.536-.887m-1.536.887a3 3 0 1 0 5.196 3 3 3 0 0 0-5.196-3Zm1.536-.887 1.536.887m-1.536-.887a2.164 2.164 0 0 1 1.083 1.839c.005.993.143 1.982.41 2.94m-1.493-4.779 1.536.887m0 0a3 3 0 1 0 5.196-3 3 3 0 0 0-5.196 3Z',
  'Printing, Product Dyeing and Laundering': 'M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.764m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42',
  'Final Product Assembly': 'M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25',
  'Office / HQ': 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  'Warehousing / Distribution': 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
};

export function FacilityTypeSelector({
  facilityTypes: selectedFacility,
  processingTypes: selectedProcessing,
  onFacilityTypesChange,
  onProcessingTypesChange,
}: FacilityTypeSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(selectedFacility));

  const toggleExpand = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const handleFacilityToggle = (name: string) => {
    const isSelected = selectedFacility.includes(name);
    if (isSelected) {
      onFacilityTypesChange(selectedFacility.filter((f) => f !== name));
      const group = facilityTypes.find((g) => g.name === name);
      if (group) {
        const related = new Set(group.processingTypes);
        onProcessingTypesChange(selectedProcessing.filter((p) => !related.has(p)));
      }
    } else {
      onFacilityTypesChange([...selectedFacility, name]);
      setExpandedGroups((prev) => new Set(prev).add(name));
    }
  };

  const handleProcessingToggle = (processingType: string) => {
    if (selectedProcessing.includes(processingType)) {
      onProcessingTypesChange(selectedProcessing.filter((p) => p !== processingType));
    } else {
      onProcessingTypesChange([...selectedProcessing, processingType]);
    }
  };

  return (
    <div className="space-y-2">
      {facilityTypes.map((group) => {
        const isSelected = selectedFacility.includes(group.name);
        const isExpanded = expandedGroups.has(group.name);
        const iconPath = FACILITY_ICONS[group.name];
        const selectedCount = group.processingTypes.filter((p) => selectedProcessing.includes(p)).length;

        return (
          <div
            key={group.name}
            className={`border rounded-lg transition-colors ${isSelected ? 'border-primary/30 bg-primary/[0.02]' : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleFacilityToggle(group.name)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-ring shrink-0"
              />
              <button
                type="button"
                onClick={() => toggleExpand(group.name)}
                className="flex-1 flex items-center gap-2.5 text-left min-w-0"
              >
                {iconPath && (
                  <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                  </svg>
                )}
                <span className="text-sm font-medium text-gray-900">{group.name}</span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                {selectedCount > 0 && (
                  <span className="text-xs text-primary font-medium">{selectedCount}</span>
                )}
                <button
                  type="button"
                  onClick={() => toggleExpand(group.name)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-2">
                  {group.processingTypes.map((pt) => (
                    <label key={pt} className="flex items-start gap-2 cursor-pointer group/item">
                      <input
                        type="checkbox"
                        checked={selectedProcessing.includes(pt)}
                        onChange={() => handleProcessingToggle(pt)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-ring shrink-0 mt-0.5"
                      />
                      <span className="text-sm text-gray-600 leading-tight group-hover/item:text-gray-900">{pt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {(selectedFacility.length > 0 || selectedProcessing.length > 0) && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-2">
          {selectedFacility.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-800 mb-1">Facility types</p>
              <div className="flex flex-wrap gap-1">
                {selectedFacility.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
                    {t}
                    <button type="button" onClick={() => handleFacilityToggle(t)} className="hover:text-green-950">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {selectedProcessing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-800 mb-1">Processing types</p>
              <div className="flex flex-wrap gap-1">
                {selectedProcessing.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white text-green-700 border border-green-300">
                    {t}
                    <button type="button" onClick={() => handleProcessingToggle(t)} className="hover:text-green-950">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
