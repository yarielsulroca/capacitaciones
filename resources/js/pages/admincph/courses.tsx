import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, Table, Tag, Button, Tooltip, Popconfirm } from 'antd';
import { Plus, Users, Trash2, Edit, DollarSign, TrendingDown, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import AltaCursoModal from '@/components/AltaCursoModal';
import { Enrollment, Habilidad, Categoria, Cdc, Proveedor, Modalidad, CursoTipo, User, Curso, Presupuesto, PresupuestoGrupo } from '@/types/capacitaciones';
import { StatusBadge } from '@/components/status-badge';

interface Metadata {
    habilidades: Habilidad[];
    categorias: Categoria[];
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
            title: 'Costo/U',
            key: 'costo',
            width: 100,
            render: (_: any, record: Curso) => (
                <span className="font-bold text-tuteur-grey text-sm">${Number(record.costo).toLocaleString()}</span>
            )
        },
        {
            title: 'Inscriptos',
            key: 'users_count',
            width: 110,
            align: 'center' as const,
            render: (_: any, record: Curso) => (
                    <Tag color="red" className="font-bold text-sm m-0">
                    {record.users_count || record.users?.length || 0}
                </Tag>
            )
        },
        {
            title: 'CDCs Asignados',
            key: 'cdcs',
            width: 200,
            render: (_: any, record: Curso) => {
                const cdcsList = record.cdcs || [];
                if (cdcsList.length === 0) {
                    return <span className="text-xs text-tuteur-grey-mid italic">Sin CDC</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {cdcsList.map((c, i) => (
                            <Tooltip key={i} title={`${c.departamento?.nombre || 'N/A'}: $${c.pivot?.monto?.toLocaleString() || 0}`}>
                                <Tag color="red" className="text-[9px] font-black m-0 py-0 uppercase cursor-help">
                                    {c.cdc} = -${c.pivot?.monto?.toLocaleString() || 0}
                                </Tag>
                            </Tooltip>
                        ))}
                    </div>
                );
            }
        },
        {
            title: 'Inversión Total',
            key: 'inversion',
            width: 130,
            render: (_: any, record: Curso) => {
                const usersCount = record.users_count || record.users?.length || 0;
                const total = Number(record.costo) * usersCount;
                return (
                    <div className="flex flex-col">
                        <span className="font-black text-tuteur-grey text-sm">${total.toLocaleString()}</span>
                        <span className="text-[9px] text-tuteur-grey-mid">{usersCount} × ${Number(record.costo).toLocaleString()}</span>
                    </div>
                );
            }
        },
        {
            title: 'Período',
            key: 'periodo',
            width: 120,
            render: (_: any, record: Curso) => (
                <div className="flex flex-col text-[11px]">
                    <span className="font-bold text-tuteur-grey text-[11px]">{record.anio_formacion || new Date().getFullYear()}</span>
                    <span className="text-tuteur-grey-mid text-[11px]">{record.mes_pago || '—'}</span>
                </div>
            )
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 110,
            align: 'center' as const,
            render: (_: any, record: Curso) => (
                <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                    <Tooltip title="Editar curso">
                        <Button
                            type="text"
                            size="small"
                            icon={<Edit className="w-3.5 h-3.5" />}
                            onClick={() => openEdit(record)}
                            className="text-tuteur-grey-mid hover:text-tuteur-red"
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
                                type="text"
                                size="small"
                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                className="text-tuteur-grey-mid hover:text-red-500"
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

        // Build CDC breakdown rows
        const costoCurso = Number(record.costo) || 0;
        const usersCount = enrolledUsers.length || 0;
        const costoPerUser = usersCount > 0 ? costoCurso / usersCount : costoCurso;

        const cdcRows = cdcsList.map((cdc, i) => {
            const deptoId = cdc.id_departamento;
            const presupuesto = deptoId ? presupuestoByDepto[deptoId] : null;
            const monto = cdc.pivot?.monto || 0;
            const montoPerUser = usersCount > 0 ? monto / usersCount : monto;

            const pInicial = presupuesto?.inicial || 0;
            const pActual = presupuesto?.actual || 0;
            const pctCdc = pInicial > 0 ? (monto / pInicial) : 0;
            const pctActual = pInicial > 0 ? (pActual / pInicial) : 0;

            return {
                key: `cdc-${i}`,
                departamento: cdc.departamento?.nombre || 'N/A',
                area: cdc.departamento?.area?.nombre || '',
                cdcLabel: cdc.cdc,
                cdcMonto: monto,
                cdcMontoPerUser: montoPerUser,
                cdcFormula: `${cdc.cdc}=-$${monto.toLocaleString()}`,
                usersCount,
                costoPerUser,
                presupuestoLabel: deptoId ? cdc.cdc : 'N/A',
                presupuestoInicial: pInicial,
                presupuestoActual: pActual,
                operacion: pInicial > 0 ? `${pActual.toLocaleString()} (actual)` : 'N/A',
                pctCdc: (pctCdc * 100).toFixed(2),
                pctPresupuestoActual: (pctActual * 100).toFixed(2),
                anioPago: record.anio_formacion || new Date().getFullYear(),
                mesPago: record.mes_pago || '—',
            };
        });

        const cdcColumns = [
            {
                title: 'Departamento',
                dataIndex: 'departamento',
                key: 'departamento',
                render: (val: string, row: any) => (
                    <div className="flex flex-col">
                        <span className="font-bold text-xs text-tuteur-grey">{val}</span>
                        <span className="text-[9px] text-tuteur-grey-mid">{row.area}</span>
                    </div>
                )
            },
            {
                title: 'CDC (Total)',
                key: 'cdc',
                render: (_: any, row: any) => (
                    <div className="flex flex-col">
                        <Tag color="red" className="font-black text-[10px] uppercase m-0 w-fit">
                            {row.cdcFormula}
                        </Tag>
                    </div>
                )
            },
            {
                title: 'Costo/Usuario',
                key: 'costoPerUser',
                align: 'center' as const,
                render: (_: any, row: any) => (
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-xs text-tuteur-red">${row.cdcMontoPerUser.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <span className="text-[9px] text-tuteur-grey-mid">${row.cdcMonto.toLocaleString()} ÷ {row.usersCount || 1} usu.</span>
                    </div>
                )
            },
            {
                title: 'Presupuestos',
                key: 'presupuestos',
                render: (_: any, row: any) => (
                    <span className="font-bold text-xs text-tuteur-grey">{row.presupuestoLabel}</span>
                )
            },
            {
                title: 'Presupuesto Actual',
                key: 'presupuesto_actual',
                render: (_: any, row: any) => (
                    <div className="flex flex-col">
                        <span className="font-bold text-xs text-tuteur-grey">${row.presupuestoActual.toLocaleString()}</span>
                        <span className="text-[9px] text-tuteur-grey-mid">{row.operacion}</span>
                    </div>
                )
            },
            {
                title: '% CDC',
                key: 'pctCdc',
                align: 'center' as const,
                render: (_: any, row: any) => (
                    <span className="text-[11px] font-bold text-tuteur-grey">{row.pctCdc}%</span>
                )
            },
            {
                title: '% Presupuesto Actual',
                key: 'pctPresupuestoActual',
                align: 'center' as const,
                render: (_: any, row: any) => {
                    const pct = parseFloat(row.pctPresupuestoActual);
                    return (
                        <span className={`text-[11px] font-bold ${pct > 50 ? 'text-tuteur-grey' : pct > 20 ? 'text-tuteur-grey-mid' : 'text-tuteur-red'}`}>
                            {row.pctPresupuestoActual}%
                        </span>
                    );
                }
            },
            {
                title: 'Año-Pago',
                dataIndex: 'anioPago',
                key: 'anioPago',
                width: 80,
                align: 'center' as const,
                render: (val: any) => <span className="text-xs font-bold text-tuteur-grey">{val}</span>
            },
            {
                title: 'Mes-Pago',
                dataIndex: 'mesPago',
                key: 'mesPago',
                width: 80,
                align: 'center' as const,
                render: (val: any) => <span className="text-xs font-bold text-tuteur-grey">{val}</span>
            },
        ];

        // Enrolled users table
        const userRows = enrolledUsers.map(u => ({
            key: `user-${u.id}`,
            name: u.name,
            email: u.email,
            departamento: u.departamento?.nombre || 'N/A',
            area: u.departamento?.area?.nombre || '',
        }));

        const userColumns = [
            {
                title: 'Colaborador',
                key: 'name',
                render: (_: any, row: any) => (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-tuteur-grey">{row.name}</span>
                        <span className="text-[9px] text-tuteur-grey-mid">{row.email}</span>
                    </div>
                )
            },
            {
                title: 'Departamento',
                key: 'dept',
                render: (_: any, row: any) => (
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-tuteur-grey">{row.departamento}</span>
                        <span className="text-[9px] text-tuteur-grey-mid">{row.area}</span>
                    </div>
                )
            },
        ];

        return (
            <div className="p-4 space-y-4 bg-slate-50/50">
                {/* CDC Financial Breakdown */}
                {cdcRows.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-red-500" />
                            <span className="text-[10px] font-black uppercase text-tuteur-grey-mid tracking-wider">Desglose Financiero por CDC</span>
                        </div>
                        <Table
                            columns={cdcColumns}
                            dataSource={cdcRows}
                            pagination={false}
                            size="small"
                            bordered
                            className="[&_.ant-table-thead_th]:bg-slate-100/80 [&_.ant-table-thead_th]:text-[9px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-wider"
                        />
                    </div>
                )}

                {/* Enrolled Users */}
                {userRows.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-tuteur-red" />
                            <span className="text-[10px] font-black uppercase text-tuteur-grey-mid tracking-wider">
                                Colaboradores Inscriptos ({userRows.length})
                            </span>
                        </div>
                        <Table
                            columns={userColumns}
                            dataSource={userRows}
                            pagination={false}
                            size="small"
                            className="[&_.ant-table-thead_th]:bg-slate-100/80 [&_.ant-table-thead_th]:text-[9px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400"
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-none shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-tuteur-red">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-tuteur-grey">{cursos?.length || 0}</div>
                                <div className="text-[9px] font-black text-tuteur-grey-mid uppercase tracking-widest">Cursos Activos</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-tuteur-red">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-tuteur-grey">
                                    ${(cursos || []).reduce((sum, c) => sum + Number(c.costo) * (c.users_count || c.users?.length || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-[9px] font-black text-tuteur-grey-mid uppercase tracking-widest">Inversión Total</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none shadow-sm" bodyStyle={{ padding: '16px 20px' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-tuteur-red">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-tuteur-grey">
                                    {enrollments?.data?.length || 0}
                                </div>
                                <div className="text-[9px] font-black text-tuteur-grey-mid uppercase tracking-widest">Matrículas Totales</div>
                            </div>
                        </div>
                    </Card>
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
