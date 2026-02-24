
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Landmark, 
  Calendar, 
  RefreshCcw,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Info,
  ReceiptText
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Skeleton } from '../components/UI';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatCompactCurrency = (val: number) => {
  if (val >= 1000) return `R$${(val / 1000).toFixed(1)}k`;
  return `R$${val}`;
};

const MONTHS = [
  { val: '01', label: 'Jan' }, { val: '02', label: 'Fev' }, { val: '03', label: 'Mar' },
  { val: '04', label: 'Abr' }, { val: '05', label: 'Mai' }, { val: '06', label: 'Jun' },
  { val: '07', label: 'Jul' }, { val: '08', label: 'Ago' }, { val: '09', label: 'Set' },
  { val: '10', label: 'Out' }, { val: '11', label: 'Nov' }, { val: '12', label: 'Dez' }
];

export default function DashboardView() {
  const { supabase } = useAppContext();
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(5, 7));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const [data, setData] = useState({
    faturamentos: [] as any[],
    clientes: [] as any[],
    projetos: [] as any[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fat, cli, proj] = await Promise.all([
        supabase.from('faturamentos').select('valor, valor_realizado, status, mes_referencia, cliente_id, projeto_id'),
        supabase.from('clientes').select('id, nome'),
        supabase.from('projetos').select('id, nome')
      ]);
      setData({ 
        faturamentos: fat.data || [], 
        clientes: cli.data || [], 
        projetos: proj.data || [] 
      });
    } catch (e) {
      console.error("Dashboard Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const filteredData = data.faturamentos.filter(f => {
      const isYearMatch = f.mes_referencia?.startsWith(selectedYear);
      const isMonthMatch = selectedMonth === "" || f.mes_referencia?.endsWith(selectedMonth);
      return isYearMatch && isMonthMatch;
    });

    const totalPlanejado = filteredData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const totalFaturado = filteredData.filter(f => f.status === 'Faturado').reduce((acc, curr) => acc + (Number(curr.valor_realizado) || Number(curr.valor) || 0), 0);
    
    const ytdPlanejado = data.faturamentos
      .filter(f => f.mes_referencia?.startsWith(selectedYear))
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    
    const recebimentoEsperado = filteredData.filter(f => f.status !== 'Faturado').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

    const pipelineCount = {
      previsto: filteredData.filter(f => f.status === 'Previsto').length,
      pendente: filteredData.filter(f => f.status === 'Pendente').length,
      validado: filteredData.filter(f => f.status === 'Validado com Cliente').length,
      solicitado: filteredData.filter(f => f.status === 'Solicitação Enviada').length,
      nota: filteredData.filter(f => f.status === 'Nota Enviada').length,
      faturado: filteredData.filter(f => f.status === 'Faturado').length,
    };

    const clientSummary = data.clientes.map(c => {
      const total = filteredData.filter(f => f.cliente_id === c.id).reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
      return { nome: c.nome, total };
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    const projectSummary = data.projetos.map(p => {
      const total = filteredData.filter(f => f.projeto_id === p.id).reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
      return { nome: p.nome, total };
    }).filter(p => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 6);

    return { totalPlanejado, totalFaturado, ytdPlanejado, recebimentoEsperado, pipelineCount, clientSummary, projectSummary };
  }, [data, selectedMonth, selectedYear]);

  if (loading) return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="grid grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
      <Skeleton className="h-80 rounded-[2.5rem]" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Dashboard</h2>
          <p className="text-gray-500 font-medium">Consolidação estratégica em tempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center px-3 border-r dark:border-gray-700">
            <Filter className="h-3.5 w-3.5 text-blue-600 mr-2" />
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 text-gray-900 dark:text-white cursor-pointer min-w-[100px]">
              <option value="">Todo o Ano</option>
              {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
          </div>
          <div className="px-3">
             <input type="number" min="2020" max="2100" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-transparent border-none p-0 w-16 text-sm font-black focus:ring-0 text-gray-900 dark:text-white" />
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-blue-600"><RefreshCcw className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard label={selectedMonth ? "Planejado no Período" : "Planejado no Ano"} value={formatCurrency(stats.totalPlanejado)} icon={Calendar} color="blue" />
        <SummaryCard label="Total Faturado" value={formatCurrency(stats.totalFaturado)} icon={ReceiptText} color="indigo" />
        <SummaryCard label={`Planejado YTD (${selectedYear})`} value={formatCurrency(stats.ytdPlanejado)} icon={TrendingUp} color="violet" />
        <SummaryCard label="Recebimento Esperado" value={formatCurrency(stats.recebimentoEsperado)} icon={Clock} color="emerald" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-10 tracking-tight">Pipeline de Faturamento</h3>
        <div className="relative flex justify-between overflow-x-auto no-scrollbar pb-2">
          <PipelineStep label="Previsto" count={stats.pipelineCount.previsto} active={stats.pipelineCount.previsto > 0} />
          <PipelineStep label="Pendente" count={stats.pipelineCount.pendente} active={stats.pipelineCount.pendente > 0} />
          <PipelineStep label="Validado" count={stats.pipelineCount.validado} active={stats.pipelineCount.validado > 0} />
          <PipelineStep label="Solicitado" count={stats.pipelineCount.solicitado} active={stats.pipelineCount.solicitado > 0} />
          <PipelineStep label="Nota Enviada" count={stats.pipelineCount.nota} active={stats.pipelineCount.nota > 0} />
          <PipelineStep label="Faturado" count={stats.pipelineCount.faturado} active={stats.pipelineCount.faturado > 0} last />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mb-8">Faturamento por Cliente</h3>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <DonutChart data={stats.clientSummary} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mb-8">Faturamento por Projeto</h3>
          <div className="space-y-6">
            {stats.projectSummary.map((p, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                  <span className="truncate max-w-[200px]">{p.nome}</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(p.total)}</span>
                </div>
                <div className="h-4 bg-gray-50 dark:bg-gray-700/50 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (p.total / (stats.projectSummary[0]?.total || 1)) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30",
    violet: "text-violet-600 bg-violet-50 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800/30",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30",
  };
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg hover:-translate-y-1 group">
      <div className={`p-4 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}><Icon className="h-6 w-6" /></div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    </div>
  );
}

function PipelineStep({ label, count, active, last }: any) {
  return (
    <div className={`flex flex-col items-center flex-1 min-w-[100px] z-10 ${last ? '' : 'relative'}`}>
      <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-500 mb-4 ${
        active ? 'bg-blue-600 border-blue-100 dark:border-blue-900 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300'
      }`}>
        {active ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest text-center px-1 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{label}</span>
      <span className={`text-[10px] font-bold mt-1 ${active ? 'text-blue-600' : 'text-gray-400'}`}>({count})</span>
    </div>
  );
}

function DonutChart({ data }: { data: any[] }) {
  const donutSegments = useMemo(() => {
    const sum = data.reduce((acc, curr) => acc + curr.total, 0);
    if (sum === 0) return [];
    let cumulativePercent = 0;
    const colors = ['#3B82F6', '#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];
    return data.slice(0, 6).map((c, i) => {
      const percent = (c.total / sum) * 100;
      const startOffset = cumulativePercent;
      cumulativePercent += percent;
      return { nome: c.nome, percent, dashArray: `${percent} 100`, dashOffset: `-${startOffset}`, color: colors[i % colors.length] };
    });
  }, [data]);

  return (
    <>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="4"></circle>
          {donutSegments.map((seg, idx) => (
            <circle key={idx} cx="18" cy="18" r="16" fill="none" stroke={seg.color} strokeWidth="4" strokeDasharray={seg.dashArray} strokeDashoffset={seg.dashOffset} className="transition-all duration-1000 ease-out" />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-400 uppercase">Total</span>
          <span className="text-lg font-black dark:text-white">100%</span>
        </div>
      </div>
      <div className="flex-1 space-y-4 w-full">
        {donutSegments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between group">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: seg.color }}></div>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">{seg.nome}</span>
            </div>
            <span className="text-xs font-black text-gray-400">{seg.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </>
  );
}
