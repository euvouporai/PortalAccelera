
import React, { createContext, useContext, useReducer } from 'react';
import { supabase } from '../services/supabase';

const getPreviousMonthString = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().substring(0, 7);
};

export interface AppState {
  view: string;
  selectedId: string | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userId: string | null; 
  profileId: string | null; 
  userName: string | null;
  userRole: string | null;
  needsPasswordChange: boolean;
  isSidebarOpen: boolean;
  darkMode: boolean;
  breadcrumbs: { label: string; view: string; id?: string }[];
  billingFilters: {
    query: string;
    status: string;
    mes: string;
    mesFim: string;
    viewType: 'list' | 'analytics' | 'kanban';
  };
  portalConfig: {
    logoLarge: string | null;
    logoMini: string | null;
  };
}

export const initialState: AppState = {
  view: 'inicio', 
  selectedId: null,
  isAuthenticated: false,
  isAuthReady: false,
  userId: null,
  profileId: null,
  userName: null,
  userRole: null,
  needsPasswordChange: false,
  isSidebarOpen: false,
  darkMode: false,
  breadcrumbs: [{ label: 'Início', view: 'inicio' }],
  billingFilters: {
    query: '',
    status: '',
    mes: getPreviousMonthString(),
    mesFim: "2027-12",
    viewType: 'list'
  },
  portalConfig: {
    logoLarge: null,
    logoMini: null
  }
};

export type Action =
  | { type: 'SET_AUTH_READY'; payload: { id: string; profileId?: string; name?: string; role?: string } }
  | { type: 'LOGIN'; payload: { id: string; profileId: string; name: string; role: string; needsPasswordChange?: boolean } }
  | { type: 'PASSWORD_CHANGED' }
  | { type: 'UPDATE_PROFILE'; payload: { name: string } }
  | { type: 'LOGOUT' }
  | { type: 'NAVIGATE'; payload: { view: string; id?: string; label?: string } }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'UPDATE_BILLING_FILTERS'; payload: Partial<AppState['billingFilters']> }
  | { type: 'UPDATE_PORTAL_CONFIG'; payload: Partial<AppState['portalConfig']> };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_AUTH_READY':
      return { 
        ...state, 
        isAuthReady: true, 
        userId: action.payload.id,
        profileId: action.payload.profileId || action.payload.id,
        userName: action.payload.name || 'Admin',
        userRole: action.payload.role || 'Administrador'
      };
    case 'LOGIN':
      return { 
        ...state, 
        isAuthenticated: true, 
        isAuthReady: true,
        userId: action.payload.id,
        profileId: action.payload.profileId,
        userName: action.payload.name,
        userRole: action.payload.role,
        needsPasswordChange: !!action.payload.needsPasswordChange,
        view: 'inicio' 
      };
    case 'PASSWORD_CHANGED':
      return { ...state, needsPasswordChange: false };
    case 'UPDATE_PROFILE':
      return { ...state, userName: action.payload.name };
    case 'LOGOUT':
      supabase.auth.signOut();
      return { 
        ...state, 
        isAuthenticated: false, 
        isAuthReady: false,
        userId: null,
        profileId: null,
        userName: null,
        userRole: null,
        needsPasswordChange: false,
        view: 'inicio' 
      };
    case 'NAVIGATE':
      let newBreadcrumbs: { label: string; view: string; id?: string }[] = [{ label: 'Início', view: 'inicio' }];
      if (action.payload.view !== 'inicio') {
        const labels: Record<string, string> = {
          inicio: 'Início',
          cooperados: 'Cooperados',
          detalheCooperado: 'Detalhes do Cooperado',
          clientes: 'Clientes',
          detalheCliente: 'Detalhes do Cliente',
          projetos: 'Projetos',
          detalheProjeto: 'Detalhes do Projeto',
          faturamentos: 'Faturamentos',
          detalheFaturamento: 'Detalhes do Faturamento',
          oportunidades: 'Oportunidades',
          detalheOportunidade: 'Detalhes da Oportunidade',
          relatorios: 'Relatórios',
          insights: 'Insights de IA',
          usuarios: 'Gestão de Usuários',
          settings: 'Configurações'
        };
        newBreadcrumbs.push({ 
          label: labels[action.payload.view] || action.payload.view, 
          view: action.payload.view 
        });
        
        if (action.payload.label) {
           newBreadcrumbs.push({ label: action.payload.label, view: action.payload.view, id: action.payload.id });
        }
      }
      return { 
        ...state, 
        view: action.payload.view, 
        selectedId: action.payload.id || null,
        isSidebarOpen: false,
        breadcrumbs: newBreadcrumbs
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'CLOSE_SIDEBAR':
      return { ...state, isSidebarOpen: false };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'UPDATE_BILLING_FILTERS':
      return { ...state, billingFilters: { ...state.billingFilters, ...action.payload } };
    case 'UPDATE_PORTAL_CONFIG':
      return { ...state, portalConfig: { ...state.portalConfig, ...action.payload } };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  supabase: typeof supabase;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children, value }: { children?: React.ReactNode; value: AppContextType }) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
