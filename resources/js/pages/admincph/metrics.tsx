import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, Table, Tag, Select, Progress, Empty } from 'antd';
import {
    BarChart3, TrendingUp, DollarSign, Users, BookOpen,
    ArrowUpRight, PieChart, ChevronLeft, Filter, Calendar,
    Building2, Briefcase, GraduationCap, X, UserSearch
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Curso, User, PresupuestoGrupo, Area, Departamento, Habilidad, Categoria } from '@/types/capacitaciones';

interface Props {
    cursos: Curso[];
    presupuestoGrupos: PresupuestoGrupo[];
    areas: Area[];
    departamentos: Departamento[];
    habilidades: Habilidad[];
    categorias: Categoria[];
    users: number;
    stats: {
        totalCursos: number;
        totalInscritos: number;
        totalCosto: number;
        totalPresupuesto: number;
        totalGastado: number;
    };
}

const MONTHS = [
    { value: 'Enero', label: 'Enero' }, { value: 'Febrero', label: 'Febrero' },
    { value: 'Marzo', label: 'Marzo' }, { value: 'Abril', label: 'Abril' },
    { value: 'Mayo', label: 'Mayo' }, { value: 'Junio', label: 'Junio' },
    { value: 'Julio', label: 'Julio' }, { value: 'Agosto', label: 'Agosto' },
    { value: 'Septiembre', label: 'Septiembre' }, { value: 'Octubre', label: 'Octubre' },
    { value: 'Noviembre', label: 'Noviembre' }, { value: 'Diciembre', label: 'Diciembre' }
];

export default function Metrics({ cursos, presupuestoGrupos, areas, departamentos, habilidades, categorias, users, stats }: Props) {
    // ---- STATE: Filters ----
    const [filterArea, setFilterArea] = useState<number | null>(null);
    const [filterDept, setFilterDept] = useState<number | null>(null);
    const [filterMonth, setFilterMonth] = useState<string | null>(null);
    const [filterYear, setFilterYear] = useState<string | null>(null);
    const [filterPresupuesto, setFilterPresupuesto] = useState<number | null>(null);
    const [filterUser, setFilterUser] = useState<number | null>(null);

    // Drilldown specific filters
    const [drillCategoria, setDrillCategoria] = useState<number | null>(null);
    const [drillCurso, setDrillCurso] = useState<number | null>(null);

    // Unique user list derived from courses for the Colaborador filter
    const allUsers = useMemo(() => {
        const map = new Map<number, { id: number; name: string; id_departamento?: number; deptNombre: string }>();
        cursos.forEach(c => {
            (c.users || []).forEach(u => {
                if (!map.has(u.id)) {
                    map.set(u.id, {
                        id: u.id,
                        name: u.name,
                        id_departamento: u.id_departamento,
                        deptNombre: u.departamento?.nombre || 'Sin depto',
                    });
                }
            });
        });
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [cursos]);

    // Derived standard dropdowns
    const filteredDepts = useMemo(() => {
        if (!filterArea) return departamentos;
        return departamentos.filter(d => d.id_area === filterArea);
    }, [filterArea, departamentos]);

    const years = useMemo(() => {
        const y = new Set<string>();
        cursos.forEach(c => c.anio_formacion && y.add(c.anio_formacion.toString()));
        presupuestoGrupos.forEach(g => {
            const match = g.descripcion.match(/\b(20\d{2})\b/);
            if (match) y.add(match[1]);
        });
        return Array.from(y).sort().reverse();
    }, [cursos, presupuestoGrupos]);

    // ---- DATA FILTERING ----
    const { filteredCursos, filteredPresupuestos } = useMemo(() => {
        return {
            filteredCursos: cursos.filter(c => {
                if (filterMonth && c.mes_pago !== filterMonth) return false;
                if (filterYear && c.anio_formacion?.toString() !== filterYear) return false;
                if (filterPresupuesto && c.id_presupuesto !== filterPresupuesto) return false;
                return true;
            }),
            filteredPresupuestos: presupuestoGrupos.filter(g => {
                if (filterPresupuesto && g.id !== filterPresupuesto) return false;
                if (!filterPresupuesto && filterYear) {
                    const match = g.descripcion.match(/\b(20\d{2})\b/);
                    if (match && match[1] !== filterYear) return false;
                }
                return true;
            })
        };
    }, [cursos, presupuestoGrupos, filterMonth, filterYear, filterPresupuesto]);

    // ---- Budget data ----
    const pctGastado = stats.totalPresupuesto > 0 ? Math.round((stats.totalGastado / stats.totalPresupuesto) * 100) : 0;
    const presupuestoDisponible = stats.totalPresupuesto - stats.totalGastado;

    const deptBudgets = useMemo(() => {
        const map: Record<number, { id: number; nombre: string; area_id: number; inicial: number; gastado: number }> = {};

        filteredPresupuestos.forEach(g => {
            (g.presupuestos || []).forEach(p => {
                if (!p.departamento) return;
                const dId = p.departamento.id;
                const aId = p.departamento.area?.id || 0;
                if (filterArea && aId !== filterArea) return;
                if (filterDept && dId !== filterDept) return;
                if (!map[dId]) map[dId] = { id: dId, nombre: p.departamento.nombre, area_id: aId, inicial: 0, gastado: 0 };
                map[dId].inicial += Number(p.inicial || 0);
            });
        });

        filteredCursos.forEach(c => {
            (c.cdcs || []).forEach(cdc => {
                const montoCdc = Number((cdc as any).pivot?.monto || 0);
                if (montoCdc <= 0 || !cdc.departamento) return;
                const dId = cdc.departamento.id;
                const aId = cdc.departamento.area?.id || 0;
                if (filterArea && aId !== filterArea) return;
                if (filterDept && dId !== filterDept) return;
                if (!map[dId]) map[dId] = { id: dId, nombre: cdc.departamento.nombre, area_id: aId, inicial: 0, gastado: 0 };
                map[dId].gastado += montoCdc;
            });
        });

        return Object.values(map).sort((a, b) => b.gastado - a.gastado);
    }, [filteredPresupuestos, filteredCursos, filterArea, filterDept]);

    const totalAccumulatedGastado = deptBudgets.reduce((sum, d) => sum + d.gastado, 0);
    const maxBudget = deptBudgets.length > 0 ? Math.max(...deptBudgets.map(d => Math.max(d.inicial, d.gastado))) : 1;

    // ---- Monthly Breakdown Matrix ----
    const monthlyMatrix = useMemo(() => {
        const map: Record<number, { id: number, nombre: string, total: number, months: Record<string, number> }> = {};

        filteredCursos.forEach(c => {
            const mes = c.mes_pago || 'Enero';
            const courseTotalCost = Number(c.costo || 0);
            if (courseTotalCost > 0 && c.cdcs && c.cdcs.length > 0) {
                c.cdcs.forEach(cdc => {
                    const montoCdc = Number((cdc as any).pivot?.monto || 0);
                    if (montoCdc > 0 && cdc.departamento) {
                        const dId = cdc.departamento.id;
                        const aId = cdc.departamento.area?.id;
                        if (filterArea && aId !== filterArea) return;
                        if (filterDept && dId !== filterDept) return;
                        if (!map[dId]) {
                            map[dId] = { id: dId, nombre: cdc.departamento.nombre, total: 0, months: {} };
                            MONTHS.forEach(m => map[dId].months[m.value] = 0);
                        }
                        map[dId].months[mes] += montoCdc;
                        map[dId].total += montoCdc;
                    }
                });
            }
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [filteredCursos, filterArea, filterDept]);

    // ---- DRILL-DOWN ----
    const isDrilldownActive = filterDept !== null;
    const selectedDeptName = departamentos.find(d => d.id === filterDept)?.nombre || '';

    const drillMonthlyChart = useMemo(() => {
        if (!isDrilldownActive || monthlyMatrix.length === 0) return [];
        return MONTHS.map(m => ({
            mes: m.label,
            valor: monthlyMatrix[0]?.months[m.value] || 0
        })).filter(m => m.valor > 0);
    }, [isDrilldownActive, monthlyMatrix]);

    const maxDrillVal = drillMonthlyChart.length > 0 ? Math.max(...drillMonthlyChart.map(m => m.valor)) : 1;

    const drillHabilidades = useMemo(() => {
        if (!isDrilldownActive) return [];
        const map: Record<string, Record<number, number>> = {};
        MONTHS.forEach(m => map[m.value] = {});

        filteredCursos.forEach(c => {
            const mes = c.mes_pago || 'Enero';
            const habId = (c as any).id_habilidad;
            if (!habId) return;
            if (drillCategoria && (c as any).id_categoria !== drillCategoria) return;
            if (drillCurso && c.id !== drillCurso) return;

            let targetMonto = 0;
            if (c.cdcs) {
                const matchingCdc = c.cdcs.find(cdc => cdc.id_departamento === filterDept);
                if (matchingCdc) targetMonto = Number((matchingCdc as any).pivot?.monto || 0);
            }
            if (targetMonto > 0) {
                if (!map[mes][habId]) map[mes][habId] = 0;
                map[mes][habId] += targetMonto;
            }
        });

        return MONTHS.map(m => {
            const row: any = { mes: m.label, total: 0 };
            habilidades.forEach(h => {
                const val = map[m.value][h.id] || 0;
                row[`h_${h.id}`] = val;
                row.total += val;
            });
            return row;
        }).filter(r => r.total > 0);
    }, [isDrilldownActive, filteredCursos, filterDept, habilidades, drillCategoria, drillCurso]);

    const drillHabilidadesTotales = useMemo(() => {
        const t: any = { mes: 'Acumulados', total: 0 };
        habilidades.forEach(h => t[`h_${h.id}`] = 0);
        drillHabilidades.forEach(r => {
            habilidades.forEach(h => t[`h_${h.id}`] += r[`h_${h.id}`]);
            t.total += r.total;
        });
        return t;
    }, [drillHabilidades, habilidades]);

    const drillUsers = useMemo(() => {
        if (!isDrilldownActive) return [];
        const map: Record<number, { user: any, horasTotales: number, horasPorHabilidad: number }> = {};

        filteredCursos.forEach(c => {
            if (drillCategoria && (c as any).id_categoria !== drillCategoria) return;
            if (drillCurso && c.id !== drillCurso) return;
            const horas = Number(c.cant_horas || 0);

            (c.users || []).forEach(u => {
                if (u.id_departamento !== filterDept) return;
                if (!map[u.id]) map[u.id] = { user: u, horasTotales: 0, horasPorHabilidad: 0 };
                map[u.id].horasTotales += horas;
                map[u.id].horasPorHabilidad += horas;
            });
        });

        return Object.values(map).sort((a, b) => a.user.name.localeCompare(b.user.name));
    }, [isDrilldownActive, filteredCursos, filterDept, drillCategoria, drillCurso]);

    const totalDrillHours = drillUsers.reduce((sum, u) => sum + u.horasTotales, 0);

    // ---- USER CONSUMPTION ANALYSIS ----
    const selectedUser = allUsers.find(u => u.id === filterUser);
    const userAnalysis = useMemo(() => {
        if (!filterUser) return null;
        const user = allUsers.find(u => u.id === filterUser);
        if (!user) return null;

        const userDeptId = user.id_departamento;
        const byDept: Record<number, { id: number; nombre: string; isOwn: boolean; monto: number; horas: number; cursos: number }> = {};
        let totalMonto = 0;
        let totalHoras = 0;
        let ownMonto = 0;
        let ownHoras = 0;
        let otherMonto = 0;
        let otherHoras = 0;
        let totalCursos = 0;

        filteredCursos.forEach(c => {
            // Check if this user is enrolled in this course
            const enrolled = (c.users || []).some(u => u.id === filterUser);
            if (!enrolled) return;

            totalCursos++;
            const horas = Number(c.cant_horas || 0);

            // Look at which departments paid for this course via CDCs
            (c.cdcs || []).forEach(cdc => {
                const montoCdc = Number((cdc as any).pivot?.monto || 0);
                if (montoCdc <= 0 || !cdc.departamento) return;

                const dId = cdc.departamento.id;
                const isOwn = dId === userDeptId;

                if (!byDept[dId]) {
                    byDept[dId] = {
                        id: dId,
                        nombre: cdc.departamento.nombre,
                        isOwn,
                        monto: 0,
                        horas: 0,
                        cursos: 0,
                    };
                }
                byDept[dId].monto += montoCdc;
                byDept[dId].horas += horas;
                byDept[dId].cursos++;
                totalMonto += montoCdc;
                totalHoras += horas;

                if (isOwn) {
                    ownMonto += montoCdc;
                    ownHoras += horas;
                } else {
                    otherMonto += montoCdc;
                    otherHoras += horas;
                }
            });
        });

        return {
            userName: user.name,
            userDept: user.deptNombre,
            userDeptId,
            departments: Object.values(byDept).sort((a, b) => b.monto - a.monto),
            totalMonto,
            totalHoras,
            ownMonto,
            ownHoras,
            otherMonto,
            otherHoras,
            totalCursos,
        };
    }, [filterUser, filteredCursos, allUsers]);

    // ---- KPI stat cards config (reference style) ----
    const statCards = [
        {
            label: 'Total Cursos',
            value: stats.totalCursos.toLocaleString(),
            icon: BookOpen,
            gradient: 'from-blue-600 to-indigo-600',
            subtitle: `Distribución en ${deptBudgets.length} departamentos`,
        },
        {
            label: 'Inscriptos',
            value: stats.totalInscritos.toLocaleString(),
            icon: Users,
            gradient: 'from-emerald-600 to-teal-500',
            subtitle: `${users} colaboradores en sistema`,
        },
        {
            label: 'Inversión Total',
            value: `$${stats.totalCosto.toLocaleString()}`,
            icon: DollarSign,
            gradient: 'from-red-600 to-rose-500',
            subtitle: `$${(stats.totalInscritos > 0 ? Math.round(stats.totalCosto / stats.totalInscritos) : 0).toLocaleString()} promedio/persona`,
        },
        {
            label: 'Presupuesto Disponible',
            value: `$${presupuestoDisponible.toLocaleString()}`,
            icon: TrendingUp,
            gradient: pctGastado > 80 ? 'from-red-600 to-orange-500' : 'from-amber-500 to-yellow-400',
            subtitle: `${pctGastado}% utilizado del total`,
        },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Métricas', href: '/admin/metrics' }]}>
            <Head title="Métricas de Capacitación" />

            <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Métricas de Capacitación</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Dashboard analítico · Vista general de inversión y alcance</p>
                    </div>
                    <button
                        onClick={() => router.visit('/admin/courses')}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 font-bold uppercase transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Volver a Cursos
                    </button>
                </div>

                {/* KPI Cards (Reference Gradient Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, i) => (
                        <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg">
                            <div className={`bg-gradient-to-br ${card.gradient} p-5 text-white`}>
                                <div className="flex items-center justify-between mb-3">
                                    <card.icon className="w-6 h-6 opacity-80" />
                                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-black leading-none mb-1">{card.value}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{card.label}</div>
                                <div className="text-[9px] opacity-60 mt-1 font-bold">{card.subtitle}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Global Budget Usage Bar */}
                <Card className="border-none shadow-md rounded-2xl" bodyStyle={{ padding: '20px 24px' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Presupuesto General</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-black text-slate-700">
                                ${stats.totalGastado.toLocaleString()} <span className="text-slate-400 font-normal">de</span> ${stats.totalPresupuesto.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <Progress
                        percent={pctGastado}
                        strokeColor={pctGastado > 80 ? '#ef4444' : pctGastado > 50 ? '#f59e0b' : '#10b981'}
                        trailColor="#f1f5f9"
                        strokeWidth={14}
                        className="[&_.ant-progress-text]:font-black [&_.ant-progress-text]:text-sm"
                        format={pct => `${pct}%`}
                    />
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <div className="text-[9px] font-black uppercase text-slate-400">Asignado</div>
                            <div className="text-sm font-black text-slate-700">${stats.totalPresupuesto.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-black uppercase text-slate-400">Gastado</div>
                            <div className="text-sm font-black text-red-600">${stats.totalGastado.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-black uppercase text-slate-400">Disponible</div>
                            <div className="text-sm font-black text-emerald-600">${presupuestoDisponible.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>

                {/* FILTROS GLOBALES */}
                <Card className="border-none shadow-md rounded-2xl" bodyStyle={{ padding: '20px 24px' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Filtros de Análisis</span>
                        </div>
                        {(filterPresupuesto || filterArea || filterDept || filterMonth || filterYear || filterUser) && (
                            <button
                                onClick={() => { setFilterPresupuesto(null); setFilterArea(null); setFilterDept(null); setFilterMonth(null); setFilterYear(null); setFilterUser(null); }}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider"
                            >
                                <X className="w-3 h-3" />
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Presupuesto</label>
                            <Select
                                showSearch allowClear placeholder="Todos"
                                className="w-56 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterPresupuesto}
                                onChange={v => { setFilterPresupuesto(v); setFilterYear(null); }}
                                options={presupuestoGrupos.map(g => ({ value: g.id, label: g.descripcion }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Área</label>
                            <Select
                                showSearch allowClear placeholder="Toda la compañía"
                                className="w-48 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterArea}
                                onChange={v => { setFilterArea(v); setFilterDept(null); }}
                                options={areas.map(a => ({ value: a.id, label: a.nombre }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Departamento</label>
                            <Select
                                showSearch allowClear placeholder="Todos"
                                className="w-56 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterDept}
                                onChange={v => setFilterDept(v)}
                                options={filteredDepts.map(d => ({ value: d.id, label: d.nombre }))}
                                disabled={!filterArea && departamentos.length > 50}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mes</label>
                            <Select
                                allowClear placeholder="Todos"
                                className="w-36 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterMonth}
                                onChange={v => setFilterMonth(v)}
                                options={MONTHS}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Año</label>
                            <Select
                                allowClear placeholder="Todos"
                                className="w-28 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterYear}
                                onChange={v => setFilterYear(v)}
                                options={years.map(y => ({ value: y, label: y }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><UserSearch className="w-3 h-3" /> Colaborador</label>
                            <Select
                                showSearch allowClear placeholder="Buscar colaborador"
                                className="w-64 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterUser}
                                onChange={v => setFilterUser(v)}
                                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                options={allUsers.map(u => ({ value: u.id, label: `${u.name} — ${u.deptNombre}` }))}
                            />
                        </div>
                    </div>
                </Card>

                {/* USER CONSUMPTION ANALYSIS VIEW */}
                {filterUser && userAnalysis && (
                    <Card className="border-none shadow-md rounded-2xl" bodyStyle={{ padding: '0' }}>
                        {/* User Header */}
                        <div className="relative overflow-hidden rounded-t-2xl">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 flex items-center gap-2">
                                        <UserSearch className="w-3.5 h-3.5" /> Análisis de Consumo Individual
                                    </div>
                                    <div className="text-2xl font-black">{userAnalysis.userName}</div>
                                    <div className="text-xs opacity-80 font-bold mt-1">Departamento: {userAnalysis.userDept} · {userAnalysis.totalCursos} cursos</div>
                                </div>
                                <button onClick={() => setFilterUser(null)} className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                                    <X className="w-4 h-4" /> Cerrar
                                </button>
                            </div>
                        </div>

                        {/* KPI Summary Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b border-slate-100">
                            <div className="p-5 text-center border-r border-slate-100">
                                <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Gasto Propio Depto</div>
                                <div className="text-xl font-black text-emerald-600">${userAnalysis.ownMonto.toLocaleString()}</div>
                            </div>
                            <div className="p-5 text-center border-r border-slate-100">
                                <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Gasto Otros Deptos</div>
                                <div className="text-xl font-black text-orange-600">${userAnalysis.otherMonto.toLocaleString()}</div>
                            </div>
                            <div className="p-5 text-center border-r border-slate-100">
                                <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Horas Depto Propio</div>
                                <div className="text-xl font-black text-blue-600">{userAnalysis.ownHoras}h</div>
                            </div>
                            <div className="p-5 text-center">
                                <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Horas Otros Deptos</div>
                                <div className="text-xl font-black text-violet-600">{userAnalysis.otherHoras}h</div>
                            </div>
                        </div>

                        {/* Cost + Hours Comparison Bars */}
                        <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Distribución de Gasto</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${userAnalysis.totalMonto > 0 ? (userAnalysis.ownMonto / userAnalysis.totalMonto) * 100 : 0}%` }} />
                                        <div className="h-full bg-orange-400 transition-all" style={{ width: `${userAnalysis.totalMonto > 0 ? (userAnalysis.otherMonto / userAnalysis.totalMonto) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-xs font-black text-slate-700">${userAnalysis.totalMonto.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-4 mt-2">
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /><span className="text-[9px] font-bold text-slate-500">Propio ({userAnalysis.totalMonto > 0 ? Math.round((userAnalysis.ownMonto / userAnalysis.totalMonto) * 100) : 0}%)</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-orange-400 rounded-sm" /><span className="text-[9px] font-bold text-slate-500">Otros ({userAnalysis.totalMonto > 0 ? Math.round((userAnalysis.otherMonto / userAnalysis.totalMonto) * 100) : 0}%)</span></div>
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Distribución de Horas</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${userAnalysis.totalHoras > 0 ? (userAnalysis.ownHoras / userAnalysis.totalHoras) * 100 : 0}%` }} />
                                        <div className="h-full bg-violet-400 transition-all" style={{ width: `${userAnalysis.totalHoras > 0 ? (userAnalysis.otherHoras / userAnalysis.totalHoras) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-xs font-black text-slate-700">{userAnalysis.totalHoras}h</span>
                                </div>
                                <div className="flex gap-4 mt-2">
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /><span className="text-[9px] font-bold text-slate-500">Propio ({userAnalysis.totalHoras > 0 ? Math.round((userAnalysis.ownHoras / userAnalysis.totalHoras) * 100) : 0}%)</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-violet-400 rounded-sm" /><span className="text-[9px] font-bold text-slate-500">Otros ({userAnalysis.totalHoras > 0 ? Math.round((userAnalysis.otherHoras / userAnalysis.totalHoras) * 100) : 0}%)</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Departments Breakdown Table */}
                        <div className="divide-y divide-slate-100">
                            <div className="px-6 py-3 bg-slate-50 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Desglose por Departamento Pagador</span>
                            </div>
                            {userAnalysis.departments.map((dept, i) => {
                                const pct = userAnalysis.totalMonto > 0 ? Math.round((dept.monto / userAnalysis.totalMonto) * 100) : 0;
                                return (
                                    <div key={i} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                            dept.isOwn ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {dept.isOwn ? '✓' : i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-700 truncate">{dept.nombre}</span>
                                                {dept.isOwn && <Tag color="green" className="font-bold text-[8px] m-0 uppercase">Propio</Tag>}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <Progress
                                                    percent={pct}
                                                    size="small"
                                                    showInfo={false}
                                                    strokeColor={dept.isOwn ? '#10b981' : '#f97316'}
                                                    strokeWidth={5}
                                                    className="flex-1 m-0"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xs font-black text-slate-700">${dept.monto.toLocaleString()}</div>
                                            <div className="text-[9px] text-slate-400 font-bold">{dept.horas}h · {dept.cursos} cursos</div>
                                        </div>
                                    </div>
                                );
                            })}
                            {userAnalysis.departments.length === 0 && (
                                <div className="p-6 text-center text-slate-400 text-sm italic">Este colaborador no tiene consumos registrados con los filtros actuales</div>
                            )}
                        </div>
                    </Card>
                )}

                {!isDrilldownActive ? (
                    <div className="space-y-5">
                        {/* Two-Column: CDC Ranking (list style) + Bar Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* CDC Consumption Ranking (divide list style from reference) */}
                            <Card
                                title={
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                            <BarChart3 className="w-4 h-4 text-red-500" />
                                            Consumo de CDCs por Departamento
                                        </div>
                                        <Tag color="red" className="font-black text-xs m-0">${totalAccumulatedGastado.toLocaleString()}</Tag>
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl"
                                bodyStyle={{ padding: '0' }}
                            >
                                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                    {deptBudgets.map((dept, i) => {
                                        const pct = dept.inicial > 0 ? Math.round((dept.gastado / dept.inicial) * 100) : 0;
                                        return (
                                            <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setFilterDept(dept.id)}>
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-700 truncate">{dept.nombre}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Progress
                                                            percent={pct}
                                                            size="small"
                                                            showInfo={false}
                                                            strokeColor={pct > 80 ? '#ef4444' : pct > 50 ? '#3b82f6' : '#10b981'}
                                                            strokeWidth={5}
                                                            className="flex-1 m-0"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-xs font-black text-slate-700">${dept.gastado.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold">de ${dept.inicial.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {deptBudgets.length === 0 && (
                                        <div className="p-6 text-center text-slate-400 text-sm italic">Sin datos de presupuesto para los filtros seleccionados</div>
                                    )}
                                </div>
                            </Card>

                            {/* Bar Chart – Distribución de Consumo x Depto */}
                            <Card
                                title={
                                    <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                        <BarChart3 className="w-4 h-4 text-blue-500" />
                                        Distribución Visual de Consumo
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl"
                                bodyStyle={{ padding: '0' }}
                            >
                                <div className="px-4 pt-3 pb-0 flex justify-end gap-4">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Asignado</span></div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gradient-to-t from-red-600 to-red-400 rounded-sm"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Gasto CDC</span></div>
                                </div>
                                <div className="p-6 overflow-x-auto pt-2">
                                    <div className="flex flex-col h-[340px] min-w-[400px]">
                                        <div className="flex-1 flex items-end justify-start gap-[3px] border-b-2 border-slate-800 pb-1">
                                            {deptBudgets.slice(0, 15).map((dept, i) => {
                                                const hPctGastado = maxBudget > 0 ? Math.max((dept.gastado / maxBudget) * 100, 1) : 1;
                                                const hPctInicial = maxBudget > 0 ? Math.max((dept.inicial / maxBudget) * 100, 1) : 1;
                                                const highestPct = Math.max(hPctGastado, hPctInicial);
                                                const formatNum = (num: number) => {
                                                    if (num === 0) return '0';
                                                    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                                                    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
                                                    return num.toString();
                                                };
                                                return (
                                                    <div key={i} className="flex-1 max-w-[50px] h-full flex flex-col items-center justify-end relative group cursor-pointer" onClick={() => setFilterDept(dept.id)}>
                                                        <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 flex flex-col items-center gap-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none shadow-xl border border-slate-600">
                                                            <span className="text-slate-300">Asignado: ${dept.inicial.toLocaleString()}</span>
                                                            <span className="text-red-400">Consumido: ${dept.gastado.toLocaleString()}</span>
                                                        </div>
                                                        <div className="absolute bottom-0 w-full flex justify-center mb-1 z-20 pointer-events-none" style={{ bottom: `${highestPct}%`, paddingBottom: '4px' }}>
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[9px] font-black text-slate-400 leading-[10px]">${formatNum(dept.inicial)}</span>
                                                                <span className="text-[10px] font-black text-red-600 leading-[10px]">${formatNum(dept.gastado)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full max-w-[40px] bg-slate-200 absolute bottom-0 z-0 rounded-t-sm" style={{ height: `${hPctInicial}%` }} />
                                                        <div className="w-full max-w-[40px] bg-gradient-to-t from-red-600 to-red-400 absolute bottom-0 z-10 transition-all duration-500 hover:brightness-110 shadow-[0_-2px_5px_rgba(220,38,38,0.25)] rounded-t-sm" style={{ height: `${hPctGastado}%` }} />
                                                    </div>
                                                );
                                            })}
                                            {deptBudgets.length === 0 && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Empty description={<span className="font-bold text-slate-400">Sin presupuestos</span>} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start justify-start gap-[3px] mt-2">
                                            {deptBudgets.slice(0, 15).map((dept, i) => (
                                                <div key={i} className="flex-1 max-w-[50px] flex justify-center">
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase text-center leading-tight line-clamp-3 block w-full px-0.5" title={dept.nombre}>
                                                        {dept.nombre}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Monthly Breakdown Matrix Table */}
                        <Card
                            title={
                                <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                    Gasto Aperturado por Mes
                                </div>
                            }
                            className="border-none shadow-md rounded-2xl"
                            bodyStyle={{ padding: 0 }}
                        >
                            <Table
                                size="small"
                                scroll={{ x: 'max-content' }}
                                pagination={false}
                                dataSource={monthlyMatrix}
                                rowKey="id"
                                className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[9px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-cell]:p-2.5"
                                columns={[
                                    {
                                        title: 'Departamento', dataIndex: 'nombre', key: 'nombre', fixed: 'left', width: 250,
                                        render: (txt) => <span className="text-[10px] font-bold text-slate-700 uppercase">{txt}</span>
                                    },
                                    ...MONTHS.map(m => ({
                                        title: m.label,
                                        key: m.value,
                                        align: 'right' as const,
                                        render: (_: any, r: any) => {
                                            const val = r.months[m.value];
                                            return <span className={`text-[10px] font-bold ${val > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{val > 0 ? val.toLocaleString() : '—'}</span>;
                                        }
                                    }))
                                ]}
                            />
                        </Card>
                    </div>
                ) : (
                    /* VIEW 2: DRILL-DOWN (Specific Department Selected) */
                    <div className="space-y-5">
                        {/* Drill-Down Header */}
                        <div className="relative overflow-hidden rounded-2xl shadow-lg">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-2">
                                        <ChevronLeft className="w-3 h-3" /> Análisis Detallado
                                    </div>
                                    <h2 className="text-3xl font-black">{selectedDeptName}</h2>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1">Desglose de inversión, participantes y cronograma del departamento</p>
                                </div>
                                <button onClick={() => setFilterDept(null)} className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                                    <X className="w-4 h-4" /> Quitar Filtro
                                </button>
                            </div>
                        </div>

                        {/* Drill Sub-Filters */}
                        <Card className="border-none shadow-md rounded-2xl" bodyStyle={{ padding: '12px 20px' }}>
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sub-Filtros</span>
                                </div>
                                <Select
                                    allowClear placeholder="Todas las categorías"
                                    className="w-56 [&_.ant-select-selector]:rounded-md [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                    value={drillCategoria}
                                    onChange={v => setDrillCategoria(v)}
                                    options={categorias.map(c => ({ value: c.id, label: c.categoria }))}
                                />
                                <Select
                                    showSearch allowClear placeholder="Todos los cursos"
                                    className="w-72 [&_.ant-select-selector]:rounded-md [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                    value={drillCurso}
                                    onChange={v => setDrillCurso(v)}
                                    options={cursos.map(c => ({ value: c.id, label: `${c.nombre} (${c.anio_formacion})` }))}
                                />
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Monthly Bar Chart */}
                            <Card
                                title={
                                    <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                        <BarChart3 className="w-4 h-4 text-red-500" />
                                        Métrica Mensual del Departamento
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl h-full"
                                bodyStyle={{ padding: '0', flex: 1 }}
                            >
                                <div className="flex items-end justify-center gap-[4px] h-64 mt-4 px-4 pb-6">
                                    {drillMonthlyChart.map((item, i) => {
                                        const hPct = Math.max((item.valor / maxDrillVal) * 100, 2);
                                        return (
                                            <div key={i} className="flex-1 max-w-[80px] h-full flex flex-col items-center justify-end gap-2 group relative">
                                                <div className="text-[10px] font-bold text-slate-600 tracking-tight leading-none">${item.valor.toLocaleString()}</div>
                                                <div
                                                    className="w-full max-w-[50px] bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm shadow-[0_-2px_4px_rgba(220,38,38,0.2)] transition-all duration-500 group-hover:brightness-110"
                                                    style={{ height: `${hPct}%` }}
                                                />
                                                <div className="w-full text-center text-[10px] font-bold text-slate-500 truncate">{item.mes}</div>
                                            </div>
                                        );
                                    })}
                                    {drillMonthlyChart.length === 0 && <Empty description="Sin gastos registrados" />}
                                </div>
                            </Card>

                            {/* Skills x Month Table */}
                            <Card
                                title={
                                    <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                        <PieChart className="w-4 h-4 text-violet-500" />
                                        Desglose por Habilidad — {filterYear || 'Todos'}
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl"
                                bodyStyle={{ padding: 0 }}
                            >
                                <Table
                                    size="small"
                                    pagination={false}
                                    dataSource={drillHabilidades}
                                    rowKey="mes"
                                    className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[9px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-cell]:p-2.5"
                                    columns={[
                                        { title: 'Período', dataIndex: 'mes', key: 'mes', render: t => <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-slate-800 px-2 py-0.5 rounded shadow-sm">{t}</span>, width: 100 },
                                        ...habilidades.map(h => ({
                                            title: h.habilidad,
                                            dataIndex: `h_${h.id}`,
                                            key: `h_${h.id}`,
                                            align: 'right' as const,
                                            render: (v: number) => <span className={`text-[10px] font-bold ${v > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{v > 0 ? v.toLocaleString() : '0,00'}</span>
                                        }))
                                    ]}
                                    summary={() => (
                                        <Table.Summary.Row className="bg-slate-800 text-white">
                                            <Table.Summary.Cell index={0}><span className="text-[10px] font-bold uppercase tracking-widest text-white pl-2">Acumulados</span></Table.Summary.Cell>
                                            {habilidades.map((h, i) => (
                                                <Table.Summary.Cell key={i} index={i+1} align="right">
                                                    <span className="text-[11px] font-black text-white px-2">{drillHabilidadesTotales[`h_${h.id}`].toLocaleString()}</span>
                                                </Table.Summary.Cell>
                                            ))}
                                        </Table.Summary.Row>
                                    )}
                                />
                            </Card>
                        </div>

                        {/* Users Table + KPIs */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                            <Card
                                title={
                                    <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                        <Users className="w-4 h-4 text-emerald-500" />
                                        Participantes del Departamento
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl lg:col-span-3"
                                bodyStyle={{ padding: 0 }}
                            >
                                <Table
                                    size="small"
                                    pagination={{ pageSize: 20 }}
                                    dataSource={drillUsers}
                                    rowKey={(r) => r.user.id}
                                    className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[9px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-cell]:p-3"
                                    columns={[
                                        { title: 'Nombre y Apellido', dataIndex: ['user', 'name'], key: 'name', render: t => <span className="text-xs font-bold text-slate-800 uppercase block">{t}</span> },
                                        { title: 'Horas totales', dataIndex: 'horasTotales', key: 'ht', align: 'center', render: v => <span className="text-xs font-bold text-slate-600">{v}</span> },
                                        { title: 'Horas según habilidad', dataIndex: 'horasPorHabilidad', key: 'hh', align: 'center', render: v => <span className="text-xs font-bold text-red-600">{v}</span> }
                                    ]}
                                />
                            </Card>

                            {/* Lateral KPIs */}
                            <div className="space-y-4">
                                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white text-center">
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Total Horas</div>
                                        <div className="text-5xl font-black">{totalDrillHours}</div>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                    <div className="bg-gradient-to-br from-red-600 to-rose-500 p-8 text-white text-center">
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-2">% Participación Depto</div>
                                        <div className="text-4xl font-black">
                                            {users > 0 ? Math.round((drillUsers.length / users) * 100) : 0}%
                                        </div>
                                        <div className="text-[10px] text-white/70 font-bold mt-2 uppercase">{drillUsers.length} inscriptos globales del área</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
