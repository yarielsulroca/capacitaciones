import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Card, Table, Tag, Button, Tooltip, Popconfirm, Select } from 'antd';
import { Plus, Users, Trash2, Edit, DollarSign, ChevronRight, Wallet, BarChart3, Clock, CheckCircle, XCircle, AlertTriangle, BookOpen, UserCheck, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AltaCursoModal from '@/components/AltaCursoModal';
import { Enrollment, Habilidad, Categoria, Cdc, Proveedor, Modalidad, CursoTipo, User, Curso, Presupuesto, PresupuestoGrupo, Area, Departamento } from '@/types/capacitaciones';
import { StatusBadge } from '@/components/status-badge';

interface Metadata {
    habilidades: Habilidad[];
    categorias: Categoria[];
    areas: Area[];
    departamentos: Departamento[];
    cdcs: Cdc[];
    proveedores: Proveedor[];
    modalidades: Modalidad[];
    cursos_tipos: CursoTipo[];
    users: User[];
    presupuestos?: PresupuestoGrupo[];
}

interface EnrollmentStats {
    inscriptos: number;
    solicitados: number;
    procesando: number;
    cancelados: number;
    terminados: number;
    incompletos: number;
    certificados: number;
    totalEnrollments: number;
    totalHoras: number;
    totalHorasColaboradores: number;
}

interface PageProps {
    cursos: Curso[];
    enrollments: { data: Enrollment[] };
    presupuestos: Presupuesto[];
    enrollmentStats: EnrollmentStats;
    metadata: Metadata;
}

export default function CourseIndex({ cursos, enrollments, presupuestos, enrollmentStats, metadata }: PageProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editCourse, setEditCourse] = useState<Curso | null>(null);

    const openCreate = () => {
        setEditCourse(null);
        setIsDialogOpen(true);
    };

    const openEdit = (course: Curso) => {
        setEditCourse(course);
        setIsDialogOpen(true);
    };

    const handleCloseModal = () => {
        setIsDialogOpen(false);
        setEditCourse(null);
    };

    const handleDeleteCourse = (id: number) => {
        router.delete(`/admin/courses/${id}`, { preserveScroll: true });
    };

    // Build the presupuesto lookup by departamento
    const presupuestoByDepto = useMemo(() => {
        const map: Record<number, Presupuesto> = {};
        (presupuestos || []).forEach(p => {
            if (p.id_departamento) map[p.id_departamento] = p;
        });
        return map;
    }, [presupuestos]);

    // Calculate total actual budget across all groups
    const totalPresupuesto = useMemo(() => {
        return (metadata.presupuestos || []).reduce((sum, group) => {
            return sum + (group.presupuestos || []).reduce((pSum: any, p: any) => pSum + (Number(p.actual) || 0), 0);
        }, 0);
    }, [metadata.presupuestos]);

    // ─── Export helpers ─────────────────────────────────────────

    const buildExportData = useCallback(() => {
        return (cursos || []).map(c => {
            const grp = (metadata.presupuestos || []).find(g => String(g.id) === String(c.id_presupuesto));
            return {
                'Curso': c.nombre,
                'Habilidad': c.habilidad && typeof c.habilidad === 'object' ? (c.habilidad as any).habilidad : '—',
                'Categoría': c.categoria && typeof c.categoria === 'object' ? (c.categoria as any).categoria : '—',
                'Modalidad': c.modalidad && typeof c.modalidad === 'object' ? (c.modalidad as any).modalidad : '—',
                'Tipo': c.tipo && typeof c.tipo === 'object' ? (c.tipo as any).tipo : '—',
                'Inscriptos': c.users_count || c.users?.length || 0,
                'Horas': Number(c.cant_horas || 0),
                'Costo ($)': Number(c.costo || 0),
                'Fecha Inicio': c.inicio ? new Date(c.inicio).toLocaleDateString() : '—',
                'Fecha Fin': c.fin ? new Date(c.fin).toLocaleDateString() : '—',
                'Presupuesto': grp ? `${grp.descripcion} (${grp.fecha})` : 'Sin presupuesto',
                'Visibilidad': c.publicado ? 'Publicado' : 'Solo inscriptos',
            };
        });
    }, [cursos, metadata.presupuestos]);

    const exportToExcel = useCallback(() => {
        const data = buildExportData();
        const ws = XLSX.utils.json_to_sheet(data);

        // Auto column widths
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, ...data.map(row => String((row as any)[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cursos');
        XLSX.writeFile(wb, `cursos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [buildExportData]);

    const exportToPDF = useCallback(() => {
        const data = buildExportData();
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Title
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text('Reporte de Cursos — Capacitaciones', 14, 15);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generado: ${new Date().toLocaleString()}  ·  Total: ${data.length} cursos`, 14, 21);

        const headers = Object.keys(data[0] || {});
        const rows = data.map(row => headers.map(h => String((row as any)[h] ?? '')));

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 26,
            styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 7,
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 10, right: 10 },
        });

        doc.save(`cursos_${new Date().toISOString().slice(0, 10)}.pdf`);
    }, [buildExportData]);

    // ─── Expandable table config ───────────────────────────────

    const mainColumns = [
        {
            title: 'Curso',
            key: 'curso',
            sorter: (a: Curso, b: Curso) => a.nombre.localeCompare(b.nombre),
            render: (_: any, record: Curso) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-sm leading-tight">{record.nombre}</span>
                    <div className="flex items-center gap-1 mt-1">
                        {record.habilidad && typeof record.habilidad === 'object' && (
                            <Tag color="blue" className="text-[9px] uppercase font-semibold m-0 py-0">{(record.habilidad as any).habilidad}</Tag>
                        )}
                        {record.categoria && typeof record.categoria === 'object' && (
                            <Tag color="default" className="text-[9px] uppercase font-semibold m-0 py-0">{(record.categoria as any).categoria}</Tag>
                        )}
                        {record.modalidad && typeof record.modalidad === 'object' && (
                            <Tag color="purple" className="text-[9px] uppercase font-semibold m-0 py-0">{(record.modalidad as any).modalidad}</Tag>
                        )}
                        {record.tipo && typeof record.tipo === 'object' && (
                            <Tag color="geekblue" className="text-[9px] uppercase font-semibold m-0 py-0">{(record.tipo as any).tipo}</Tag>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: 'Inscriptos',
            key: 'users_count',
            width: 90,
            align: 'center' as const,
            sorter: (a: Curso, b: Curso) => (a.users_count || 0) - (b.users_count || 0),
            render: (_: any, record: Curso) => (
                <span className="text-sm font-semibold text-indigo-600">{record.users_count || record.users?.length || 0}</span>
            )
        },
        {
            title: 'Horas',
            key: 'horas',
            width: 80,
            align: 'center' as const,
            sorter: (a: Curso, b: Curso) => Number(a.cant_horas || 0) - Number(b.cant_horas || 0),
            render: (_: any, record: Curso) => (
                <span className="text-xs font-semibold text-emerald-600">{record.cant_horas || 0}h</span>
            )
        },
        {
            title: 'Costo',
            key: 'costo',
            width: 110,
            align: 'right' as const,
            sorter: (a: Curso, b: Curso) => Number(a.costo || 0) - Number(b.costo || 0),
            render: (_: any, record: Curso) => (
                <span className="text-sm font-semibold text-slate-700">${Number(record.costo || 0).toLocaleString()}</span>
            )
        },
        {
            title: 'Inicio',
            dataIndex: 'inicio',
            key: 'inicio',
            width: 100,
            sorter: (a: Curso, b: Curso) => new Date(a.inicio || 0).getTime() - new Date(b.inicio || 0).getTime(),
            render: (val: any) => <span className="text-xs font-medium text-slate-500">{val ? new Date(val).toLocaleDateString() : '—'}</span>
        },
        {
            title: 'Fin',
            dataIndex: 'fin',
            key: 'fin',
            width: 100,
            render: (val: any) => <span className="text-xs font-medium text-slate-500">{val ? new Date(val).toLocaleDateString() : '—'}</span>
        },
        {
            title: 'Presupuesto',
            key: 'presupuesto',
            width: 160,
            render: (_: any, record: Curso) => {
                const grp = (metadata.presupuestos || []).find(g => String(g.id) === String(record.id_presupuesto));
                return grp
                    ? <Tag color="cyan" className="text-[9px] font-semibold m-0">{grp.descripcion} ({grp.fecha})</Tag>
                    : <span className="text-[10px] text-slate-400 italic">Sin presupuesto</span>;
            }
        },
        {
            title: 'Visibilidad',
            key: 'publicado',
            align: 'center' as const,
            width: 110,
            render: (_: any, record: Curso) => (
                <Tag color={record.publicado ? 'blue' : 'default'} className="text-[9px] font-semibold uppercase m-0">
                    {record.publicado ? '👁 Publicado' : '🔒 Solo inscriptos'}
                </Tag>
            )
        },
        {
            title: '',
            key: 'actions',
            width: 90,
            fixed: 'right' as const,
            align: 'center' as const,
            render: (_: any, record: Curso) => (
                <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <Tooltip title="Editar curso">
                        <Button
                            shape="circle"
                            size="small"
                            icon={<Edit className="w-3.5 h-3.5" />}
                            onClick={() => openEdit(record)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', color: '#64748b' }}
                            className="hover:border-blue-500! hover:text-blue-500!"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="¿Eliminar este curso?"
                        description="Se eliminará el curso y todas sus matrículas."
                        onConfirm={() => handleDeleteCourse(record.id)}
                        okText="Sí, eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Eliminar curso">
                            <Button
                                shape="circle"
                                size="small"
                                danger
                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            />
                        </Tooltip>
                    </Popconfirm>
                </div>
            )
        },
    ];

    // ─── Expanded row: CDC + budget breakdown ──────────────────

    const expandedRowRender = (record: Curso) => {
        const cdcsList = record.cdcs || [];
        const enrolledUsers = record.users || [];

        if (cdcsList.length === 0 && enrolledUsers.length === 0) {
            return <div className="p-4 text-center text-slate-400 italic text-sm">No hay datos de CDC ni inscripciones para expandir.</div>;
        }

        const costoCurso = Number(record.costo) || 0;
        const usersCount = enrolledUsers.length || 0;
        const costoPerUser = usersCount > 0 ? costoCurso / usersCount : costoCurso;
        const totalCdcSum = cdcsList.reduce((sum, c) => sum + Number(c.pivot?.monto || 0), 0);

        return (
            <div className="p-4 space-y-5 bg-slate-50/50">
                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                        <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Costo Total</div>
                        <div className="text-sm font-semibold text-slate-700">${costoCurso.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                        <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Participantes</div>
                        <div className="text-sm font-semibold text-indigo-600">{usersCount}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                        <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Costo / Usuario</div>
                        <div className="text-sm font-semibold text-blue-600">${costoPerUser.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                        <div className="text-[9px] font-semibold uppercase text-slate-400 mb-1">Total CDC Asignado</div>
                        <div className={`text-sm font-semibold ${totalCdcSum === costoCurso ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${totalCdcSum.toLocaleString()} {totalCdcSum === costoCurso ? '✓' : totalCdcSum > costoCurso ? '⚠ Excede' : '⚠ Faltan $' + (costoCurso - totalCdcSum).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* ── CDC Breakdown ── */}
                {cdcsList.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-red-500" />
                            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Desglose por Centro de Costo</span>
                        </div>
                        <Table
                            columns={[
                                {
                                    title: 'CDC',
                                    dataIndex: 'cdcLabel',
                                    key: 'cdcLabel',
                                    render: (val: string) => <span className="font-semibold text-xs text-slate-700">{val}</span>
                                },
                                {
                                    title: 'Departamento',
                                    dataIndex: 'departamento',
                                    key: 'departamento',
                                    render: (val: string) => <span className="text-xs text-slate-500">{val}</span>
                                },
                                {
                                    title: 'Monto Total',
                                    dataIndex: 'monto',
                                    key: 'monto',
                                    align: 'right' as const,
                                    render: (val: number) => <span className="font-semibold text-xs text-red-600">${Number(val).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                },
                                {
                                    title: 'Por Usuario',
                                    dataIndex: 'perUser',
                                    key: 'perUser',
                                    align: 'right' as const,
                                    render: (val: number) => <span className="text-xs text-slate-600">${Number(val).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                },
                            ]}
                            dataSource={cdcsList.map((cdc, i) => {
                                const monto = Number(cdc.pivot?.monto || 0);
                                const dept = metadata.departamentos?.find((d: any) => String(d.id) === String(cdc.id_departamento));
                                return {
                                    key: `cdc-${cdc.id}-${i}`,
                                    cdcLabel: cdc.cdc,
                                    departamento: dept?.nombre || `Depto #${cdc.id_departamento}`,
                                    monto: monto,
                                    perUser: usersCount > 0 ? monto / usersCount : monto,
                                };
                            })}
                            pagination={false}
                            size="small"
                            bordered
                            className="tuteur-table"
                        />
                    </div>
                )}

                {/* ── Enrolled Users ── */}
                {enrolledUsers.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Participantes Inscriptos</span>
                        </div>
                        <Table
                            columns={[
                                {
                                    title: 'Nombre',
                                    key: 'name',
                                    render: (_: any, row: any) => (
                                        <span className="text-xs font-semibold text-slate-700">{row.name}</span>
                                    )
                                },
                                {
                                    title: 'Departamento',
                                    key: 'departamento',
                                    render: (_: any, row: any) => (
                                        <span className="text-xs text-slate-500">{row.departamento}</span>
                                    )
                                },
                                {
                                    title: 'Área',
                                    key: 'area',
                                    render: (_: any, row: any) => (
                                        <span className="text-xs text-slate-400">{row.area}</span>
                                    )
                                },
                                {
                                    title: 'Inversión / Usuario',
                                    key: 'cdcUser',
                                    align: 'right' as const,
                                    render: () => (
                                        <span className="font-semibold text-xs text-blue-600">
                                            ${costoPerUser.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </span>
                                    )
                                },
                                {
                                    title: 'Estado',
                                    key: 'estado',
                                    width: 160,
                                    align: 'center' as const,
                                    render: (_: any, row: any) => {
                                        const colorMap: Record<string, string> = {
                                            matriculado: 'green', solicitado: 'gold', procesando: 'blue', cancelado: 'red', terminado: 'cyan', incompleto: 'orange', certificado: 'purple'
                                        };
                                        const options = [
                                            { value: 'solicitado', label: 'Solicitado' },
                                            { value: 'procesando', label: 'Procesando' },
                                            { value: 'matriculado', label: 'Inscripto' },
                                            { value: 'cancelado', label: 'Cancelado' },
                                            { value: 'terminado', label: 'Terminado' },
                                            { value: 'incompleto', label: 'Incompleto' },
                                            { value: 'certificado', label: 'Certificado' },
                                        ];
                                        return (
                                            <Select
                                                value={row.estado}
                                                size="small"
                                                options={options}
                                                className="w-full"
                                                popupMatchSelectWidth={false}
                                                onChange={async (newEstado) => {
                                                    try {
                                                        await axios.post('/admin/enrollments/update-status', {
                                                            user_id: row.userId,
                                                            curso_id: record.id,
                                                            estado: newEstado,
                                                        });
                                                        toast.success(`Estado actualizado a ${options.find(o => o.value === newEstado)?.label}`);
                                                        router.reload();
                                                    } catch (err: any) {
                                                        toast.error(err.response?.data?.message || 'Error al actualizar estado');
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                optionRender={(option) => (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: {
                                                            solicitado: '#eab308', procesando: '#3b82f6', matriculado: '#22c55e',
                                                            cancelado: '#ef4444', terminado: '#06b6d4', incompleto: '#f97316', certificado: '#8b5cf6'
                                                        }[option.value as string] || '#94a3b8' }} />
                                                        <span className="text-xs font-semibold">{option.label}</span>
                                                    </div>
                                                )}
                                            />
                                        );
                                    }
                                },
                                {
                                    title: '',
                                    key: 'actions',
                                    width: 100,
                                    align: 'center' as const,
                                    render: (_: any, row: any) => (
                                        <Popconfirm
                                            title="¿Cancelar inscripción?"
                                            description={`Se eliminará a ${row.name} de este curso.`}
                                            okText="Sí, cancelar"
                                            cancelText="No"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => {
                                                router.delete(`/admin/courses/${record.id}/enrollments/${row.userId}`, {
                                                    preserveScroll: true,
                                                });
                                            }}
                                        >
                                            <Button size="small" danger type="text" className="text-[10px] uppercase font-semibold">
                                                Cancelar
                                            </Button>
                                        </Popconfirm>
                                    )
                                }
                            ]}
                            dataSource={enrolledUsers.map(u => ({
                                key: `user-${u.id}`,
                                name: u.name,
                                departamento: u.departamento?.nombre || 'Sin depto',
                                area: u.departamento?.area?.nombre || '—',
                                userId: u.id,
                                estado: (u as any).pivot?.curso_estado
                                    ? (() => {
                                        const estadoId = (u as any).pivot.curso_estado;
                                        const map: Record<number, string> = { 1: 'solicitado', 2: 'procesando', 3: 'matriculado', 4: 'cancelado', 5: 'terminado', 6: 'incompleto', 7: 'certificado' };
                                        return map[estadoId] || 'solicitado';
                                    })()
                                    : 'matriculado',
                            }))}
                            pagination={false}
                            size="small"
                            bordered
                            className="tuteur-table"

                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Cursos', href: '/admin/courses' }]}>
            <Head title="Gestión de Cursos e Inscripciones" />

            <div className="p-4 space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800">Administración de Capacitaciones</h1>
                        <p className="text-xs text-slate-400 mt-1">Tabla expandible: haz clic en una fila para ver el desglose financiero por CDC y presupuesto.</p>
                    </div>
                    <Button
                        type="primary"
                        onClick={openCreate}
                        className="bg-indigo-600 hover:bg-indigo-700 font-semibold uppercase flex items-center gap-2 h-auto py-2 px-4 border-none"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Alta
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                        { label: 'Cursos Totales', value: cursos?.length || 0, icon: BookOpen, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', color: 'text-indigo-700' },
                        { label: 'Inversión Total', value: `$${(cursos || []).reduce((s, c) => s + Number(c.costo || 0), 0).toLocaleString()}`, icon: DollarSign, bg: 'bg-rose-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', color: 'text-rose-700' },
                        { label: 'Horas Totales', value: `${enrollmentStats.totalHoras}h`, icon: Clock, bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', color: 'text-cyan-700' },
                        { label: 'Hs Totales Colaboradores', value: `${enrollmentStats.totalHorasColaboradores.toLocaleString()}h`, icon: BarChart3, bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', color: 'text-purple-700' },
                        { label: 'Hs / Colaborador', value: `${(metadata.users?.length || 0) > 0 ? (enrollmentStats.totalHorasColaboradores / metadata.users.length).toFixed(1) : 0}h`, icon: UserCheck, bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', color: 'text-amber-700' },
                        { label: 'Total Inscripciones', value: enrollmentStats.totalEnrollments, icon: Users, bg: 'bg-slate-50', iconBg: 'bg-slate-100', iconColor: 'text-slate-600', color: 'text-slate-700' },
                        { label: 'Total Colaboradores', value: metadata.users?.length || 0, icon: Users, bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', color: 'text-teal-700' },
                        { label: 'Presupuesto Disponible', value: `$${totalPresupuesto.toLocaleString()}`, icon: Wallet, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', color: 'text-emerald-700' },
                    ].map((card, i) => (
                        <div key={i} className={`${card.bg} rounded-xl p-4 border border-slate-100/50`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                                </div>
                                <div>
                                    <div className={`text-xl font-semibold leading-none ${card.color}`}>{card.value}</div>
                                    <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{card.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Enrollment Status Breakdown */}
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    {[
                        { label: 'Inscriptos', value: enrollmentStats.inscriptos, color: 'text-emerald-600', dot: 'bg-emerald-500' },
                        { label: 'Solicitados', value: enrollmentStats.solicitados, color: 'text-amber-600', dot: 'bg-amber-500' },
                        { label: 'Procesando', value: enrollmentStats.procesando, color: 'text-blue-600', dot: 'bg-blue-500' },
                        { label: 'Terminados', value: enrollmentStats.terminados, color: 'text-cyan-600', dot: 'bg-cyan-500' },
                        { label: 'Certificados', value: enrollmentStats.certificados, color: 'text-violet-600', dot: 'bg-violet-500' },
                        { label: 'Cancelados', value: enrollmentStats.cancelados, color: 'text-rose-600', dot: 'bg-rose-500' },
                        { label: 'Incompletos', value: enrollmentStats.incompletos, color: 'text-orange-600', dot: 'bg-orange-500' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-lg px-3 py-2.5 border border-slate-100 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                            <div className="flex-1 min-w-0">
                                <div className={`text-lg font-semibold leading-none ${s.color}`}>{s.value}</div>
                                <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Expandable Table */}
                <Card
                    title={
                        <div className="flex items-center text-slate-600 uppercase tracking-tight text-sm">
                            <BookOpen className="mr-2 h-4 w-4 text-indigo-500" />
                            Control de Cursos e Inscripciones
                        </div>
                    }
                    extra={
                        <div className="flex items-center gap-2">
                            <Button
                                size="small"
                                icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                                onClick={exportToExcel}
                                className="flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-700 border-emerald-200 hover:border-emerald-400! hover:text-emerald-800!"
                            >
                                Excel
                            </Button>
                            <Button
                                size="small"
                                icon={<FileText className="w-3.5 h-3.5" />}
                                onClick={exportToPDF}
                                className="flex items-center gap-1 text-[10px] font-semibold uppercase text-red-700 border-red-200 hover:border-red-400! hover:text-red-800!"
                            >
                                PDF
                            </Button>
                        </div>
                    }
                    className="border-none shadow-md"
                    bodyStyle={{ padding: 0 }}
                >
                    <Table
                        dataSource={cursos || []}
                        columns={mainColumns}
                        rowKey="id"
                        scroll={{ x: 1100 }}
                        expandable={{
                            expandedRowRender,
                            expandRowByClick: true,
                            expandIcon: ({ expanded, onExpand, record }) => (
                                <ChevronRight
                                    className={`w-4 h-4 text-slate-400 transition-transform cursor-pointer ${expanded ? 'rotate-90' : ''}`}
                                    onClick={(e: any) => onExpand(record, e)}
                                />
                            )
                        }}
                        pagination={{ pageSize: 15 }}
                        className="tuteur-table"
                    />
                </Card>
            </div>

            <AltaCursoModal
                isOpen={isDialogOpen}
                onClose={handleCloseModal}
                editCourse={editCourse}
                metadata={metadata}
            />
        </AppLayout>
    );
}
