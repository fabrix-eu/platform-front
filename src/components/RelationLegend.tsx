import { RELATION_TYPES } from '../lib/relations';

export function RelationLegend() {
  return (
    <div className="absolute bottom-2 left-2 bg-white/95 rounded-lg shadow-md z-20 w-52">
      <div className="p-3 border-b border-gray-200">
        <span className="font-semibold text-sm">Relation types</span>
      </div>
      <div className="p-3 space-y-0.5">
        {Object.entries(RELATION_TYPES).map(([key, { label, hex }]) => (
          <div key={key} className="flex items-center gap-2 p-1.5">
            <span className="w-5 h-0.5 flex-shrink-0 rounded" style={{ backgroundColor: hex }} />
            <span className="text-xs leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
