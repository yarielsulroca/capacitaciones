import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, Table, Tag, Progress } from 'antd';
import {
    BarChart3, TrendingUp, DollarSign, Users, BookOpen,
    ArrowUpRight, ArrowDownRight, PieChart, ChevronLeft
} from 'lucide-react';
import { useMemo } from 'react';

interface Props {
    cursos: any[];
    presupuestoGrupos: any[];
    areas: any[];
    departamentos: any[];
    users: number;
    stats: {
        totalCursos: number;
        totalInscritos: number;
        totalCosto: number;
        totalPresupuesto: number;
        totalGastado: number;
    };
}

export default function Metrics({ cursos, presupuestoGrupos, areas, departamentos, users, stats }: Props) {
    const pctGastado = stats.totalPresupuesto > 0
        ? Math.round((stats.totalGastado / stats.totalPresupuesto) * 100)
        : 0;

    const presupuestoDisponible = stats.totalPresupuesto - stats.totalGastado;

    // Courses by type
    const cursosByTipo = useMemo(() => {
        const map: Record<string, number> = {};
        cursos.forEach(c => {
            const tipo = c.tipo?.tipo || 'Sin tipo';
            map[tipo] = (map[tipo] || 0) + 1;
        });
        return Object.entries(map).map(([tipo, count]) => ({ tipo, count }));
    }, [cursos]);

    // Courses by modality
    const cursosByModalidad = useMemo(() => {
        const map: Record<string, number> = {};
        cursos.forEach(c => {
            const mod = c.modalidad?.modalidad || 'Sin modalidad';
            map[mod] = (map[mod] || 0) + 1;
        });
        return Object.entries(map).map(([modalidad, count]) => ({ modalidad, count }));
    }, [cursos]);

    // Top departments by enrollment
    const topDeptEnrollment = useMemo(() => {
        const map: Record<string, { nombre: string; area: string; count: number }> = {};
        cursos.forEach(c => {
            (c.users || []).forEach((u: any) => {
                const deptName = u.departamento?.nombre || 'Sin depto';
                const areaName = u.departamento?.area?.nombre || '';
                const key = deptName;
                if (!map[key]) map[key] = { nombre: deptName, area: areaName, count: 0 };
                map[key].count++;
            });
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [cursos]);

    // Budget usage by area
    const budgetByArea = useMemo(() => {
        const map: Record<string, { nombre: string; inicial: number; actual: number }> = {};
        presupuestoGrupos.forEach(g => {
            (g.presupuestos || []).forEach((p: any) => {
                const areaName = p.departamento?.area?.nombre || 'Sin área';
                if (!map[areaName]) map[areaName] = { nombre: areaName, inicial: 0, actual: 0 };
                map[areaName].inicial += Number(p.inicial || 0);
                map[areaName].actual += Number(p.actual || 0);
            });
        });
        return Object.values(map)
            .map(a => ({ ...a, gastado: a.inicial - a.actual, pct: a.inicial > 0 ? Math.round(((a.inicial - a.actual) / a.inicial) * 100) : 0 }))
            .sort((a, b) => b.gastado - a.gastado);
    }, [presupuestoGrupos]);

    // Recent courses
    const recentCursos = useMemo(() => {
        return [...cursos].slice(0, 5);
    }, [cursos]);

    const statCards = [
        {
            label: 'Total Cursos',
            value: stats.totalCursos,
            icon: BookOpen,
            gradient: 'from-blue-600 to-indigo-600',
            subtitle: `${cursosByTipo.length} tipos distintos`,
        },
        {
            label: 'Inscriptos',
            value: stats.totalInscritos,
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
            subtitle: `${pctGastado}% utilizado`,
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

                {/* KPI Cards */}
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

                {/* Budget Usage Bar */}
                <Card className="border-none shadow-md" bodyStyle={{ padding: '20px 24px' }}>
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

                {/* Two-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Budget by Area */}
                    <Card
                        title={
                            <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                <BarChart3 className="w-4 h-4 text-blue-500" />
                                Presupuesto por Área
                            </div>
                        }
                        className="border-none shadow-md"
                        bodyStyle={{ padding: '0' }}
                    >
                        <div className="divide-y divide-slate-100">
                            {budgetByArea.map((area, i) => (
                                <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-slate-700 truncate">{area.nombre}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <Progress
                                                percent={area.pct}
                                                size="small"
                                                showInfo={false}
                                                strokeColor={area.pct > 80 ? '#ef4444' : area.pct > 50 ? '#3b82f6' : '#10b981'}
                                                strokeWidth={5}
                                                className="flex-1 m-0"
                                            />
                                            <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{area.pct}%</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-xs font-black text-slate-700">${area.gastado.toLocaleString()}</div>
                                        <div className="text-[9px] text-slate-400 font-bold">de ${area.inicial.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                            {budgetByArea.length === 0 && (
                                <div className="p-6 text-center text-slate-400 text-sm italic">Sin datos de presupuesto</div>
                            )}
                        </div>
                    </Card>

                    {/* Top Departments by Enrollment */}
                    <Card
                        title={
                            <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                <Users className="w-4 h-4 text-emerald-500" />
                                Top Departamentos por Inscripciones
                            </div>
                        }
                        className="border-none shadow-md"
                        bodyStyle={{ padding: '0' }}
                    >
                        <div className="divide-y divide-slate-100">
                            {topDeptEnrollment.map((dept, i) => {
                                const maxCount = topDeptEnrollment[0]?.count || 1;
                                const barWidth = Math.max((dept.count / maxCount) * 100, 8);
                                return (
                                    <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-slate-700 truncate">{dept.nombre}</div>
                                            <div className="text-[9px] text-slate-400 font-bold">{dept.area}</div>
                                            <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-lg font-black text-slate-700 flex-shrink-0">{dept.count}</div>
                                    </div>
                                );
                            })}
                            {topDeptEnrollment.length === 0 && (
                                <div className="p-6 text-center text-slate-400 text-sm italic">Sin inscripciones</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Bottom Row: Course Distribution & Recent Courses */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Course Type Distribution */}
                    <Card
                        title={
                            <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                <PieChart className="w-4 h-4 text-violet-500" />
                                Cursos por Tipo
                            </div>
                        }
                        className="border-none shadow-md"
                        bodyStyle={{ padding: '16px' }}
                    >
                        <div className="space-y-3">
                            {cursosByTipo.map((item, i) => {
                                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]} flex-shrink-0`} />
                                        <div className="flex-1 text-xs font-bold text-slate-700">{item.tipo}</div>
                                        <Tag className="font-black text-[10px] uppercase m-0">{item.count}</Tag>
                                    </div>
                                );
                            })}
                            {cursosByTipo.length === 0 && (
                                <div className="text-center text-slate-400 text-sm italic">Sin cursos</div>
                            )}
                        </div>
                    </Card>

                    {/* Recent Courses */}
                    <Card
                        className="border-none shadow-md lg:col-span-2"
                        title={
                            <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-500 tracking-wide">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                Últimos Cursos Creados
                            </div>
                        }
                        bodyStyle={{ padding: 0 }}
                    >
                        <Table
                            size="small"
                            pagination={false}
                            dataSource={recentCursos}
                            rowKey="id"
                            columns={[
                                {
                                    title: 'Curso',
                                    key: 'nombre',
                                    render: (_: any, r: any) => (
                                        <div>
                                            <div className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{r.nombre}</div>
                                            <div className="text-[9px] text-slate-400 font-bold">{r.tipo?.tipo || 'Sin tipo'}</div>
                                        </div>
                                    )
                                },
                                {
                                    title: 'Costo',
                                    key: 'costo',
                                    align: 'right' as const,
                                    render: (_: any, r: any) => (
                                        <span className="text-xs font-black text-red-600">${Number(r.costo || 0).toLocaleString()}</span>
                                    )
                                },
                                {
                                    title: 'Inscriptos',
                                    key: 'users',
                                    align: 'center' as const,
                                    render: (_: any, r: any) => (
                                        <Tag color="blue" className="font-bold text-[9px] m-0">{r.users_count || 0}</Tag>
                                    )
                                },
                                {
                                    title: 'Inicio',
                                    key: 'inicio',
                                    render: (_: any, r: any) => (
                                        <span className="text-[10px] text-slate-500 font-bold">
                                            {r.inicio ? new Date(r.inicio).toLocaleDateString('es-AR') : '—'}
                                        </span>
                                    )
                                },
                            ]}
                            className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[9px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400"
                        />
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
