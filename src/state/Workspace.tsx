import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useCarePlan } from './CarePlan';
import { exampleSnapshot, type SessionDocument } from '../services/workspace';
import type { CareSnapshot } from '../services/carePlan';
export interface CareContact {
  id: string;
  name: string;
  relation: string;
  note: string;
}
interface WorkspaceState {
  intakeOpen: boolean;
  intakeView: 'add' | 'result';
  openIntake: () => void;
  showIntakeResult: () => void;
  closeIntake: () => void;
  example: boolean;
  setExample: Dispatch<SetStateAction<boolean>>;
  display: CareSnapshot;
  setDisplay: Dispatch<SetStateAction<CareSnapshot>>;
  documents: SessionDocument[];
  setDocuments: Dispatch<SetStateAction<SessionDocument[]>>;
  contacts: CareContact[];
  setContacts: Dispatch<SetStateAction<CareContact[]>>;
  observations: string;
  setObservations: Dispatch<SetStateAction<string>>;
}
const Context = createContext<WorkspaceState | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { snapshot, setSnapshot } = useCarePlan();
  const [example, setExample] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeView, setIntakeView] = useState<'add' | 'result'>('add');
  const [demo, setDemo] = useState(exampleSnapshot);
  const [documents, setDocuments] = useState<SessionDocument[]>([]);
  const [contacts, setContacts] = useState<CareContact[]>([]);
  const [observations, setObservations] = useState('');
  return (
    <Context.Provider
      value={{
        intakeOpen,
        intakeView,
        openIntake: () => {
          setIntakeView('add');
          setIntakeOpen(true);
        },
        showIntakeResult: () => {
          setIntakeView('result');
          setIntakeOpen(true);
        },
        closeIntake: () => setIntakeOpen(false),
        example,
        setExample,
        display: example ? demo : snapshot,
        setDisplay: example ? setDemo : setSnapshot,
        documents,
        setDocuments,
        contacts,
        setContacts,
        observations,
        setObservations,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const state = useContext(Context);
  if (!state) throw new Error('Workspace is not available.');
  return state;
}
