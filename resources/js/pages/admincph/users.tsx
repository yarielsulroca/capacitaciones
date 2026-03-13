import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Avatar, Card, Table, Tag, Button, Input, Alert, Tooltip, Select, Modal, Checkbox } from 'antd';
import { useState } from 'react';
import { Loader2, RefreshCw, CheckCircle2, Search, Users, Filter, X, Settings2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface UserView {
    id: number;
    user_id: number;
    view_key: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    cargo?: string;
    pais?: string;
    ciudad?: string;
    oficina?: string;
    id_departamento?: number;
    departamento?: {
        id: number;
        nombre: string;
        area?: {
            nombre: string;
        }
    };
    empresa?: {
        id: number;
        nombre: string;
    };
    area_rel?: {
        id: number;
        nombre: string;
    };
    jefe?: {
        id: number;
        name: string;
    };
    views?: UserView[];
}

interface Metadata {
    roles: string[];
    departamentos: { id: number; nombre: string; area?: { nombre: string } }[];
    areas: { id: number; nombre: string }[];
    jefes: { id: number; name: string }[];
}

// All available views in the system
const AVAILABLE_VIEWS = [
    { key: 'dashboard', label: 'Dashboard', description: 'Panel principal del colaborador', group: 'Colaborador' },
    { key: 'courses', label: 'Catálogo de Cursos', description: 'Vista de cursos disponibles', group: 'Colaborador' },
    { key: 'admin.dashboard', label: 'Admin Dashboard', description: 'Panel administrativo principal', group: 'Administración' },
    { key: 'admin.courses', label: 'Admin Cursos', description: 'Gestión de cursos y matriculaciones', group: 'Administración' },
    { key: 'admin.users', label: 'Admin Usuarios', description: 'Gestión de usuarios y permisos', group: 'Administración' },
    { key: 'admin.structure', label: 'Admin Estructura', description: 'Estructura organizacional y recursos', group: 'Administración' },
    { key: 'admin.metrics', label: 'Admin Métricas', description: 'Reportes y métricas de capacitación', group: 'Administración' },
];

export default function UserIndex({ users, usersWithErrors, metadata }: { users: { data: User[] }, usersWithErrors?: { id: number; name: string; email: string; reason: string }[], metadata: Metadata }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [showErrorUsers, setShowErrorUsers] = useState(false);
    const [filterArea, setFilterArea] = useState<number | undefined>(undefined);
    const [filterDepto, setFilterDepto] = useState<number | undefined>(undefined);
    const [filterJefe, setFilterJefe] = useState<number | undefined>(undefined);

    // Edit permissions modal state
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedViews, setSelectedViews] = useState<string[]>([]);
    const [savingViews, setSavingViews] = useState(false);

    const { flash } = usePage<any>().props;

    const openEditModal = (user: User) => {
        setEditingUser(user);
        const currentViews = (user.views || []).map(v => v.view_key);
        setSelectedViews(currentViews);
    };

    const handleToggleView = (viewKey: string) => {
        setSelectedViews(prev =>
            prev.includes(viewKey)
                ? prev.filter(v => v !== viewKey)
                : [...prev, viewKey]
        );
    };

    const handleSaveViews = async () => {
        if (!editingUser) return;
        setSavingViews(true);
        try {
            await axios.post(`/admin/users/${editingUser.id}/views`, { views: selectedViews });
            toast.success('Permisos actualizados correctamente');
            setEditingUser(null);
            router.reload();
        } catch {
            toast.error('Error al actualizar permisos');
        } finally {
            setSavingViews(false);
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 70,
            render: (id: number) => <span className="font-mono text-xs text-tuteur-grey-mid font-semibold">#{id}</span>
        },
        {
            title: 'Usuario',
            key: 'name',
            dataIndex: 'name',
            sorter: (a: User, b: User) => a.name.localeCompare(b.name),
            render: (text: string, record: User) => (
                <div className="flex items-center gap-2">
                    <Avatar className="bg-tuteur-red" size="small">{record.name.charAt(0)}</Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-tuteur-grey text-sm leading-tight">{record.name}</span>
                        <span className="text-xs text-tuteur-grey-mid">{record.email}</span>
                    </div>
                </div>
            )
        },
        {
            title: 'Cargo / Departamento',
            key: 'cargo',
            render: (_: any, record: User) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-tuteur-grey text-sm">{record.cargo || '—'}</span>
                    <span className="text-xs text-tuteur-grey-mid font-semibold">{record.departamento?.nombre || '—'}</span>
                </div>
            )
        },
        {
            title: 'Área',
            key: 'area',
            render: (_: any, record: User) => <span className="text-xs text-tuteur-grey-mid font-semibold">{record.area_rel?.nombre || '—'}</span>,
        },
        {
            title: 'Empresa / Ubicación',
            key: 'empresa',
            render: (_: any, record: User) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-tuteur-grey text-sm">{record.empresa?.nombre || '—'}</span>
                    <span className="text-xs text-tuteur-grey-mid">
                        {[record.oficina, record.ciudad, record.pais].filter(Boolean).join(', ') || '—'}
                    </span>
                </div>
            )
        },
        {
            title: 'Jefe',
            key: 'jefe',
            render: (_: any, record: User) => <span className="text-xs text-tuteur-grey-mid font-semibold">{record.jefe?.name || '—'}</span>,
        },
        {
            title: 'Rol',
            key: 'role',
            width: 100,
            align: 'center' as const,
            render: (_: any, record: User) => (
                <Tag color={record.role === 'admin' ? 'red' : record.role === 'jefe_area' ? 'default' : record.role === 'jefe_general' ? 'red' : 'default'}
                     className="font-semibold uppercase text-[10px] border-none m-0">
                    {record.role}
                </Tag>
            ),
        },
        {
            title: 'Acciones',
            key: 'acciones',
            width: 90,
            align: 'center' as const,
            render: (_: any, record: User) => (
                <Tooltip title="Editar permisos de vistas">
                    <Button
                        size="small"
                        icon={<Settings2 className="h-3.5 w-3.5" />}
                        onClick={() => openEditModal(record)}
                        className="border-slate-200 text-slate-500 hover:border-tuteur-red! hover:text-tuteur-red! transition-all"
                    />
                </Tooltip>
            ),
        },
    ];

    const filteredUsers = users.data.filter(user => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return user.name.toLowerCase().includes(search) ||
               user.email.toLowerCase().includes(search) ||
               (user.cargo && user.cargo.toLowerCase().includes(search)) ||
               (user.departamento?.nombre && user.departamento.nombre.toLowerCase().includes(search));
    });

    const handleSyncAd = () => {
        setIsSyncing(true);
        router.post('/admin/users/sync-ad', {}, {
            preserveScroll: true,
            onError: (err: any) => {
                alert("Error al sincronizar: " + (err.ldap || "Ocurrió un error inesperado"));
                console.error("Error Sync AD:", err);
            },
            onFinish: () => setIsSyncing(false)
        });
    };

    const applyFilters = () => {
        const params: any = {};
        if (filterArea) params.area_id = filterArea;
        if (filterDepto) params.departamento_id = filterDepto;
        if (filterJefe) params.jefe_id = filterJefe;

        router.get('/admin/users', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterArea(undefined);
        setFilterDepto(undefined);
        setFilterJefe(undefined);
        router.get('/admin/users', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasActiveFilters = filterArea || filterDepto || filterJefe;

    // Filter departamentos based on selected area
    const filteredDeptos = filterArea
        ? (metadata.departamentos || []).filter(d => (d as any).id_area === filterArea)
        : (metadata.departamentos || []);

    const errorUsersList = usersWithErrors || [];

    // Group views by category
    const colaboradorViews = AVAILABLE_VIEWS.filter(v => v.group === 'Colaborador');
    const adminViews = AVAILABLE_VIEWS.filter(v => v.group === 'Administración');

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Usuarios', href: '/admin/users' }]}>
            <Head title="Gestión de Usuarios" />
            <div className="p-4 space-y-4">
                {flash?.success && (
                    <Alert
                        message={flash.success}
                        type="success"
                        showIcon
                        closable
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        className="bg-red-50 text-tuteur-red border-red-200"
                    />
                )}

                {errorUsersList.length > 0 && (
                    <Alert
                        type="warning"
                        showIcon
                        closable
                        message={
                            <div className="flex items-center justify-between w-full">
                                <span className="font-bold">
                                    ⚠ {errorUsersList.length} usuarios con datos incompletos (sin departamento/cargo) — no se muestran en la tabla.
                                </span>
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => setShowErrorUsers(!showErrorUsers)}
                                    className="text-amber-700 font-bold"
                                >
                                    {showErrorUsers ? 'Ocultar Lista' : 'Ver Lista'}
                                </Button>
                            </div>
                        }
                        description={showErrorUsers ? (
                            <div className="mt-2 max-h-48 overflow-y-auto border border-amber-200 rounded-md bg-amber-50/50">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-amber-100">
                                        <tr>
                                            <th className="text-left p-2 font-bold">Nombre</th>
                                            <th className="text-left p-2 font-bold">Email</th>
                                            <th className="text-left p-2 font-bold">Campos Faltantes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {errorUsersList.map((u) => (
                                            <tr key={u.id} className="border-t border-amber-200 hover:bg-amber-100/50">
                                                <td className="p-2 font-medium">{u.name}</td>
                                                <td className="p-2 text-amber-700">{u.email}</td>
                                                <td className="p-2">
                                                    <Tag color="orange" className="text-[9px] uppercase font-bold m-0">{u.reason}</Tag>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : undefined}
                    />
                )}

                {/* Filters bar */}
                <Card size="small" className="tuteur-card" bodyStyle={{ padding: '12px 16px' }}>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-tuteur-grey-mid">
                            <Filter className="h-4 w-4" />
                            <span className="text-xs font-black uppercase tracking-wider">Filtros</span>
                        </div>

                        <Select
                            placeholder="Área"
                            allowClear
                            value={filterArea}
                            onChange={(val) => { setFilterArea(val); setFilterDepto(undefined); }}
                            className="w-44"
                            size="small"
                            options={(metadata.areas || []).map(a => ({ value: a.id, label: a.nombre }))}
                        />

                        <Select
                            placeholder="Departamento"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={filterDepto}
                            onChange={setFilterDepto}
                            className="w-52"
                            size="small"
                            options={filteredDeptos.map(d => ({ value: d.id, label: d.nombre }))}
                        />

                        <Select
                            placeholder="Jefe"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={filterJefe}
                            onChange={setFilterJefe}
                            className="w-52"
                            size="small"
                            options={(metadata.jefes || []).map(j => ({ value: j.id, label: j.name }))}
                        />

                        <Button
                            size="small"
                            onClick={applyFilters}
                            style={{ backgroundColor: '#c8102e', borderColor: '#c8102e', color: '#fff' }}
                            className="font-bold uppercase text-xs px-4"
                        >
                            Aplicar
                        </Button>

                        {hasActiveFilters && (
                            <Button
                                size="small"
                                onClick={clearFilters}
                                icon={<X className="h-3 w-3" />}
                                className="text-tuteur-grey-mid font-bold uppercase text-xs"
                            >
                                Limpiar
                            </Button>
                        )}
                    </div>
                </Card>

                <Card
                    title={
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-red-50 rounded-md flex items-center justify-center">
                                <Users className="h-4 w-4 text-tuteur-red" />
                            </div>
                            <span className="font-bold uppercase tracking-wide">Colaboradores</span>
                            <Tag color="red" className="font-black border-none m-0">{filteredUsers.length}</Tag>
                            {errorUsersList.length > 0 && (
                                <Tag color="orange" className="font-black border-none m-0">{errorUsersList.length} con errores</Tag>
                            )}
                        </div>
                    }
                    className="tuteur-card"
                    extra={
                        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                            <Input
                                prefix={<Search className="h-4 w-4 text-tuteur-grey-mid" />}
                                placeholder="Buscar por nombre, cargo, depto..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full md:w-72"
                            />
                            <Tooltip title="Sincronizar usuarios desde Active Directory (LDAP)">
                                <Button
                                    onClick={handleSyncAd}
                                    disabled={isSyncing}
                                    icon={isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    className="border-tuteur-red text-tuteur-red hover:text-red-700 font-black uppercase text-xs"
                                >
                                    <span className="hidden sm:inline">Sincronizar AD</span>
                                </Button>
                            </Tooltip>
                        </div>
                    }
                >
                    <Table
                        dataSource={filteredUsers}
                        columns={columns}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ['25', '50', '100'], showTotal: (total: number) => `${total} colaboradores` }}
                        className="tuteur-table"
                    />
                </Card>

                {/* Edit Permissions Modal */}
                <Modal
                    open={!!editingUser}
                    onCancel={() => setEditingUser(null)}
                    footer={null}
                    width={640}
                    centered
                    closable={false}
                >
                    <div className="bg-slate-700 py-6 px-8 border-b border-slate-600 rounded-t-xl">
                        <h2 className="text-xl font-semibold text-white uppercase tracking-tight">
                            Permisos de Vistas
                        </h2>
                        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mt-1">
                            {editingUser?.name}
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="flex gap-8">
                            {/* Left: Views checkboxes */}
                            <div className="flex-1 space-y-5">
                                {/* Colaborador views */}
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">Colaborador</h4>
                                    <div className="space-y-2">
                                        {colaboradorViews.map(view => (
                                            <label
                                                key={view.key}
                                                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all cursor-pointer group"
                                            >
                                                <Checkbox
                                                    checked={selectedViews.includes(view.key) || editingUser?.role === 'admin'}
                                                    disabled={editingUser?.role === 'admin' || view.key === 'dashboard'}
                                                    onChange={() => handleToggleView(view.key)}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700">{view.label}</span>
                                                    <span className="text-[10px] text-slate-400">{view.description}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Admin views */}
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">Administración</h4>
                                    <div className="space-y-2">
                                        {adminViews.map(view => (
                                            <label
                                                key={view.key}
                                                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all cursor-pointer group"
                                            >
                                                <Checkbox
                                                    checked={selectedViews.includes(view.key) || editingUser?.role === 'admin'}
                                                    disabled={editingUser?.role === 'admin'}
                                                    onChange={() => handleToggleView(view.key)}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700">{view.label}</span>
                                                    <span className="text-[10px] text-slate-400">{view.description}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Role info */}
                            <div className="w-44 shrink-0">
                                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">Rol Actual</h4>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                                    <Tag color={editingUser?.role === 'admin' ? 'red' : 'default'}
                                         className="font-bold uppercase text-xs border-none">
                                        {editingUser?.role}
                                    </Tag>
                                    {editingUser?.role === 'admin' && (
                                        <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                                            Los administradores tienen acceso total a todas las vistas automáticamente.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-100">
                                    <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                                        <strong>Dashboard</strong> está habilitado por defecto para todos los usuarios.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end gap-3 rounded-b-xl">
                        <Button
                            onClick={() => setEditingUser(null)}
                            className="font-semibold uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl border-2 border-slate-200"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleSaveViews}
                            loading={savingViews}
                            disabled={editingUser?.role === 'admin'}
                            className="bg-tuteur-red hover:bg-tuteur-red-dark! border-none font-semibold uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl shadow-md"
                        >
                            Guardar Permisos
                        </Button>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
