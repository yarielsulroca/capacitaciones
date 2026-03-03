import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, Table, Tag, Button, Tooltip, Popconfirm } from 'antd';
import { Plus, Users, Trash2, Edit, DollarSign, TrendingDown, ChevronRight, Wallet, Building2, BarChart3 } from 'lucide-react';
import { useState, useMemo } from 'react';
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

interface PageProps {
    cursos: Curso[];
    enrollments: { data: Enrollment[] };
    presupuestos: Presupuesto[];
    metadata: Metadata;
}

export default function CourseIndex({ cursos, enrollments, presupuestos, metadata }: PageProps) {
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

    // ─── Expandable table config ───────────────────────────────

    const mainColumns = [
        {
            title: 'Curso',
            key: 'curso',
            render: (_: any, record: Curso) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm leading-tight">{record.nombre}</span>
                    <div className="flex items-center gap-1 mt-1">
                        {record.categoria && typeof record.categoria === 'object' && (
                            <Tag color="default" className="text-[9px] uppercase font-black m-0 py-0">{(record.categoria as any).categoria}</Tag>
                        )}
                        {record.modalidad && typeof record.modalidad === 'object' && (
                            <Tag color="red" className="text-[9px] uppercase font-black m-0 py-0">{(record.modalidad as any).modalidad}</Tag>
                        )}
                        {record.tipo && typeof record.tipo === 'object' && (
                            <Tag color="default" className="text-[9px] uppercase font-black m-0 py-0">{(record.tipo as any).tipo}</Tag>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: 'Costo $',
            key: 'costo',
            width: 100,
            render: (_: any, record: Curso) => (
                <span className="font-bold text-tuteur-grey text-sm">${Number(record.costo || 0).toLocaleString()}</span>
            )
        },
        {
            title: 'Fecha Inicio',
            dataIndex: 'inicio',
            key: 'inicio',
            width: 120,
            render: (val: any) => <span className="text-xs font-bold text-tuteur-grey">{val ? new Date(val).toLocaleDateString() : '—'}</span>
        },
        {
            title: 'Fecha Fin',
            dataIndex: 'fin',
            key: 'fin',
            width: 120,
            render: (val: any) => <span className="text-xs font-bold text-tuteur-grey">{val ? new Date(val).toLocaleDateString() : '—'}</span>
        },
        {
            title: 'Presupuesto',
            key: 'presupuesto',
            width: 180,
            render: (_: any, record: Curso) => {
                const grp = (metadata.presupuestos || []).find(g => String(g.id) === String(record.id_presupuesto));
                return <span className="text-xs font-bold text-tuteur-grey">{grp ? `${grp.descripcion} (${grp.fecha})` : 'Sin Grupo'}</span>;
            }
        },
        {
            title: 'Presupuesto - Actual',
            key: 'presupuesto_actual',
            width: 150,
            render: (_: any, record: Curso) => {
                const grp = (metadata.presupuestos || []).find(g => String(g.id) === String(record.id_presupuesto));
                return <span className="text-xs font-bold text-tuteur-red truncate max-w-[140px] block">
                    {grp ? `Presupuesto Actual - $${(grp.total_actual || 0).toLocaleString()}` : '—'}
                </span>;
            }
        },
        {
            title: 'Publicado',
            key: 'publicado',
            align: 'center' as const,
            width: 100,
            render: (_: any, record: Curso) => (
                <span className={`text-[11px] font-black uppercase ${record.publicado ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {record.publicado ? 'Sí' : 'No'}
                </span>
            )
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 100,
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
                            className="hover:!border-blue-500 hover:!text-blue-500"
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
            return <div className="p-4 text-center text-tuteur-grey-mid italic text-sm">No hay datos de CDC ni matrículas para expandir.</div>;
        }

        const costoCurso = Number(record.costo) || 0;
        const usersCount = enrolledUsers.length || 0;
        const costoPerUser = usersCount > 0 ? costoCurso / usersCount : costoCurso;
        const totalCdcSum = cdcsList.reduce((sum, c) => sum + Number(c.pivot?.monto || 0), 0);

        return (
            <div className="p-4 space-y-5 bg-slate-50/50">
                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl border p-3 shadow-sm">
                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Costo Total</div>
                        <div className="text-sm font-black text-slate-700">${costoCurso.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-xl border p-3 shadow-sm">
                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Participantes</div>
                        <div className="text-sm font-black text-slate-700">{usersCount}</div>
                    </div>
                    <div className="bg-white rounded-xl border p-3 shadow-sm">
                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Costo / Usuario</div>
                        <div className="text-sm font-black text-blue-600">${costoPerUser.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div className="bg-white rounded-xl border p-3 shadow-sm">
                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Total CDC Asignado</div>
                        <div className={`text-sm font-black ${totalCdcSum === costoCurso ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${totalCdcSum.toLocaleString()} {totalCdcSum === costoCurso ? '✓' : totalCdcSum > costoCurso ? '⚠ Excede' : '⚠ Faltan $' + (costoCurso - totalCdcSum).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* ── CDC Breakdown ── */}
                {cdcsList.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-red-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Desglose por Centro de Costo</span>
                        </div>
                        <Table
                            columns={[
                                {
                                    title: 'CDC',
                                    dataIndex: 'cdcLabel',
                                    key: 'cdcLabel',
                                    render: (val: string) => <span className="font-bold text-xs text-slate-700">{val}</span>
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
                                    render: (val: number) => <span className="font-bold text-xs text-red-600">${Number(val).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
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
                            className="[&_.ant-table-thead_th]:bg-slate-100/80 [&_.ant-table-thead_th]:text-[9px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400"
                        />
                    </div>
                )}

                {/* ── Enrolled Users ── */}
                {enrolledUsers.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Participantes Inscriptos</span>
                        </div>
                        <Table
                            columns={[
                                {
                                    title: 'Nombre',
                                    key: 'name',
                                    render: (_: any, row: any) => (
                                        <span className="text-xs font-bold text-slate-700">{row.name}</span>
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
                                    title: 'CDC / Usuario',
                                    key: 'cdcUser',
                                    align: 'right' as const,
                                    render: () => (
                                        <span className="font-bold text-xs text-blue-600">
                                            ${costoPerUser.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </span>
                                    )
                                },
                                {
                                    title: 'Estado',
                                    key: 'estado',
                                    align: 'center' as const,
                                    render: () => (
                                        <Tag color="green" className="font-bold text-[9px] uppercase m-0">Inscripto</Tag>
                                    )
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
                                            <Button size="small" danger type="text" className="text-[10px] uppercase font-bold">
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
                                userId: u.id,
                            }))}
                            pagination={false}
                            size="small"
                            bordered
                            className="[&_.ant-table-thead_th]:bg-slate-100/80 [&_.ant-table-thead_th]:text-[9px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400"
                            footer={() => (
                                <Button type="dashed" size="small" icon={<Plus className="w-3 h-3" />} onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(record);
                                }} className="text-xs text-tuteur-grey-mid font-bold">+ Añadir usuario al curso</Button>
                            )}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Cursos', href: '/admin/courses' }]}>
            <Head title="Gestión de Cursos y Matrículas" />

            <div className="p-4 space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-tuteur-grey-light">
                    <div>
                        <h1 className="text-2xl font-bold text-tuteur-grey">Administración de Capacitaciones</h1>
                        <p className="text-xs text-tuteur-grey-mid mt-1">Tabla expandible: haz clic en una fila para ver el desglose financiero por CDC y presupuesto.</p>
                    </div>
                    <Button
                        type="primary"
                        onClick={openCreate}
                        className="bg-tuteur-red hover:bg-red-700 font-bold uppercase flex items-center gap-2 h-auto py-2 px-4 border-none"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Alta
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow" bodyStyle={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center text-white shadow-sm">
                                <Users className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-tuteur-grey leading-none">{cursos?.length || 0}</div>
                                <div className="text-[8px] font-black text-tuteur-grey-mid uppercase tracking-widest mt-0.5">Cursos</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow" bodyStyle={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-tuteur-grey leading-none">
                                    ${(cursos || []).reduce((sum, c) => sum + Number(c.costo || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-[8px] font-black text-tuteur-grey-mid uppercase tracking-widest mt-0.5">Inversión Total</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow" bodyStyle={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center text-white shadow-sm">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-tuteur-grey leading-none">
                                    {(cursos || []).reduce((sum, c) => sum + (c.users_count || c.users?.length || 0), 0)}
                                </div>
                                <div className="text-[8px] font-black text-tuteur-grey-mid uppercase tracking-widest mt-0.5">Matrículas</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" bodyStyle={{ padding: '14px 16px' }}
                        onClick={() => router.visit('/admin/structure')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-sm">
                                <Wallet className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-emerald-600 leading-none">
                                    ${totalPresupuesto.toLocaleString()}
                                </div>
                                <div className="text-[8px] font-black text-tuteur-grey-mid uppercase tracking-widest mt-0.5">Presupuesto Disp.</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow" bodyStyle={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-white shadow-sm">
                                <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-tuteur-grey leading-none">{metadata.areas?.length || 0}</div>
                                <div className="text-[8px] font-black text-tuteur-grey-mid uppercase tracking-widest mt-0.5">Áreas</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow" bodyStyle={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-gray-400 flex items-center justify-center text-white shadow-sm">
                                <Users className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-tuteur-grey leading-none">{metadata.users?.length || 0}</div>
                                <div className="text-[8px] font-black text-tuteur-grey-mid uppercase tracking-widest mt-0.5">Colaboradores</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Presupuesto Quick Link */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-amber-400" />
                        <div>
                            <div className="text-white font-bold text-sm">Gestión de Presupuestos</div>
                            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Administrar grupos, asignaciones y saldos por departamento</div>
                        </div>
                    </div>
                    <Button
                        type="primary"
                        className="bg-amber-500 hover:bg-amber-600 border-none font-bold uppercase text-xs"
                        icon={<ChevronRight className="w-4 h-4" />}
                        onClick={() => router.visit('/admin/structure')}
                    >
                        Ver Presupuestos
                    </Button>
                </div>

                {/* Expandable Table */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-3 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-cyan-300" />
                        <div>
                            <div className="text-white font-bold text-sm">Métricas de Capacitación</div>
                            <div className="text-blue-200 text-[10px] uppercase font-bold tracking-wider">Análisis de inversión, alcance y distribución presupuestaria</div>
                        </div>
                    </div>
                    <Button
                        type="primary"
                        className="bg-cyan-500 hover:bg-cyan-600 border-none font-bold uppercase text-xs"
                        icon={<ChevronRight className="w-4 h-4" />}
                        onClick={() => router.visit('/admin/metrics')}
                    >
                        Ver Métricas
                    </Button>
                </div>

                {/* Expandable Table */}
                <Card
                    title={
                        <div className="flex items-center text-gray-700 uppercase tracking-tight text-sm">
                            <DollarSign className="mr-2 h-4 w-4 text-tuteur-red" />
                            Control de Cursos y Presupuestos
                        </div>
                    }
                    className="border-none shadow-md overflow-hidden"
                    bodyStyle={{ padding: 0 }}
                >
                    <Table
                        dataSource={cursos || []}
                        columns={mainColumns}
                        rowKey="id"
                        expandable={{
                            expandedRowRender,
                            expandRowByClick: true,
                            expandIcon: ({ expanded, onExpand, record }) => (
                                <ChevronRight
                                    className={`w-4 h-4 text-tuteur-grey-mid transition-transform cursor-pointer ${expanded ? 'rotate-90' : ''}`}
                                    onClick={(e: any) => onExpand(record, e)}
                                />
                            )
                        }}
                        pagination={{ pageSize: 15 }}
                        className="w-full [&_.ant-table-expand-icon-cell]:w-8"
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
