import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Table, Tag, Select, Progress, Empty } from 'antd';
import {
    BarChart3, TrendingUp, DollarSign, Users, BookOpen,
    ArrowUpRight, PieChart, ChevronLeft, Filter, Calendar, Clock,
    Building2, Briefcase, GraduationCap, X, UserSearch, Crown, ChevronDown, ChevronRight, FileText
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Curso, User, PresupuestoGrupo, Area, Departamento, Habilidad, Categoria } from '@/types/capacitaciones';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface JefeOption { id: number; name: string; }
interface UserHierarchy { id: number; name: string; id_departamento?: number; id_area?: number; id_jefe?: number; deptNombre: string; }

interface Props {
    cursos: Curso[];
    presupuestoGrupos: PresupuestoGrupo[];
    areas: Area[];
    departamentos: Departamento[];
    habilidades: Habilidad[];
    categorias: Categoria[];
    users: number;
    allUsersData: UserHierarchy[];
    jefes: JefeOption[];
    stats: {
        totalCursos: number;
        totalInscritos: number;
        totalCosto: number;
        totalHoras: number;
        totalHorasColaboradores: number;
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

export default function Metrics({ cursos, presupuestoGrupos, areas, departamentos, habilidades, categorias, users, allUsersData, jefes, stats }: Props) {
    // ---- STATE: Filters ----
    const [filterArea, setFilterArea] = useState<number | null>(null);
    const [filterDept, setFilterDept] = useState<number | null>(null);
    const [filterMonth, setFilterMonth] = useState<string | null>(null);
    const [filterYear, setFilterYear] = useState<string | null>(null);
    const [filterPresupuesto, setFilterPresupuesto] = useState<number[]>([]);
    const [filterUser, setFilterUser] = useState<number | null>(null);
    const [filterJefe, setFilterJefe] = useState<number | null>(null);

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
                        id_departamento: u.departamento?.id ?? u.id_departamento,
                        deptNombre: u.departamento?.nombre || 'Sin depto',
                    });
                }
            });
        });
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [cursos]);

    // Derived standard dropdowns — exclude empty departments (0 users)
    const activeDepts = useMemo(() => {
        return departamentos.filter(d => {
            const count = (d as any).users_count;
            // If users_count is not provided, include all departments
            return count === undefined || count === null || count > 0;
        });
    }, [departamentos]);

    const activeAreas = useMemo(() => {
        return areas;
    }, [areas]);

    const filteredDepts = useMemo(() => {
        if (!filterArea) return activeDepts;
        return activeDepts.filter(d => d.id_area === filterArea);
    }, [filterArea, activeDepts]);

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
        const hasPFilter = filterPresupuesto.length > 0;
        return {
            filteredCursos: cursos.filter(c => {
                if (filterMonth && c.mes_pago !== filterMonth) return false;
                if (filterYear && c.anio_formacion?.toString() !== filterYear) return false;
                if (hasPFilter && !filterPresupuesto.includes(Number(c.id_presupuesto))) return false;
                return true;
            }),
            filteredPresupuestos: presupuestoGrupos.filter(g => {
                if (hasPFilter && !filterPresupuesto.includes(g.id)) return false;
                if (!hasPFilter && filterYear) {
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

    // ---- Hours by Department ----
    const deptHours = useMemo(() => {
        const map: Record<number, { id: number; nombre: string; horas: number; personaHoras: number; cursos: number; usuarios: number }> = {};

        filteredCursos.forEach(c => {
            const horas = Number(c.cant_horas || 0);
            // Filter out 'incompleto' (interrumpido) users — they don't count hours
            const enrolledUsers = (c.users || []).filter((u: any) => u.pivot?.curso_estado !== 6);

            enrolledUsers.forEach(u => {
                const dId = u.departamento?.id ?? u.id_departamento;
                if (!dId) return;
                if (filterArea && u.departamento?.area?.id !== filterArea) return;
                if (filterDept && dId !== filterDept) return;

                const dNombre = u.departamento?.nombre || 'Sin depto';
                if (!map[dId]) map[dId] = { id: dId, nombre: dNombre, horas: 0, personaHoras: 0, cursos: 0, usuarios: 0 };
                map[dId].personaHoras += horas;
            });

            // Count unique courses and unique users per department
            const deptCourseTracker = new Set<number>();
            enrolledUsers.forEach(u => {
                const dId = u.departamento?.id ?? u.id_departamento;
                if (!dId || !map[dId]) return;
                if (!deptCourseTracker.has(dId)) {
                    map[dId].cursos++;
                    map[dId].horas += horas;
                    deptCourseTracker.add(dId);
                }
                map[dId].usuarios++;
            });
        });

        // Deduplicate usuario count: personaHoras is already correct (sum of horas per enrollment)
        return Object.values(map).sort((a, b) => b.personaHoras - a.personaHoras);
    }, [filteredCursos, filterArea, filterDept]);

    const totalHorasPersona = deptHours.reduce((s, d) => s + d.personaHoras, 0);
    const maxDeptHoursVal = deptHours.length > 0 ? Math.max(...deptHours.map(d => d.personaHoras)) : 1;

    // ---- Habilidad (Skill) Breakdown ----
    const habilidadStats = useMemo(() => {
        const map: Record<string, { nombre: string; cursos: number; personaHoras: number; inscripciones: number }> = {};

        filteredCursos.forEach(c => {
            const hab = (c.habilidad as any)?.habilidad || 'Sin habilidad';
            const horas = Number(c.cant_horas || 0);
            // Filter out 'incompleto' (interrumpido) — hours don't count
            const enrolledCount = (c.users || []).filter((u: any) => u.pivot?.curso_estado !== 6).length;

            if (!map[hab]) map[hab] = { nombre: hab, cursos: 0, personaHoras: 0, inscripciones: 0 };
            map[hab].cursos++;
            map[hab].personaHoras += horas * enrolledCount;
            map[hab].inscripciones += enrolledCount;
        });

        return Object.values(map).sort((a, b) => b.cursos - a.cursos);
    }, [filteredCursos]);

    const totalHabCursos = habilidadStats.reduce((s, h) => s + h.cursos, 0);
    const maxHabCursos = habilidadStats.length > 0 ? Math.max(...habilidadStats.map(h => h.cursos)) : 1;
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
            const habId = (c as any).habilidad_id;
            if (!habId) return;
            if (drillCategoria && (c as any).categoria_id !== drillCategoria) return;
            if (drillCurso && c.id !== drillCurso) return;

            let targetMonto = 0;
            if (c.cdcs) {
                const matchingCdc = c.cdcs.find(cdc => cdc.departamento?.id === filterDept);
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
        const map: Record<number, { user: any, horasTotales: number, horasPorHabilidad: number, cursosCount: number }> = {};

        filteredCursos.forEach(c => {
            if (drillCategoria && (c as any).categoria_id !== drillCategoria) return;
            if (drillCurso && c.id !== drillCurso) return;
            const horas = Number(c.cant_horas || 0);

            (c.users || []).forEach(u => {
                if ((u as any).pivot?.curso_estado === 6) return; // Skip incompleto (interrumpido) — hours don't count
                if ((u.departamento?.id ?? u.id_departamento) !== filterDept) return;
                if (!map[u.id]) map[u.id] = { user: u, horasTotales: 0, horasPorHabilidad: 0, cursosCount: 0 };
                map[u.id].horasTotales += horas;
                map[u.id].horasPorHabilidad += horas;
                map[u.id].cursosCount++;
            });
        });

        return Object.values(map).sort((a, b) => a.user.name.localeCompare(b.user.name));
    }, [isDrilldownActive, filteredCursos, filterDept, drillCategoria, drillCurso]);

    const totalDrillHours = drillUsers.reduce((sum, u) => sum + u.horasTotales, 0);
    const deptTotalUsers = departamentos.find(d => d.id === filterDept)?.users_count ?? 0;

    // ---- DRILL-DOWN BUDGET KPIs ----
    const drillBudget = useMemo(() => {
        if (!isDrilldownActive) return { asignado: 0, utilizado: 0, disponible: 0, pctUtilizado: 0 };
        let asignado = 0;
        let utilizado = 0;

        // Budget assigned to this department from filtered presupuestos
        filteredPresupuestos.forEach(g => {
            (g.presupuestos || []).forEach(p => {
                if (p.departamento?.id === filterDept) {
                    asignado += Number(p.inicial || 0);
                    utilizado += Number(p.inicial || 0) - Number(p.actual || 0);
                }
            });
        });

        return {
            asignado,
            utilizado,
            disponible: asignado - utilizado,
            pctUtilizado: asignado > 0 ? Math.round((utilizado / asignado) * 100) : 0,
        };
    }, [isDrilldownActive, filterDept, filteredPresupuestos]);

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
            const numUsers = (c.users || []).length || 1;

            // Step 1: Group CDCs by department and sum their montos for this course
            const courseDeptMontos: Record<number, { id: number; nombre: string; isOwn: boolean; totalMonto: number }> = {};

            (c.cdcs || []).forEach(cdc => {
                const montoCdc = Number((cdc as any).pivot?.monto || 0);
                if (montoCdc <= 0 || !cdc.departamento) return;

                const dId = cdc.departamento.id;
                const isOwn = dId === userDeptId;

                if (!courseDeptMontos[dId]) {
                    courseDeptMontos[dId] = { id: dId, nombre: cdc.departamento.nombre, isOwn, totalMonto: 0 };
                }
                courseDeptMontos[dId].totalMonto += montoCdc;
            });

            // Step 2: Divide by number of users to get per-user share, accumulate
            let courseHasOwnDept = false;

            Object.values(courseDeptMontos).forEach(d => {
                const perUserMonto = d.totalMonto / numUsers;

                if (!byDept[d.id]) {
                    byDept[d.id] = { id: d.id, nombre: d.nombre, isOwn: d.isOwn, monto: 0, horas: 0, cursos: 0 };
                }
                byDept[d.id].monto += perUserMonto;
                byDept[d.id].cursos++;
                byDept[d.id].horas += horas;
                totalMonto += perUserMonto;

                if (d.isOwn) {
                    ownMonto += perUserMonto;
                    courseHasOwnDept = true;
                } else {
                    otherMonto += perUserMonto;
                }
            });

            // Step 3: Hours counted once per course (own if own dept paid, otherwise other)
            totalHoras += horas;
            if (courseHasOwnDept) {
                ownHoras += horas;
            } else {
                otherHoras += horas;
            }
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

    // ---- BOSS HIERARCHY ANALYSIS ----
    const getSubordinates = useMemo(() => {
        // Build a map of jefe -> direct reports
        const childrenMap: Record<number, number[]> = {};
        allUsersData.forEach(u => {
            if (u.id_jefe) {
                if (!childrenMap[u.id_jefe]) childrenMap[u.id_jefe] = [];
                childrenMap[u.id_jefe].push(u.id);
            }
        });

        // Recursive function to get all subordinates
        const resolve = (jefeId: number): number[] => {
            const direct = childrenMap[jefeId] || [];
            const all: number[] = [...direct];
            direct.forEach(id => {
                all.push(...resolve(id));
            });
            return all;
        };
        return resolve;
    }, [allUsersData]);

    const jefeAnalysis = useMemo(() => {
        if (!filterJefe) return [];

        const subordinateIds = getSubordinates(filterJefe);
        const userMap = new Map(allUsersData.map(u => [u.id, u]));

        return subordinateIds.map(uid => {
            const userData = userMap.get(uid);
            if (!userData) return null;

            let totalHoras = 0;
            let totalInversion = 0;
            let cursosCount = 0;
            const cursosList: { nombre: string; horas: number; inversion: number; habilidad: string; tipo: string }[] = [];

            filteredCursos.forEach(c => {
                const enrolled = (c.users || []).some(u => u.id === uid);
                if (!enrolled) return;

                cursosCount++;
                const horas = Number(c.cant_horas || 0);
                totalHoras += horas;

                const numUsers = (c.users || []).length || 1;
                let userInversion = 0;
                (c.cdcs || []).forEach(cdc => {
                    const monto = Number((cdc as any).pivot?.monto || 0);
                    if (monto > 0) userInversion += monto / numUsers;
                });
                totalInversion += userInversion;

                cursosList.push({
                    nombre: c.nombre,
                    horas,
                    inversion: userInversion,
                    habilidad: (c as any).habilidad?.habilidad || '—',
                    tipo: (c as any).tipo?.tipo || '—',
                });
            });

            // Check if this user is also a boss (has subordinates)
            const isSubBoss = (getSubordinates(uid)).length > 0;

            return {
                key: uid,
                id: uid,
                name: userData.name,
                deptNombre: userData.deptNombre,
                totalHoras,
                totalInversion,
                cursosCount,
                cursosList,
                isSubBoss,
            };
        }).filter(Boolean) as any[];
    }, [filterJefe, getSubordinates, filteredCursos, allUsersData]);

    const selectedJefeName = jefes.find(j => j.id === filterJefe)?.name || '';
    const jefeTotalHoras = jefeAnalysis.reduce((s: number, u: any) => s + u.totalHoras, 0);
    const jefeTotalInversion = jefeAnalysis.reduce((s: number, u: any) => s + u.totalInversion, 0);
    const jefeTotalCursos = jefeAnalysis.reduce((s: number, u: any) => s + u.cursosCount, 0);
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
            label: 'Hs Totales Colaboradores',
            value: `${stats.totalHorasColaboradores.toLocaleString()}h`,
            icon: BarChart3,
            gradient: 'from-purple-600 to-violet-500',
            subtitle: `${stats.totalHoras}h en cursos · ${stats.totalInscritos} inscripciones`,
        },
        {
            label: 'Hs / Colaborador',
            value: `${users > 0 ? (stats.totalHorasColaboradores / users).toFixed(1) : 0}h`,
            icon: GraduationCap,
            gradient: 'from-amber-500 to-orange-500',
            subtitle: `${users} colaboradores en sistema`,
        },
        {
            label: 'Presupuesto Disponible',
            value: `$${presupuestoDisponible.toLocaleString()}`,
            icon: TrendingUp,
            gradient: pctGastado > 80 ? 'from-red-600 to-orange-500' : 'from-amber-500 to-yellow-400',
            subtitle: `${pctGastado}% utilizado del total`,
        },
    ];

    // ─── Logo loader ─────────────────────────────────────────
    const loadLogo = useCallback((): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d')!.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve('');
            img.src = '/logo_tuteur_transparente.png';
        });
    }, []);

    // ─── PDF Export ─────────────────────────────────────────
    const exportMetricsToPDF = useCallback(async () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const logoData = await loadLogo();
        let y = 12;

        // ── Header ──
        doc.setFillColor(185, 28, 28);  // Tuteur red
        doc.rect(0, 0, pageW, 28, 'F');
        const textX = logoData ? 36 : 14;
        if (logoData) {
            doc.addImage(logoData, 'PNG', 10, 4, 22, 20);
        }
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('TUTEUR', textX, 14);
        doc.setFontSize(10);
        doc.text('Informe de Métricas de Capacitación', textX, 21);
        doc.setFontSize(8);
        doc.text(`Generado: ${new Date().toLocaleString()}`, pageW - 14, 14, { align: 'right' });
        doc.text(`Filtros activos: ${[filterArea ? `Área #${filterArea}` : null, filterDept ? `Depto #${filterDept}` : null, filterMonth, filterYear].filter(Boolean).join(', ') || 'Ninguno'}`, pageW - 14, 20, { align: 'right' });
        y = 36;

        // ── KPI Summary ──
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Resumen General', 14, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            head: [['Indicador', 'Valor']],
            body: [
                ['Total Cursos', stats.totalCursos.toLocaleString()],
                ['Total Inscriptos', stats.totalInscritos.toLocaleString()],
                ['Colaboradores en Sistema', users.toString()],
                ['Inversión Total', `$${stats.totalCosto.toLocaleString()}`],
                ['Promedio Inversión/Persona', `$${(stats.totalInscritos > 0 ? Math.round(stats.totalCosto / stats.totalInscritos) : 0).toLocaleString()}`],
                ['Horas Totales (cursos)', `${stats.totalHoras}h`],
                ['Persona-Horas Totales', `${stats.totalHorasColaboradores.toLocaleString()}h`],
                ['Hs / Colaborador', `${users > 0 ? (stats.totalHorasColaboradores / users).toFixed(1) : 0}h`],
                ['Presupuesto Asignado', `$${stats.totalPresupuesto.toLocaleString()}`],
                ['Presupuesto Gastado', `$${stats.totalGastado.toLocaleString()}`],
                ['Presupuesto Disponible', `$${presupuestoDisponible.toLocaleString()}`],
                ['% Utilizado', `${pctGastado}%`],
            ],
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { halign: 'right', cellWidth: 50 } },
            margin: { left: 14, right: pageW / 2 + 10 },
            tableWidth: pageW / 2 - 20,
        });

        // ── Budget by Department ──
        y = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Análisis de Presupuesto por Departamento', 14, y);
        y += 2;

        if (deptBudgets.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['#', 'Departamento', 'Asignado', 'Consumido CDC', '% Utilización']],
                body: deptBudgets.map((d, i) => [
                    (i + 1).toString(),
                    d.nombre,
                    `$${d.inicial.toLocaleString()}`,
                    `$${d.gastado.toLocaleString()}`,
                    `${d.inicial > 0 ? Math.round((d.gastado / d.inicial) * 100) : 0}%`,
                ]),
                foot: [[
                    '', 'TOTAL',
                    `$${deptBudgets.reduce((s, d) => s + d.inicial, 0).toLocaleString()}`,
                    `$${totalAccumulatedGastado.toLocaleString()}`,
                    '',
                ]],
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold', fontSize: 7 },
                footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' } },
                margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        } else {
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('Sin datos de presupuesto para los filtros seleccionados', 14, y + 5);
            y += 15;
        }

        // ── Hours by Department (new page if needed) ──
        if (y > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            y = 14;
        }
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Análisis de Horas por Departamento', 14, y);
        y += 2;

        if (deptHours.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['#', 'Departamento', 'Persona-Horas', 'Cursos', 'Inscripciones', '% del Total']],
                body: deptHours.map((d, i) => [
                    (i + 1).toString(),
                    d.nombre,
                    `${d.personaHoras.toLocaleString()}h`,
                    d.cursos.toString(),
                    d.usuarios.toString(),
                    `${totalHorasPersona > 0 ? Math.round((d.personaHoras / totalHorasPersona) * 100) : 0}%`,
                ]),
                foot: [[
                    '', 'TOTAL',
                    `${totalHorasPersona.toLocaleString()}h`,
                    deptHours.reduce((s, d) => s + d.cursos, 0).toString(),
                    deptHours.reduce((s, d) => s + d.usuarios, 0).toString(),
                    '100%',
                ]],
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 7 },
                footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } },
                margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        } else {
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('Sin datos de horas para los filtros seleccionados', 14, y + 5);
            y += 15;
        }

        // ── Habilidad (Skill) Breakdown ──
        if (habilidadStats.length > 0) {
            if (y > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                y = 14;
            }
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.text('Análisis por Habilidad', 14, y);
            y += 2;

            autoTable(doc, {
                startY: y,
                head: [['#', 'Habilidad', 'Cursos', 'Persona-Horas', 'Inscripciones', '% Cursos']],
                body: habilidadStats.map((h, i) => [
                    (i + 1).toString(),
                    h.nombre,
                    h.cursos.toString(),
                    `${h.personaHoras.toLocaleString()}h`,
                    h.inscripciones.toString(),
                    `${totalHabCursos > 0 ? Math.round((h.cursos / totalHabCursos) * 100) : 0}%`,
                ]),
                foot: [[
                    '', 'TOTAL',
                    totalHabCursos.toString(),
                    `${habilidadStats.reduce((s, h) => s + h.personaHoras, 0).toLocaleString()}h`,
                    habilidadStats.reduce((s, h) => s + h.inscripciones, 0).toString(),
                    '100%',
                ]],
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold', fontSize: 7 },
                footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'center' }, 5: { halign: 'center' } },
                margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        // ── Monthly Breakdown Matrix ──
        if (monthlyMatrix.length > 0) {
            if (y > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                y = 14;
            }
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.text('Gasto Aperturado por Mes', 14, y);
            y += 2;

            const monthHeaders = ['Departamento', ...MONTHS.map(m => m.label.substring(0, 3)), 'Total'];
            autoTable(doc, {
                startY: y,
                head: [monthHeaders],
                body: monthlyMatrix.map(r => [
                    r.nombre,
                    ...MONTHS.map(m => {
                        const val = r.months[m.value];
                        return val > 0 ? `$${val.toLocaleString()}` : '—';
                    }),
                    `$${r.total.toLocaleString()}`
                ]),
                styles: { fontSize: 6, cellPadding: 1.5, overflow: 'linebreak' },
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 6 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
                margin: { left: 10, right: 10 },
            });
        }

        // ── Footer on all pages ──
        const totalPages = doc.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            const pageH = doc.internal.pageSize.getHeight();
            doc.text(`Tuteur — Informe de Métricas — Página ${p} de ${totalPages}`, 14, pageH - 6);
            doc.text(new Date().toLocaleDateString(), pageW - 14, pageH - 6, { align: 'right' });
        }

        doc.save(`informe_metricas_tuteur_${new Date().toISOString().slice(0, 10)}.pdf`);
    }, [stats, users, pctGastado, presupuestoDisponible, deptBudgets, totalAccumulatedGastado, deptHours, totalHorasPersona, habilidadStats, totalHabCursos, monthlyMatrix, filterArea, filterDept, filterMonth, filterYear, loadLogo]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Métricas', href: '/admin/metrics' }]}>
            <Head title="Métricas de Capacitación" />

            <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Métricas de Capacitación</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Dashboard analítico · Vista general de inversión y alcance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            icon={<FileText className="w-3.5 h-3.5" />}
                            onClick={exportMetricsToPDF}
                            className="flex items-center gap-1 text-[10px] font-semibold uppercase text-red-700 border-red-200 hover:border-red-400! hover:text-red-800!"
                        >
                            Descargar PDF
                        </Button>
                        <button
                            onClick={() => router.visit('/admin/courses')}
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 font-bold uppercase transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Volver a Cursos
                        </button>
                    </div>
                </div>

                {/* KPI Cards (Reference Gradient Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {statCards.map((card, i) => (
                        <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg">
                            <div className={`bg-gradient-to-br ${card.gradient} p-5 text-white`}>
                                <div className="flex items-center justify-between mb-3">
                                    <card.icon className="w-6 h-6 opacity-80" />
                                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-semibold leading-none mb-1">{card.value}</div>
                                <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{card.label}</div>
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
                            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Presupuesto General</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-slate-700">
                                ${stats.totalGastado.toLocaleString()} <span className="text-slate-400 font-normal">de</span> ${stats.totalPresupuesto.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <Progress
                        percent={pctGastado}
                        strokeColor={pctGastado > 80 ? '#ef4444' : pctGastado > 50 ? '#f59e0b' : '#10b981'}
                        trailColor="#f1f5f9"
                        strokeWidth={14}
                        className="[&_.ant-progress-text]:font-semibold [&_.ant-progress-text]:text-sm"
                        format={pct => `${pct}%`}
                    />
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <div className="text-[9px] font-semibold uppercase text-slate-400">Asignado</div>
                            <div className="text-sm font-semibold text-slate-700">${stats.totalPresupuesto.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-semibold uppercase text-slate-400">Gastado</div>
                            <div className="text-sm font-semibold text-red-600">${stats.totalGastado.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-semibold uppercase text-slate-400">Disponible</div>
                            <div className="text-sm font-semibold text-emerald-600">${presupuestoDisponible.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>

                {/* FILTROS GLOBALES */}
                <Card className="border-none shadow-md rounded-2xl" bodyStyle={{ padding: '20px 24px' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Filtros de Análisis</span>
                        </div>
                        {(filterPresupuesto.length > 0 || filterArea || filterDept || filterMonth || filterYear || filterUser || filterJefe) && (
                            <button
                                onClick={() => { setFilterPresupuesto([]); setFilterArea(null); setFilterDept(null); setFilterMonth(null); setFilterYear(null); setFilterUser(null); setFilterJefe(null); }}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider"
                            >
                                <X className="w-3 h-3" />
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Presupuesto</label>
                            <Select
                                showSearch allowClear placeholder="Todos" mode="multiple" maxTagCount="responsive"
                                className="w-64 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterPresupuesto}
                                onChange={(v: number[]) => { setFilterPresupuesto(v); setFilterYear(null); }}
                                options={presupuestoGrupos.map(g => ({ value: g.id, label: g.descripcion }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Área</label>
                            <Select
                                showSearch allowClear placeholder="Toda la compañía"
                                className="w-48 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterArea}
                                onChange={v => { setFilterArea(v); setFilterDept(null); }}
                                options={activeAreas.map(a => ({ value: a.id, label: a.nombre }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Departamento</label>
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
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Mes</label>
                            <Select
                                allowClear placeholder="Todos"
                                className="w-36 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterMonth}
                                onChange={v => setFilterMonth(v)}
                                options={MONTHS}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Año</label>
                            <Select
                                allowClear placeholder="Todos"
                                className="w-28 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterYear}
                                onChange={v => setFilterYear(v)}
                                options={years.map(y => ({ value: y, label: y }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1"><UserSearch className="w-3 h-3" /> Colaborador</label>
                            <Select
                                showSearch allowClear placeholder="Buscar colaborador"
                                className="w-64 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterUser}
                                onChange={v => setFilterUser(v)}
                                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                options={allUsers.map(u => ({ value: u.id, label: `${u.name} — ${u.deptNombre}` }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Crown className="w-3 h-3" /> Responsable</label>
                            <Select
                                showSearch allowClear placeholder="Filtrar por jefe"
                                className="w-64 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-bold"
                                value={filterJefe}
                                onChange={v => setFilterJefe(v)}
                                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                options={jefes.map(j => ({ value: j.id, label: j.name }))}
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
                                    <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80 mb-1 flex items-center gap-2">
                                        <UserSearch className="w-3.5 h-3.5" /> Análisis de Consumo Individual
                                    </div>
                                    <div className="text-2xl font-semibold">{userAnalysis.userName}</div>
                                    <div className="text-xs opacity-80 font-bold mt-1">Departamento: {userAnalysis.userDept} · {userAnalysis.totalCursos} cursos</div>
                                </div>
                                <button onClick={() => setFilterUser(null)} className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                                    <X className="w-4 h-4" /> Cerrar
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-0 border-b border-slate-100">
                            <div className="p-5 text-center border-r border-slate-100">
                                <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Cursos Inscriptos</div>
                                <div className="text-xl font-semibold text-indigo-600">{userAnalysis.totalCursos}</div>
                            </div>
                            <div className="p-5 text-center border-r border-slate-100">
                                <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Gasto Propio Depto</div>
                                <div className="text-xl font-semibold text-emerald-600">${userAnalysis.ownMonto.toLocaleString()}</div>
                            </div>
                            <div className="p-5 text-center border-r border-slate-100">
                                <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Gasto Otros Deptos</div>
                                <div className="text-xl font-semibold text-orange-600">${userAnalysis.otherMonto.toLocaleString()}</div>
                            </div>
                            <div className="p-5 text-center border-r border-slate-100">
                                <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Horas Depto Propio</div>
                                <div className="text-xl font-semibold text-blue-600">{userAnalysis.ownHoras}h</div>
                            </div>
                            <div className="p-5 text-center">
                                <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Horas Otros Deptos</div>
                                <div className="text-xl font-semibold text-violet-600">{userAnalysis.otherHoras}h</div>
                            </div>
                        </div>

                        {/* Cost + Hours Comparison Bars */}
                        <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-[9px] font-semibold uppercase text-slate-400 mb-2">Distribución de Gasto</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${userAnalysis.totalMonto > 0 ? (userAnalysis.ownMonto / userAnalysis.totalMonto) * 100 : 0}%` }} />
                                        <div className="h-full bg-orange-400 transition-all" style={{ width: `${userAnalysis.totalMonto > 0 ? (userAnalysis.otherMonto / userAnalysis.totalMonto) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">${userAnalysis.totalMonto.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-4 mt-2">
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /><span className="text-[9px] font-bold text-slate-500">Propio ({userAnalysis.totalMonto > 0 ? Math.round((userAnalysis.ownMonto / userAnalysis.totalMonto) * 100) : 0}%)</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-orange-400 rounded-sm" /><span className="text-[9px] font-bold text-slate-500">Otros ({userAnalysis.totalMonto > 0 ? Math.round((userAnalysis.otherMonto / userAnalysis.totalMonto) * 100) : 0}%)</span></div>
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] font-semibold uppercase text-slate-400 mb-2">Distribución de Horas</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${userAnalysis.totalHoras > 0 ? (userAnalysis.ownHoras / userAnalysis.totalHoras) * 100 : 0}%` }} />
                                        <div className="h-full bg-violet-400 transition-all" style={{ width: `${userAnalysis.totalHoras > 0 ? (userAnalysis.otherHoras / userAnalysis.totalHoras) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">{userAnalysis.totalHoras}h</span>
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
                                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Desglose por Departamento Pagador</span>
                            </div>
                            {userAnalysis.departments.map((dept, i) => {
                                const pct = userAnalysis.totalMonto > 0 ? Math.round((dept.monto / userAnalysis.totalMonto) * 100) : 0;
                                return (
                                    <div key={i} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
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
                                            <div className="text-xs font-semibold text-slate-700">${dept.monto.toLocaleString()}</div>
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

                {/* BOSS HIERARCHY ANALYSIS VIEW */}
                {filterJefe && jefeAnalysis.length > 0 && (
                    <Card className="border-none shadow-md rounded-2xl" bodyStyle={{ padding: '0' }}>
                        {/* Boss Header */}
                        <div className="relative overflow-hidden rounded-t-2xl">
                            <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-6 text-white flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] font-bold tracking-widest text-amber-200 uppercase mb-1 flex items-center gap-2">
                                        <Crown className="w-3 h-3" /> Análisis por Responsable
                                    </div>
                                    <h2 className="text-2xl font-semibold">{selectedJefeName}</h2>
                                    <p className="text-[10px] text-amber-200 font-bold mt-1">
                                        {jefeAnalysis.length} colaboradores en la cadena jerárquica
                                    </p>
                                </div>
                                <button onClick={() => setFilterJefe(null)} className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                                    <X className="w-4 h-4" /> Quitar
                                </button>
                            </div>
                        </div>

                        {/* KPI Summary Row */}
                        <div className="grid grid-cols-4 border-b border-slate-100">
                            <div className="p-4 text-center border-r border-slate-100">
                                <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Subordinados</div>
                                <div className="text-2xl font-semibold text-slate-800">{jefeAnalysis.length}</div>
                            </div>
                            <div className="p-4 text-center border-r border-slate-100">
                                <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Cursos Totales</div>
                                <div className="text-2xl font-semibold text-indigo-600">{jefeTotalCursos}</div>
                            </div>
                            <div className="p-4 text-center border-r border-slate-100">
                                <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Horas Totales</div>
                                <div className="text-2xl font-semibold text-emerald-600">{jefeTotalHoras}h</div>
                            </div>
                            <div className="p-4 text-center">
                                <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Inversión Total</div>
                                <div className="text-2xl font-semibold text-red-600">${Math.round(jefeTotalInversion).toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Expandable Table */}
                        <Table
                            size="small"
                            pagination={{ pageSize: 50 }}
                            dataSource={jefeAnalysis}
                            rowKey="id"
                            className="tuteur-table"
                            expandable={{
                                expandedRowRender: (record: any) => (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-3">Detalle de Cursos</div>
                                        {record.cursosList.length > 0 ? (
                                            <div className="space-y-2">
                                                {record.cursosList.map((c: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 shadow-sm border border-slate-100">
                                                        <div className="flex-1">
                                                            <div className="text-xs font-bold text-slate-700">{c.nombre}</div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                                <Tag color="blue" className="text-[9px] font-bold m-0 mr-1">{c.habilidad}</Tag>
                                                                <Tag color="geekblue" className="text-[9px] font-bold m-0">{c.tipo}</Tag>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold text-slate-700">{c.horas}h</div>
                                                            <div className="text-[10px] font-bold text-red-600">${Math.round(c.inversion).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 italic">Sin cursos registrados en el período filtrado</div>
                                        )}
                                    </div>
                                ),
                                rowExpandable: (record: any) => record.cursosList.length > 0,
                            }}
                            columns={[
                                {
                                    title: 'Colaborador', dataIndex: 'name', key: 'name',
                                    sorter: (a: any, b: any) => a.name.localeCompare(b.name),
                                    render: (t: string, r: any) => (
                                        <div>
                                            <button
                                                className="text-xs font-bold text-blue-700 hover:text-blue-900 uppercase text-left hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0"
                                                onClick={() => { setFilterUser(r.id); setFilterJefe(null); }}
                                            >{t}</button>
                                            {r.isSubBoss && <Tag color="gold" className="text-[8px] font-bold ml-2 m-0">JEFE</Tag>}
                                        </div>
                                    )
                                },
                                {
                                    title: 'Departamento', dataIndex: 'deptNombre', key: 'dept',
                                    sorter: (a: any, b: any) => a.deptNombre.localeCompare(b.deptNombre),
                                    render: (t: string) => <span className="text-[10px] font-bold text-slate-500 uppercase">{t}</span>
                                },
                                {
                                    title: 'Cursos', dataIndex: 'cursosCount', key: 'cursos', align: 'center',
                                    sorter: (a: any, b: any) => a.cursosCount - b.cursosCount,
                                    render: (v: number) => <span className="text-xs font-bold text-indigo-600">{v}</span>
                                },
                                {
                                    title: 'Horas', dataIndex: 'totalHoras', key: 'horas', align: 'center',
                                    sorter: (a: any, b: any) => a.totalHoras - b.totalHoras,
                                    render: (v: number) => <span className="text-xs font-bold text-emerald-600">{v}h</span>
                                },
                                {
                                    title: 'Inversión', dataIndex: 'totalInversion', key: 'inv', align: 'right',
                                    sorter: (a: any, b: any) => a.totalInversion - b.totalInversion,
                                    render: (v: number) => <span className="text-xs font-bold text-red-600">${Math.round(v).toLocaleString()}</span>
                                },
                                {
                                    title: '% Inversión', key: 'pct', align: 'center',
                                    render: (_: any, r: any) => {
                                        const pct = jefeTotalInversion > 0 ? Math.round((r.totalInversion / jefeTotalInversion) * 100) : 0;
                                        return <Tag color={pct > 30 ? 'red' : pct > 15 ? 'orange' : 'blue'} className="text-[10px] font-bold">{pct}%</Tag>;
                                    }
                                },
                            ]}
                        />
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
                                        <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
                                            <BarChart3 className="w-4 h-4 text-red-500" />
                                            Consumo de CDCs por Departamento
                                        </div>
                                        <Tag color="red" className="font-semibold text-xs m-0">${totalAccumulatedGastado.toLocaleString()}</Tag>
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
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600 flex-shrink-0">
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
                                                    <div className="text-xs font-semibold text-slate-700">${dept.gastado.toLocaleString()}</div>
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
                                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
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
                                                        {/* Tooltip - positioned at center of chart, not clipped */}
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-slate-800 text-white text-[10px] font-bold px-3 py-2 flex flex-col items-center gap-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40 pointer-events-none shadow-xl border border-slate-600">
                                                            <span className="font-semibold text-white text-[11px]">{dept.nombre}</span>
                                                            <span className="text-slate-300">Asignado: ${dept.inicial.toLocaleString()}</span>
                                                            <span className="text-red-400">Consumido: ${dept.gastado.toLocaleString()}</span>
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

                        {/* Hours Analysis: Two-Column Ranking + Bar Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Hours Ranking by Department */}
                            <Card
                                title={
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
                                            <Clock className="w-4 h-4 text-purple-500" />
                                            Horas por Departamento
                                        </div>
                                        <Tag color="purple" className="font-semibold text-xs m-0">{totalHorasPersona.toLocaleString()}h persona</Tag>
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl"
                                bodyStyle={{ padding: '0' }}
                            >
                                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                    {deptHours.map((dept, i) => {
                                        const pct = totalHorasPersona > 0 ? Math.round((dept.personaHoras / totalHorasPersona) * 100) : 0;
                                        return (
                                            <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setFilterDept(dept.id)}>
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-semibold text-purple-600 shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-700 truncate">{dept.nombre}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Progress
                                                            percent={pct}
                                                            size="small"
                                                            showInfo={false}
                                                            strokeColor="#8b5cf6"
                                                            strokeWidth={5}
                                                            className="flex-1 m-0"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-xs font-semibold text-purple-600">{dept.personaHoras.toLocaleString()}h</div>
                                                    <div className="text-[9px] text-slate-400 font-bold">{dept.cursos} cursos · {dept.usuarios} inscr.</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {deptHours.length === 0 && (
                                        <div className="p-6 text-center text-slate-400 text-sm italic">Sin datos de horas para los filtros seleccionados</div>
                                    )}
                                </div>
                            </Card>

                            {/* Bar Chart – Hours Distribution by Department */}
                            <Card
                                title={
                                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
                                        <BarChart3 className="w-4 h-4 text-purple-500" />
                                        Distribución Visual de Horas
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl"
                                bodyStyle={{ padding: '0' }}
                            >
                                <div className="px-4 pt-3 pb-0 flex justify-end gap-4">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gradient-to-t from-purple-600 to-violet-400 rounded-sm"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Persona-horas</span></div>
                                </div>
                                <div className="p-6 overflow-x-auto pt-2">
                                    <div className="flex flex-col h-[340px] min-w-[400px]">
                                        <div className="flex-1 flex items-end justify-start gap-[3px] border-b-2 border-slate-800 pb-1">
                                            {deptHours.slice(0, 15).map((dept, i) => {
                                                const hPct = maxDeptHoursVal > 0 ? Math.max((dept.personaHoras / maxDeptHoursVal) * 100, 2) : 2;
                                                return (
                                                    <div key={i} className="flex-1 max-w-[50px] h-full flex flex-col items-center justify-end relative group cursor-pointer" onClick={() => setFilterDept(dept.id)}>
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-slate-800 text-white text-[10px] font-bold px-3 py-2 flex flex-col items-center gap-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40 pointer-events-none shadow-xl border border-slate-600">
                                                            <span className="font-semibold text-white text-[11px]">{dept.nombre}</span>
                                                            <span className="text-purple-300">Persona-horas: {dept.personaHoras.toLocaleString()}h</span>
                                                            <span className="text-slate-300">{dept.cursos} cursos · {dept.usuarios} inscripciones</span>
                                                        </div>
                                                        <div className="w-full max-w-[40px] bg-gradient-to-t from-purple-600 to-violet-400 absolute bottom-0 z-10 transition-all duration-500 hover:brightness-110 shadow-[0_-2px_5px_rgba(139,92,246,0.25)] rounded-t-sm" style={{ height: `${hPct}%` }} />
                                                    </div>
                                                );
                                            })}
                                            {deptHours.length === 0 && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Empty description={<span className="font-bold text-slate-400">Sin datos de horas</span>} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start justify-start gap-[3px] mt-2">
                                            {deptHours.slice(0, 15).map((dept, i) => (
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

                        {/* Habilidad (Skill) Analysis: Ranking + Bar Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Habilidad Ranking */}
                            <Card
                                title={
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
                                            <GraduationCap className="w-4 h-4 text-teal-500" />
                                            Cursos por Habilidad
                                        </div>
                                        <Tag color="cyan" className="font-semibold text-xs m-0">{totalHabCursos} cursos</Tag>
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl"
                                bodyStyle={{ padding: '0' }}
                            >
                                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                    {habilidadStats.map((hab, i) => {
                                        const pct = totalHabCursos > 0 ? Math.round((hab.cursos / totalHabCursos) * 100) : 0;
                                        return (
                                            <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-semibold text-teal-600 shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-700 truncate">{hab.nombre}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Progress
                                                            percent={pct}
                                                            size="small"
                                                            showInfo={false}
                                                            strokeColor="#14b8a6"
                                                            strokeWidth={5}
                                                            className="flex-1 m-0"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-xs font-semibold text-teal-600">{hab.cursos} cursos</div>
                                                    <div className="text-[9px] text-slate-400 font-bold">{hab.inscripciones} inscr. · {hab.personaHoras.toLocaleString()}h</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {habilidadStats.length === 0 && (
                                        <div className="p-6 text-center text-slate-400 text-sm italic">Sin datos de habilidades</div>
                                    )}
                                </div>
                            </Card>

                            {/* Bar Chart – Skills Distribution */}
                            <Card
                                title={
                                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
                                        <BarChart3 className="w-4 h-4 text-teal-500" />
                                        Distribución por Habilidad
                                    </div>
                                }
                                className="border-none shadow-md rounded-2xl"
                                bodyStyle={{ padding: '0' }}
                            >
                                <div className="px-4 pt-3 pb-0 flex justify-end gap-4">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-linear-to-t from-teal-600 to-cyan-400 rounded-sm"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Cursos</span></div>
                                </div>
                                <div className="p-6 overflow-x-auto pt-2">
                                    <div className="flex flex-col h-[340px] min-w-[400px]">
                                        <div className="flex-1 flex items-end justify-start gap-[3px] border-b-2 border-slate-800 pb-1">
                                            {habilidadStats.slice(0, 15).map((hab, i) => {
                                                const hPct = maxHabCursos > 0 ? Math.max((hab.cursos / maxHabCursos) * 100, 2) : 2;
                                                return (
                                                    <div key={i} className="flex-1 max-w-[50px] h-full flex flex-col items-center justify-end relative group cursor-pointer">
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-slate-800 text-white text-[10px] font-bold px-3 py-2 flex flex-col items-center gap-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40 pointer-events-none shadow-xl border border-slate-600">
                                                            <span className="font-semibold text-white text-[11px]">{hab.nombre}</span>
                                                            <span className="text-teal-300">{hab.cursos} cursos</span>
                                                            <span className="text-slate-300">{hab.inscripciones} inscripciones · {hab.personaHoras.toLocaleString()}h</span>
                                                        </div>
                                                        <div className="w-full max-w-[40px] bg-linear-to-t from-teal-600 to-cyan-400 absolute bottom-0 z-10 transition-all duration-500 hover:brightness-110 shadow-[0_-2px_5px_rgba(20,184,166,0.25)] rounded-t-sm" style={{ height: `${hPct}%` }} />
                                                    </div>
                                                );
                                            })}
                                            {habilidadStats.length === 0 && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Empty description={<span className="font-bold text-slate-400">Sin datos de habilidades</span>} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start justify-start gap-[3px] mt-2">
                                            {habilidadStats.slice(0, 15).map((hab, i) => (
                                                <div key={i} className="flex-1 max-w-[50px] flex justify-center">
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase text-center leading-tight line-clamp-3 block w-full px-0.5" title={hab.nombre}>
                                                        {hab.nombre}
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
                                <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
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
                                className="tuteur-table"
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
                                    <h2 className="text-3xl font-semibold">{selectedDeptName}</h2>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1">Desglose de inversión, participantes y cronograma del departamento</p>
                                </div>
                                <button onClick={() => setFilterDept(null)} className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                                    <X className="w-4 h-4" /> Quitar Filtro
                                </button>
                            </div>
                        </div>

                        {/* Budget KPIs for Department */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white">
                                    <div className="text-[9px] font-semibold uppercase tracking-widest opacity-80 mb-1">Ppto Asignado</div>
                                    <div className="text-2xl font-semibold">${drillBudget.asignado.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                <div className="bg-gradient-to-br from-red-600 to-rose-500 p-5 text-white">
                                    <div className="text-[9px] font-semibold uppercase tracking-widest opacity-80 mb-1">Ppto Utilizado</div>
                                    <div className="text-2xl font-semibold">${drillBudget.utilizado.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                <div className={`bg-gradient-to-br ${drillBudget.pctUtilizado > 80 ? 'from-red-600 to-orange-500' : drillBudget.pctUtilizado > 50 ? 'from-amber-500 to-yellow-400' : 'from-emerald-600 to-teal-500'} p-5 text-white`}>
                                    <div className="text-[9px] font-semibold uppercase tracking-widest opacity-80 mb-1">% Utilizado</div>
                                    <div className="text-2xl font-semibold">{drillBudget.pctUtilizado}%</div>
                                </div>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-5 text-white">
                                    <div className="text-[9px] font-semibold uppercase tracking-widest opacity-80 mb-1">Ppto Disponible</div>
                                    <div className="text-2xl font-semibold">${drillBudget.disponible.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Drill Sub-Filters */}
                        <Card className="border-none shadow-md rounded-2xl" bodyStyle={{ padding: '12px 20px' }}>
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-slate-400" />
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Sub-Filtros</span>
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
                                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
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
                                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
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
                                    className="tuteur-table"
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
                                                    <span className="text-[11px] font-semibold text-white px-2">{drillHabilidadesTotales[`h_${h.id}`].toLocaleString()}</span>
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
                                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500 tracking-wide">
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
                                    className="tuteur-table"
                                    columns={[
                                        {
                                            title: 'Nombre y Apellido', dataIndex: ['user', 'name'], key: 'name',
                                            sorter: (a: any, b: any) => a.user.name.localeCompare(b.user.name),
                                            render: (t: string, r: any) => (
                                                <button
                                                    className="text-xs font-bold text-blue-700 hover:text-blue-900 uppercase block text-left hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0"
                                                    onClick={() => { setFilterUser(r.user.id); setFilterDept(null); }}
                                                >{t}</button>
                                            )
                                        },
                                        {
                                            title: 'Cursos Inscriptos', dataIndex: 'cursosCount', key: 'cc', align: 'center',
                                            sorter: (a: any, b: any) => a.cursosCount - b.cursosCount,
                                            render: (v: number) => <span className="text-xs font-bold text-indigo-600">{v}</span>
                                        },
                                        {
                                            title: 'Horas Totales', dataIndex: 'horasTotales', key: 'ht', align: 'center',
                                            sorter: (a: any, b: any) => a.horasTotales - b.horasTotales,
                                            render: (v: number) => <span className="text-xs font-bold text-slate-600">{v}h</span>
                                        },
                                        {
                                            title: '% Horas', key: 'pctH', align: 'center',
                                            sorter: (a: any, b: any) => a.horasTotales - b.horasTotales,
                                            render: (_: any, r: any) => {
                                                const pct = totalDrillHours > 0 ? Math.round((r.horasTotales / totalDrillHours) * 100) : 0;
                                                return <Tag color={pct > 30 ? 'red' : pct > 15 ? 'orange' : 'blue'} className="text-[10px] font-bold">{pct}%</Tag>;
                                            }
                                        },
                                    ]}
                                />
                            </Card>

                            {/* Lateral KPIs */}
                            <div className="space-y-4">
                                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white text-center">
                                        <div className="text-[9px] font-semibold uppercase tracking-widest opacity-60 mb-2">Total Horas</div>
                                        <div className="text-5xl font-semibold">{totalDrillHours}</div>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                    <div className="bg-gradient-to-br from-red-600 to-rose-500 p-8 text-white text-center">
                                        <div className="text-[9px] font-semibold uppercase tracking-widest opacity-80 mb-2">% Participación Depto</div>
                                        <div className="text-4xl font-semibold">
                                            {deptTotalUsers > 0 ? Math.round((drillUsers.length / deptTotalUsers) * 100) : 0}%
                                        </div>
                                        <div className="text-[10px] text-white/70 font-bold mt-2 uppercase">{drillUsers.length} de {deptTotalUsers} colaboradores del depto</div>
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
