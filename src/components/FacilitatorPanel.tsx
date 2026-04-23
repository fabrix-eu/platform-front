import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface FacilitatorPanelContextValue {
  content: ReactNode | null;
  setContent: (content: ReactNode | null) => void;
}

const FacilitatorPanelContext = createContext<FacilitatorPanelContextValue | null>(null);

export function FacilitatorPanelProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null);
  return (
    <FacilitatorPanelContext.Provider value={{ content, setContent }}>
      {children}
    </FacilitatorPanelContext.Provider>
  );
}

export function useFacilitatorPanel(content: ReactNode | null) {
  const ctx = useContext(FacilitatorPanelContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setContent(content);
    return () => ctx.setContent(null);
  }, [content]);
}

export function FacilitatorPanelSlot() {
  const ctx = useContext(FacilitatorPanelContext);
  if (!ctx?.content) return null;

  return (
    <aside className="w-80 shrink-0 bg-gray-100 border-l border-gray-200">
      <div className="sticky top-0 h-[calc(100vh-57px)] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facilitator</span>
        </div>
        {ctx.content}
      </div>
    </aside>
  );
}
