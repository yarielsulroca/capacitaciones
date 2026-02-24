import { CourseCard } from '@/components/course-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Categoria, Cdc, Curso, Habilidad } from '@/types/capacitaciones';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Search, SlidersHorizontal, Loader2, BookOpen, Award, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
            modalidad: curso.modalidad || 'Presencial',
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
        .catch(() => toast.error('Error al matricular colaborador'));
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar cursos..."
                            className="pl-10 bg-white/50 border-none shadow-inner focus-visible:ring-primary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 items-center overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        <Select onValueChange={(val) => handleFilterChange('habilidad_id', val)} defaultValue={filters.habilidad_id}>
                            <SelectTrigger className="w-[160px] bg-white/50 border-none shadow-sm capitalize">
                                <SelectValue placeholder="Habilidad" />
                            </SelectTrigger>
                            <SelectContent>
                                {metadata?.habilidades.map(h => (
                                    <SelectItem key={h.id} value={h.id.toString()}>{h.habilidad}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(val) => handleFilterChange('cdc_id', val)} defaultValue={filters.cdc_id}>
                            <SelectTrigger className="w-[160px] bg-white/50 border-none shadow-sm capitalize">
                                <SelectValue placeholder="Centro de Costo" />
                            </SelectTrigger>
                            <SelectContent>
                                {metadata?.cdcs.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.cdc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(val) => handleFilterChange('categoria_id', val)} defaultValue={filters.categoria_id}>
                            <SelectTrigger className="w-[160px] bg-white/50 border-none shadow-sm capitalize">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {metadata?.categorias.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.categoria}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="ghost" size="icon" className="shrink-0 hover:bg-white/50">
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

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl bg-white border-2 border-slate-200 shadow-2xl overflow-hidden p-0 rounded-2xl">
                    <div className="bg-slate-900 py-6 px-8 border-b border-slate-800">
                        <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">
                            Configuración del Curso
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Administración de Capacitación Tuteur
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleUpdate} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex justify-between">
                                    Nombre del Curso
                                    {errors.nombre && <span className="text-red-500 lowercase">{errors.nombre}</span>}
                                </Label>
                                <Input
                                    value={data.nombre}
                                    onChange={e => setData('nombre', e.target.value)}
                                    className="h-12 border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700 rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Cupos Disponibles</Label>
                                <Input
                                    type="number"
                                    value={data.capacidad}
                                    onChange={e => setData('capacidad', parseInt(e.target.value))}
                                    className="h-12 border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Descripción del Programa</Label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-xl border-2 border-slate-100 bg-background px-4 py-3 text-sm font-medium ring-offset-background placeholder:text-muted-foreground focus:border-primary transition-all outline-none"
                                value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                placeholder="Escribe aquí los objetivos y alcance de la capacitación..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Fecha de Inicio</Label>
                                <Input
                                    type="date"
                                    value={data.inicio}
                                    onChange={e => setData('inicio', e.target.value)}
                                    className="h-12 border-2 border-slate-100 focus:border-primary transition-all font-bold rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Fecha de Cierre</Label>
                                <Input
                                    type="date"
                                    value={data.fin}
                                    onChange={e => setData('fin', e.target.value)}
                                    className="h-12 border-2 border-slate-100 focus:border-primary transition-all font-bold rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Habilidad</Label>
                                <Select value={data.id_habilidad} onValueChange={val => setData('id_habilidad', val)}>
                                    <SelectTrigger className="h-12 border-2 border-slate-100 font-bold rounded-xl">
                                        <SelectValue placeholder="Elegir..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {metadata?.habilidades.map(h => (
                                            <SelectItem key={h.id} value={h.id.toString()}>{h.habilidad}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Categoría</Label>
                                <Select value={data.id_categoria} onValueChange={val => setData('id_categoria', val)}>
                                    <SelectTrigger className="h-12 border-2 border-slate-100 font-bold rounded-xl">
                                        <SelectValue placeholder="Elegir..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {metadata?.categorias.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.categoria}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Centro de Costo</Label>
                                <Select value={data.id_cdc} onValueChange={val => setData('id_cdc', val)}>
                                    <SelectTrigger className="h-12 border-2 border-slate-100 font-bold rounded-xl">
                                        <SelectValue placeholder="Elegir..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {metadata?.cdcs.map(cdc => (
                                            <SelectItem key={cdc.id} value={cdc.id.toString()}>{cdc.cdc}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Programa Asociado</Label>
                                <Select value={data.id_programa_asociado} onValueChange={val => setData('id_programa_asociado', val)}>
                                    <SelectTrigger className="h-12 border-2 border-slate-100 font-bold rounded-xl">
                                        <SelectValue placeholder="Sin programa" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="null">Ninguno</SelectItem>
                                        {metadata?.programas?.map(p => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.programa}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border-2 border-slate-100">
                            <input
                                type="checkbox"
                                id="publicado"
                                checked={data.publicado}
                                onChange={e => setData('publicado', e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-slate-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="publicado" className="text-sm font-black uppercase text-slate-600 tracking-wide cursor-pointer">
                                Publicar curso en el Dashboard y Catálogo
                            </Label>
                        </div>

                        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 mt-4 border-t-2 border-slate-50">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-12 px-8 font-black uppercase text-[11px] tracking-widest border-2 rounded-xl hover:bg-slate-50">
                                Cancelar y Salir
                            </Button>
                            <Button type="submit" disabled={processing} className="h-12 px-12 font-black uppercase text-[11px] tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-xl active:scale-95 transition-all">
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : 'Actualizar Capacitación'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Añadir Colaboradores */}
            <Dialog open={isManagingUsers} onOpenChange={(open) => { setIsManagingUsers(open); if(!open) setSelectedCourse(null); }}>
                <DialogContent className="max-w-xl bg-white border-2 border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
                    <div className="bg-slate-900 py-6 px-8 border-b border-slate-800">
                        <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">
                            Añadir Colaboradores
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                            {selectedCourse?.nombre}
                        </DialogDescription>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar colaborador por nombre o email..."
                                className="pl-10 h-11 border-2 focus:border-primary rounded-xl"
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
                                                    size="sm"
                                                    className="h-8 px-4 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md"
                                                    onClick={() => handleManualEnroll(u.id)}
                                                >
                                                    Matricular
                                                </Button>
                                            </div>
                                        ))}
                                        {availableUsers.length === 0 && <p className="text-center py-10 text-slate-400 text-sm italic">No se encontraron colaboradores.</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end">
                        <Button variant="outline" onClick={() => setIsManagingUsers(false)} className="font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl">
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Gestión de Matrículas */}
            <Dialog open={isManagingEnrollments} onOpenChange={(open) => { setIsManagingEnrollments(open); if(!open) setSelectedCourse(null); }}>
                <DialogContent className="max-w-4xl bg-white border-2 border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
                    <div className="bg-slate-900 py-6 px-8 border-b border-slate-800 flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">
                                Gestión de Matrículas
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                {selectedCourse?.nombre}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                <span className="text-[9px] font-black text-amber-500 uppercase italic">{enrollments.filter(e => e.estado === 'solicitado').length} Solicitados</span>
                            </div>
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="text-[9px] font-black text-emerald-500 uppercase italic">{enrollments.filter(e => e.estado === 'matriculado').length} Matriculados</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-0">
                        <div className="w-full overflow-x-auto min-h-[300px]">
                            {loadingEnrollments ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                            ) : (
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-50/50 border-b-2 border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">Colaborador</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">Área / Cargo</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-slate-50">
                                        {enrollments.map(enrollment => (
                                            <tr key={enrollment.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">{enrollment.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{enrollment.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{enrollment.area || 'N/A'}</span>
                                                        <span className="text-[9px] text-slate-400 font-medium uppercase">{enrollment.cargo || 'Sin cargo'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={cn(
                                                        "px-2 py-1 text-[9px] font-black uppercase rounded-md border",
                                                        enrollment.estado === 'solicitado' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                        enrollment.estado === 'matriculado' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                        "bg-slate-100 text-slate-600 border-slate-200"
                                                    )}>
                                                        {enrollment.estado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {/* We could add status update buttons here directly using the existing api/admin/enrollments/update-status */}
                                                        {enrollment.estado === 'solicitado' && (
                                                            <Button
                                                                size="sm"
                                                                className="h-7 px-3 text-[9px] font-black uppercase bg-primary text-white"
                                                                onClick={() => {
                                                                    router.post('/admin/enrollments/update-status', {
                                                                        user_id: enrollment.id,
                                                                        curso_id: selectedCourse?.id,
                                                                        estado_slug: 'matriculado'
                                                                    }, {
                                                                        onSuccess: () => {
                                                                            toast.success("Estado actualizado");
                                                                            // Refresh the list
                                                                            fetch(`/admin/courses/${selectedCourse?.id}/enrollments`)
                                                                                .then(res => res.json())
                                                                                .then(data => setEnrollments(data));
                                                                        }
                                                                    });
                                                                }}
                                                            >
                                                                Aprobar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {enrollments.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm italic">
                                                    No hay inscritos en este curso todavía.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end">
                        <Button variant="outline" onClick={() => setIsManagingEnrollments(false)} className="font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl">
                            Cerrar Panel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
