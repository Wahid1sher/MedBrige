import { createContext, useContext, useState, type ReactNode } from 'react';
import { emptySnapshot, type CareSnapshot } from '../services/carePlan';
interface CareContext {
  snapshot: CareSnapshot;
  setSnapshot: React.Dispatch<React.SetStateAction<CareSnapshot>>;
  notice: string;
  setNotice: (text: string) => void;
}
const Context = createContext<CareContext | null>(null);
export function CarePlanProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(emptySnapshot),
    [notice, setNotice] = useState('');
  return (
    <Context.Provider value={{ snapshot, setSnapshot, notice, setNotice }}>
      {children}
    </Context.Provider>
  );
}
export function useCarePlan() {
  const value = useContext(Context);
  if (!value) throw new Error('Care workspace is not available.');
  return value;
}
