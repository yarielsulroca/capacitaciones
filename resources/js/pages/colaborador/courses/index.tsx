import { CourseCard } from '@/components/course-card';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Categoria, Cdc, Curso, Habilidad } from '@/types/capacitaciones';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Search, SlidersHorizontal, Loader2, BookOpen, Award, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button, Input, Select, Switch, Table } from 'antd';

const { TextArea } = Input;

interface CourseGalleryProps {
    courses: { data: Curso[] };
    filters: any;
    stats: {
        total_cursos: number;
        total_habilidades: number;
        total_categorias: number;
        total_programas: number;
    };
}

interface Metadata {
    habilidades: Habilidad[];
    categorias: Categoria[];
    cdcs: Cdc[];
    programas: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Cursos y Capacitaciones', href: '/courses' },
];

export default function Index({ courses, filters, metadata, stats }: CourseGalleryProps & { metadata: Metadata }) {
    const { auth } = usePage().props as any;

    // For development, we force admin mode as requested to bypass role restrictions
    const isAdmin = true;

    const [isEditing, setIsEditing] = useState(false);
    const [isManagingUsers, setIsManagingUsers] = useState(false);
    const [isManagingEnrollments, setIsManagingEnrollments] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Curso | null>(null);

    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const debouncedUserSearch = useDebounce(userSearch, 500);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const { data, setData, patch, processing, reset, errors } = useForm({
        id: 0,
        nombre: '',
        descripcion: '',
        inicio: '',
        fin: '',
        capacidad: 0,
        cant_horas: 0,
        modalidad: 'Presencial',
        id_habilidad: '',
        id_categoria: '',
        id_cdc: '',
        id_programa_asociado: '',
        publicado: true
    });

    const handleEdit = (curso: Curso) => {
        setData({
            id: curso.id,
            nombre: curso.nombre,
            descripcion: curso.descripcion || '',
            inicio: curso.inicio || '',
            fin: curso.fin || '',
            capacidad: curso.capacidad || 0,
            cant_horas: curso.cant_horas || 0,
            modalidad: typeof curso.modalidad === 'object' ? curso.modalidad?.modalidad || 'Presencial' : curso.modalidad || 'Presencial',
            id_habilidad: (curso as any).id_habilidad?.toString() || '',
            id_categoria: (curso as any).id_categoria?.toString() || '',
            id_cdc: (curso as any).id_cdc?.toString() || '',
            id_programa_asociado: (curso as any).id_programa_asociado?.toString() || '',
            publicado: (curso as any).publicado ?? true
        });
        setIsEditing(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/admin/courses/${data.id}`, {
            onSuccess: () => {
                setIsEditing(false);
                toast.success('Curso actualizado correctamente');
            },
            onError: () => toast.error('Error al actualizar el curso'),
            preserveScroll: true
        });
    };

    // Fetch Enrollments when modal opens
    useEffect(() => {
        if (isManagingEnrollments && selectedCourse) {
            setLoadingEnrollments(true);
            fetch(`/admin/courses/${selectedCourse.id}/enrollments`)
                .then(res => res.json())
                .then(data => setEnrollments(data))
                .finally(() => setLoadingEnrollments(false));
        } else {
            setEnrollments([]);
        }
    }, [isManagingEnrollments, selectedCourse]);

    // Fetch Users when search modal opens or search changes
    useEffect(() => {
        if (isManagingUsers) {
            setLoadingUsers(true);
            fetch(`/admin/users/list?search=${debouncedUserSearch}`)
                .then(res => res.json())
                .then(data => setAvailableUsers(data.data || [])) // Handle pagination if needed
                .finally(() => setLoadingUsers(false));
        }
    }, [isManagingUsers, debouncedUserSearch]);

    const handleManualEnroll = (userId: number) => {
        if (!selectedCourse) return;

        fetch(`/admin/courses/${selectedCourse.id}/enroll-manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content },
            body: JSON.stringify({ user_id: userId })
        })
        .then(res => res.json())
        .then(res => {
            toast.success(res.message);
            // Optionally refresh the list if both modals are related, but for now just success
        })
        .catch(() => toast.error('Error al inscribir colaborador'));
    };

    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 500);

    const handleFilterChange = (key: string, value: string) => {
        const cleanFilters = { ...filters, [key]: value, search };
        const params = new URLSearchParams();
        Object.entries(cleanFilters).forEach(([k, v]) => {
            if (v && v !== 'null') params.append(k, v as string);
        });

        router.get(`/courses?${params.toString()}`, {}, {
            preserveState: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            const cleanFilters = { ...filters, search: debouncedSearch };
            const params = new URLSearchParams();
            Object.entries(cleanFilters).forEach(([k, v]) => {
                if (v && v !== 'null') params.append(k, v as string);
            });

            router.get(`/courses?${params.toString()}`, {}, {
                preserveState: true,
                replace: true,
            });
        }
    }, [debouncedSearch]);

    const enrollmentColumns = [
        { title: 'Colaborador', key: 'colaborador', render: (_: any, r: any) => (
            <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">{r.name}</span>
                <span className="text-[10px] text-slate-400 font-medium">{r.email}</span>
            </div>
        )},
        { title: 'Área / Cargo', key: 'area', render: (_: any, r: any) => (
            <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{r.area || 'N/A'}</span>
                <span className="text-[9px] text-slate-400 font-medium uppercase">{r.cargo || 'Sin cargo'}</span>
            </div>
        )},
        { title: 'Estado', key: 'estado', align: 'center' as const, render: (_: any, r: any) => (
            <span className={cn(
                "px-2 py-1 text-[9px] font-black uppercase rounded-md border",
                r.estado === 'solicitado' ? "bg-amber-100 text-amber-700 border-amber-200" :
                r.estado === 'matriculado' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                "bg-slate-100 text-slate-600 border-slate-200"
            )}>
                {r.estado}
            </span>
        )},
        { title: 'Acciones', key: 'acciones', align: 'right' as const, render: (_: any, r: any) => (
            r.estado === 'solicitado' ? (
                <Button
                    size="small"
                    type="primary"
                    className="bg-primary text-white border-none font-black uppercase text-[10px] px-3 h-7 rounded-md"
                    onClick={() => {
                        router.post('/admin/enrollments/update-status', {
                            user_id: r.id,
                            curso_id: selectedCourse?.id,
                            estado_slug: 'matriculado'
                        }, {
                            onSuccess: () => {
                                toast.success("Estado actualizado");
                                fetch(`/admin/courses/${selectedCourse?.id}/enrollments`)
                                    .then(res => res.json())
                                    .then(data => setEnrollments(data));
                            }
                        });
                    }}
                >
                    Aprobar
                </Button>
            ) : null
        )}
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cursos" />

            <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        Catálogo y <span className="bg-clip-text text-transparent bg-linear-to-r from-primary to-indigo-600">Gestión de Cursos</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        Explora nuestra oferta académica y gestiona las capacitaciones de tu equipo en un solo lugar.
                    </p>
                </div>

                {/* Summary Cards Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Total Courses */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-primary/20">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-red-50 p-3 text-primary">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{stats?.total_cursos || 0}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cursos Totales</p>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Total Skills */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-amber-200/50">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                <Award size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{stats?.total_habilidades || 0}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Habilidades</p>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Total Categories */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-indigo-200/50">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{stats?.total_categorias || 0}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categorías</p>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Glassmorphism Filter Bar */}
                <div className="sticky top-4 z-10 backdrop-blur-xl bg-white/70 border border-white/20 shadow-premium-sm rounded-2xl p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <Input
                            placeholder="Buscar cursos..."
                            className="pl-10 h-10 bg-white/50 border-none shadow-inner rounded-xl w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 items-center overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        <Select
                            className="w-[160px]"
                            size="large"
                            value={filters.habilidad_id || undefined}
                            onChange={(val) => handleFilterChange('habilidad_id', val)}
                            placeholder="Habilidad"
                            allowClear
                        >
                            {metadata?.habilidades.map(h => (
                                <Select.Option key={h.id} value={h.id.toString()}>{h.habilidad}</Select.Option>
                            ))}
                        </Select>

                        <Select
                            className="w-[160px]"
                            size="large"
                            value={filters.cdc_id || undefined}
                            onChange={(val) => handleFilterChange('cdc_id', val)}
                            placeholder="Centro de Costo"
                            allowClear
                        >
                            {metadata?.cdcs.map(c => (
                                <Select.Option key={c.id} value={c.id.toString()}>{c.cdc}</Select.Option>
                            ))}
                        </Select>

                        <Select
                            className="w-[160px]"
                            size="large"
                            value={filters.categoria_id || undefined}
                            onChange={(val) => handleFilterChange('categoria_id', val)}
                            placeholder="Categoría"
                            allowClear
                        >
                            {metadata?.categorias.map(c => (
                                <Select.Option key={c.id} value={c.id.toString()}>{c.categoria}</Select.Option>
                            ))}
                        </Select>

                        <Button type="text" className="shrink-0 hover:bg-white/50 h-10 w-10 p-0 flex items-center justify-center">
                            <SlidersHorizontal className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.data.length > 0 ? (
                        courses.data.map(curso => (
                            <CourseCard
                                key={curso.id}
                                curso={curso}
                                isAdmin={isAdmin}
                                onEdit={handleEdit}
                                onManageUsers={(c) => { setSelectedCourse(c); setIsManagingUsers(true); }}
                                onManageEnrollments={(c) => { setSelectedCourse(c); setIsManagingEnrollments(true); }}
                                onEnroll={(id) => router.post(`/courses/${id}/enroll`)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-slate-400 text-lg italic">No se encontraron cursos con los filtros seleccionados.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal open={isEditing} onCancel={() => setIsEditing(false)} footer={null} width={700} className="p-0" centered closable={false}>
                <div className="bg-slate-900 py-6 px-8 border-b border-slate-800 rounded-t-xl relative">
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                        Configuración del Curso
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Administración de Capacitación Tuteur
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex justify-between">
                                Nombre del Curso
                                {errors.nombre && <span className="text-red-500 lowercase">{errors.nombre}</span>}
                            </label>
                            <Input
                                value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                className="h-12 border-2 border-slate-100 hover:border-primary focus:border-primary transition-all font-bold text-slate-700 rounded-xl"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Cupos Disponibles</label>
                            <Input
                                type="number"
                                value={data.capacidad}
                                onChange={e => setData('capacidad', parseInt(e.target.value))}
                                className="h-12 border-2 border-slate-100 hover:border-primary focus:border-primary transition-all font-bold text-slate-700 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Descripción del Programa</label>
                        <TextArea
                            className="rounded-xl border-2 border-slate-100 bg-background px-4 py-3 text-sm font-medium hover:border-primary focus:border-primary transition-all"
                            value={data.descripcion}
                            onChange={e => setData('descripcion', e.target.value)}
                            placeholder="Escribe aquí los objetivos y alcance de la capacitación..."
                            autoSize={{ minRows: 4, maxRows: 6 }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Fecha de Inicio</label>
                            <Input
                                type="date"
                                value={data.inicio}
                                onChange={e => setData('inicio', e.target.value)}
                                className="h-12 border-2 border-slate-100 font-bold rounded-xl"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Fecha de Cierre</label>
                            <Input
                                type="date"
                                value={data.fin}
                                onChange={e => setData('fin', e.target.value)}
                                className="h-12 border-2 border-slate-100 font-bold rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Habilidad</label>
                            <Select
                                value={data.id_habilidad || undefined}
                                onChange={val => setData('id_habilidad', val)}
                                className="w-full h-12"
                                placeholder="Elegir..."
                            >
                                {metadata?.habilidades.map(h => (
                                    <Select.Option key={h.id} value={h.id.toString()}>{h.habilidad}</Select.Option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Categoría</label>
                            <Select
                                value={data.id_categoria || undefined}
                                onChange={val => setData('id_categoria', val)}
                                className="w-full h-12"
                                placeholder="Elegir..."
                            >
                                {metadata?.categorias.map(c => (
                                    <Select.Option key={c.id} value={c.id.toString()}>{c.categoria}</Select.Option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Centro de Costo</label>
                            <Select
                                value={data.id_cdc || undefined}
                                onChange={val => setData('id_cdc', val)}
                                className="w-full h-12"
                                placeholder="Elegir..."
                            >
                                {metadata?.cdcs.map(cdc => (
                                    <Select.Option key={cdc.id} value={cdc.id.toString()}>{cdc.cdc}</Select.Option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Programa Asociado</label>
                            <Select
                                value={data.id_programa_asociado === 'null' ? undefined : data.id_programa_asociado}
                                onChange={val => setData('id_programa_asociado', val)}
                                className="w-full h-12"
                                placeholder="Sin programa"
                                allowClear
                            >
                                {metadata?.programas?.map(p => (
                                    <Select.Option key={p.id} value={p.id.toString()}>{p.programa}</Select.Option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border-2 border-slate-100">
                        <Switch
                            checked={data.publicado}
                            onChange={c => setData('publicado', c)}
                        />
                        <label className="text-sm font-black uppercase text-slate-600 tracking-wide cursor-pointer">
                            Publicar curso en el Dashboard y Catálogo
                        </label>
                    </div>

                    <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 mt-4 border-t-2 border-slate-50">
                        <Button onClick={() => setIsEditing(false)} className="h-12 px-8 font-black uppercase text-[11px] tracking-widest border-2 rounded-xl hover:bg-slate-50">
                            Cancelar y Salir
                        </Button>
                        <Button type="primary" htmlType="submit" loading={processing} className="h-12 px-12 font-black uppercase text-[11px] tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-xl transition-all border-none">
                            Actualizar Capacitación
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Añadir Colaboradores */}
            <Modal open={isManagingUsers} onCancel={() => { setIsManagingUsers(false); setSelectedCourse(null); }} footer={null} width={600} className="p-0" centered closable={false}>
                <div className="bg-slate-900 py-6 px-8 border-b border-slate-800 rounded-t-xl">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                        Añadir Colaboradores
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                        {selectedCourse?.nombre}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <Input
                            placeholder="Buscar colaborador por nombre o email..."
                            className="pl-10 h-11 border-2 focus:border-primary rounded-xl w-full hover:border-primary"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 scrollbar-thin min-h-[100px]">
                        {loadingUsers ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <>
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-4 px-1">Resultados de búsqueda ({availableUsers.length})</p>
                                <div className="space-y-2">
                                    {availableUsers.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{u.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{u.email}</span>
                                            </div>
                                            <Button
                                                type="primary"
                                                className="h-8 px-4 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md border-none"
                                                onClick={() => handleManualEnroll(u.id)}
                                            >
                                                Inscribir
                                            </Button>
                                        </div>
                                    ))}
                                    {availableUsers.length === 0 && <p className="text-center py-10 text-slate-400 text-sm italic">No se encontraron colaboradores.</p>}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end rounded-b-xl">
                    <Button onClick={() => setIsManagingUsers(false)} className="font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl border-2 border-slate-200">
                        Cerrar
                    </Button>
                </div>
            </Modal>

            {/* Modal: Gestión de Matrículas */}
            <Modal open={isManagingEnrollments} onCancel={() => { setIsManagingEnrollments(false); setSelectedCourse(null); }} footer={null} width={800} className="p-0" centered closable={false}>
                <div className="bg-slate-900 py-6 px-8 border-b border-slate-800 flex justify-between items-center rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">
                            Gestión de Matrículas
                        </h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                            {selectedCourse?.nombre}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <span className="text-[9px] font-black text-amber-500 uppercase italic">{enrollments.filter(e => e.estado === 'solicitado').length} Solicitados</span>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="text-[9px] font-black text-emerald-500 uppercase italic">{enrollments.filter(e => e.estado === 'matriculado').length} Inscriptos</span>
                        </div>
                    </div>
                </div>

                <div className="p-0">
                    <div className="w-full min-h-[300px]">
                        {loadingEnrollments ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <Table
                                columns={enrollmentColumns}
                                dataSource={enrollments}
                                rowKey="id"
                                pagination={false}
                                className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[10px] [&_.ant-table-thead_th]:font-black [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-wider"
                                size="small"
                                scroll={{ y: 300 }}
                            />
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end rounded-b-xl">
                    <Button onClick={() => setIsManagingEnrollments(false)} className="font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl border-2 border-slate-200">
                        Cerrar Panel
                    </Button>
                </div>
            </Modal>
        </AppLayout>
    );
}
