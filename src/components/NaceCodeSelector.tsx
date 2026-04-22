import { useState, useMemo, useRef, useEffect } from 'react';
import naceData from '../lib/nace-codes.json';

interface NACEClass { code: string; label: string }
interface NACEGroup { code: string; label: string; classes: NACEClass[] }
interface NACEDivision { code: string; label: string; groups: NACEGroup[] }
interface NACESection { code: string; label: string; divisions: NACEDivision[] }

type NACENode = {
  code: string;
  label: string;
  level: 'section' | 'division' | 'group' | 'class';
  children?: NACENode[];
};

interface NaceCodeSelectorProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
}

function buildTree(sections: NACESection[]): NACENode[] {
  return sections.map((s) => ({
    code: s.code,
    label: s.label,
    level: 'section' as const,
    children: s.divisions.map((d) => ({
      code: d.code,
      label: d.label,
      level: 'division' as const,
      children: d.groups.map((g) => ({
        code: g.code,
        label: g.label,
        level: 'group' as const,
        children: g.classes.map((c) => ({
          code: c.code,
          label: c.label,
          level: 'class' as const,
        })),
      })),
    })),
  }));
}

function filterTree(nodes: NACENode[], query: string): NACENode[] {
  const q = query.toLowerCase();
  return nodes
    .map((node) => {
      const matches = node.code.toLowerCase().includes(q) || node.label.toLowerCase().includes(q);
      if (node.children) {
        const filtered = filterTree(node.children, query);
        if (filtered.length > 0 || matches) return { ...node, children: filtered };
      } else if (matches) {
        return node;
      }
      return null;
    })
    .filter((n): n is NACENode => n !== null);
}

function findNode(nodes: NACENode[], code: string): NACENode | null {
  for (const n of nodes) {
    if (n.code === code) return n;
    if (n.children) {
      const found = findNode(n.children, code);
      if (found) return found;
    }
  }
  return null;
}

function TreeNode({
  node,
  depth,
  search,
  selected,
  expanded,
  multiple,
  onToggleExpand,
  onSelect,
}: {
  node: NACENode;
  depth: number;
  search: string;
  selected: Set<string>;
  expanded: Set<string>;
  multiple: boolean;
  onToggleExpand: (code: string) => void;
  onSelect: (code: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.code);
  const isSelected = selected.has(node.code);

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-primary/5' : ''}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.code)}
            className="w-4 h-4 flex items-center justify-center shrink-0 text-gray-400"
          >
            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {multiple ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(node.code)}
            className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-ring shrink-0"
          />
        ) : (
          <input
            type="radio"
            checked={isSelected}
            onChange={() => onSelect(node.code)}
            className="w-3.5 h-3.5 border-gray-300 text-primary focus:ring-ring shrink-0"
          />
        )}

        <button
          type="button"
          className="flex-1 flex items-center gap-1.5 text-left min-w-0"
          onClick={() => (hasChildren ? onToggleExpand(node.code) : onSelect(node.code))}
        >
          <span className="font-mono text-[11px] text-gray-400 shrink-0">{highlight(node.code, search)}</span>
          <span className="text-sm text-gray-700 truncate">{highlight(node.label, search)}</span>
        </button>
      </div>

      {hasChildren && isExpanded && node.children!.map((child) => (
        <TreeNode
          key={child.code}
          node={child}
          depth={depth + 1}
          search={search}
          selected={selected}
          expanded={expanded}
          multiple={multiple}
          onToggleExpand={onToggleExpand}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function NaceCodeSelector({
  value,
  onChange,
  multiple = false,
  placeholder = 'Select NACE code...',
}: NaceCodeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const data = naceData as { sections: NACESection[] };
  const tree = useMemo(() => buildTree(data.sections), [data]);

  const selected = useMemo(() => {
    if (!value) return new Set<string>();
    return new Set(Array.isArray(value) ? value : [value]);
  }, [value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tree;
    return filterTree(tree, search);
  }, [tree, search]);

  // Auto-expand when searching
  useEffect(() => {
    if (search.trim()) {
      const codes = new Set<string>();
      const collect = (nodes: NACENode[]) => {
        nodes.forEach((n) => { codes.add(n.code); if (n.children) collect(n.children); });
      };
      collect(filtered);
      setExpanded(codes);
    }
  }, [search, filtered]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleExpand = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const handleSelect = (code: string) => {
    if (multiple) {
      const next = new Set(selected);
      if (next.has(code)) next.delete(code); else next.add(code);
      onChange(Array.from(next));
    } else {
      onChange(code);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const displayValue = useMemo(() => {
    if (selected.size === 0) return placeholder;
    if (multiple) return `${selected.size} code${selected.size > 1 ? 's' : ''} selected`;
    const code = Array.from(selected)[0];
    const node = findNode(tree, code);
    return node ? `${node.code} — ${node.label}` : code;
  }, [selected, multiple, placeholder, tree]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={`truncate ${selected.size === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
          {displayValue}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {selected.size > 0 && (
            <span
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="border-b border-border p-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code or label..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          {/* Tree */}
          <div className="max-h-80 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No results found.</p>
            ) : (
              filtered.map((node) => (
                <TreeNode
                  key={node.code}
                  node={node}
                  depth={0}
                  search={search}
                  selected={selected}
                  expanded={expanded}
                  multiple={multiple}
                  onToggleExpand={toggleExpand}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>

          {/* Footer for multiple */}
          {multiple && selected.size > 0 && (
            <div className="border-t border-border px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{selected.size} selected</span>
              <button type="button" onClick={handleClear} className="text-xs text-gray-500 hover:text-gray-700">
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
