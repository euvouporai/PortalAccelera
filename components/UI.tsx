
import React, { useState, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// --- LOGO ACCELERA ---
export const Logo = ({ className = "h-8", light = false, mini = false }: { className?: string, light?: boolean, mini?: boolean }) => {
  const { state } = useAppContext();
  const customLogo = mini ? state.portalConfig.logoMini : state.portalConfig.logoLarge;

  if (customLogo) {
    return (
      <div className={`flex items-center select-none ${className}`}>
        <img src={customLogo} alt="Logo" className="h-full w-auto object-contain" />
      </div>
    );
  }

  return (
    <div className={`flex items-center select-none ${className}`}>
      <svg viewBox="0 0 400 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M42.5 75.8C33.2 75.8 25.5 72.8 19.4 66.8C13.3 60.8 10.3 53.1 10.3 43.8C10.3 34.5 13.3 26.8 19.4 20.8C25.5 14.8 33.2 11.8 42.5 11.8C51.8 11.8 59.5 14.8 65.6 20.8C71.7 26.8 74.7 34.5 74.7 43.8V75.8H62.7V43.8C62.7 38.4 60.9 33.9 57.3 30.3C53.7 26.7 49.2 24.9 43.8 24.9C38.4 24.9 33.9 26.7 30.3 30.3C26.7 33.9 24.9 38.4 24.9 43.8C24.9 49.2 26.7 53.7 30.3 57.3C33.9 60.9 38.4 62.7 43.8 62.7H50.5C53 66.7 56.4 70.3 61.2 73.5C56 75 50.5 75.8 42.5 75.8Z" className={light ? "fill-white" : "fill-gray-900 dark:fill-white"} />
        <path d="M43.8 62.7H55.5C53.5 67.5 50.2 71.8 42.5 75.8H35V62.7H43.8Z" fill="#3B82F6" />
        {!mini && <text x="85" y="75" className={`text-8xl font-black tracking-tighter ${light ? "fill-white" : "fill-gray-900 dark:fill-white"}`} style={{ fontFamily: 'Inter, sans-serif' }}>ccelera</text>}
      </svg>
    </div>
  );
};

// --- COMPONENTES ATÔMICOS DE DESIGN SYSTEM ---

export const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
  <div className="flex items-center gap-3 mb-8 mt-12 first:mt-0">
    <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
    {Icon && <Icon className="h-5 w-5 text-blue-600" />}
    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{title}</h3>
  </div>
);

export const DetailBox = ({ label, value, icon: Icon, color = "text-gray-900 dark:text-white" }: any) => (
  <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-inner group hover:border-blue-200 dark:hover:border-blue-800 transition-all h-full">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="h-3 w-3 text-gray-400" />}
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] block ml-1">{label}</span>
    </div>
    <span className={`font-black text-base tracking-tight leading-tight block truncate ${color}`} title={value}>
      {value || '-'}
    </span>
  </div>
);

export const ActionButton = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const styles: any = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20',
    secondary: 'bg-white dark:bg-gray-800 text-blue-600 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
    danger: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-600 hover:text-white',
    ghost: 'bg-transparent text-gray-400 hover:text-blue-600'
  };
  return (
    <button 
      className={`px-8 py-4 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${styles[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

// Fix: Make children optional to avoid TS error in Clientes view
export const Badge = ({ children, status = 'default' }: { children?: React.ReactNode, status?: string }) => {
  const colors: any = {
    Ativo: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Pago: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Pendente: "bg-rose-50 text-rose-600 border-rose-100",
    "Nota Enviada": "bg-blue-50 text-blue-600 border-blue-100",
    "Solicitação Enviada": "bg-indigo-50 text-indigo-600 border-indigo-100",
    "Validado com Cliente": "bg-amber-50 text-amber-600 border-amber-100",
    default: "bg-gray-50 text-gray-500 border-gray-100"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest ${colors[status] || colors.default}`}>
      {children}
    </span>
  );
};

// --- PAGINATION ---
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) => {
  if (totalPages <= 1) return null;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-4 py-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        Exibindo <span className="text-gray-900 dark:text-white">{startItem}-{endItem}</span> de <span className="text-gray-900 dark:text-white">{totalItems}</span> registros
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-500"><ChevronLeft className="h-4 w-4" /></button>
        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i + 1;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            }
            return (
              <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{pageNum}</button>
            );
          })}
        </div>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-500"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
};

// --- TOAST ---
interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' | 'info'; }
interface ToastContextType { addToast: (message: string, type?: Toast['type']) => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 5000);
  }, []);
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center p-4 rounded-xl shadow-lg text-white transform transition-all duration-300 translate-y-0 opacity-100 max-w-sm ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-600'}`}>
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />}
            <span className="font-bold text-xs uppercase tracking-tight">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

// --- SKELETON ---
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-3xl ${className}`}></div>;
};
