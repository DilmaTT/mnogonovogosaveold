import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ActionButton {
  id: string;
  name: string;
  color: string;
}

interface Range {
  id: string;
  name: string;
  hands: Record<string, string>;
}

interface Folder {
  id: string;
  name: string;
  ranges: Range[];
}

interface RangeContextType {
  folders: Folder[];
  actionButtons: ActionButton[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  setActionButtons: React.Dispatch<React.SetStateAction<ActionButton[]>>;
}

const RangeContext = createContext<RangeContextType | undefined>(undefined);

export const useRangeContext = () => {
  const context = useContext(RangeContext);
  if (!context) {
    throw new Error('useRangeContext must be used within a RangeProvider');
  }
  return context;
};

export const RangeProvider = ({ children }: { children: ReactNode }) => {
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('poker-ranges-folders');
    return saved ? JSON.parse(saved) : [{
      id: '1',
      name: 'Folder',
      ranges: [
        {
          id: '1',
          name: 'Range',
          hands: {}
        }
      ]
    }];
  });
  
  const [actionButtons, setActionButtons] = useState<ActionButton[]>(() => {
    const saved = localStorage.getItem('poker-ranges-actions');
    return saved ? JSON.parse(saved) : [{ id: 'raise', name: 'Raise', color: '#8b5cf6' }];
  });

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('poker-ranges-folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('poker-ranges-actions', JSON.stringify(actionButtons));
  }, [actionButtons]);

  return (
    <RangeContext.Provider value={{ folders, actionButtons, setFolders, setActionButtons }}>
      {children}
    </RangeContext.Provider>
  );
};
