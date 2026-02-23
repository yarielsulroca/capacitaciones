import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CourseCard } from '@/components/course-card';
import { Curso, Habilidad, Cdc, Categoria } from '@/types/capacitaciones';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import * as routes from '@/routes';

interface CourseGalleryProps {
    courses: { data: Curso[] };
    habilidades: Habilidad[];
    cdcs: Cdc[];
    categorias: Categoria[];
    filters: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: routes.dashboard().url },
    { title: 'Cursos y Capacitaciones', href: routes.courses_index().url },
];

export default function Index({ courses, habilidades, cdcs, categorias, filters }: CourseGalleryProps) {
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 500);

    const handleFilterChange = (key: string, value: string) => {
        router.get(routes.courses_index({ ...filters, [key]: value, search }).url, {}, {
            preserveState: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            router.get(routes.courses_index({ ...filters, search: debouncedSearch }).url, {}, {
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
                        Catálogo de <span className="bg-clip-text text-transparent bg-linear-to-r from-primary to-indigo-600">Capacitaciones</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        Desarrolla nuevas habilidades y potencia tu carrera profesional en Tuteur.
                    </p>
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
                                {habilidades.map(h => (
                                    <SelectItem key={h.id} value={h.id.toString()}>{h.habilidad}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(val) => handleFilterChange('cdc_id', val)} defaultValue={filters.cdc_id}>
                            <SelectTrigger className="w-[160px] bg-white/50 border-none shadow-sm capitalize">
                                <SelectValue placeholder="Centro de Costo" />
                            </SelectTrigger>
                            <SelectContent>
                                {cdcs.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.cdc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(val) => handleFilterChange('categoria_id', val)} defaultValue={filters.categoria_id}>
                            <SelectTrigger className="w-[160px] bg-white/50 border-none shadow-sm capitalize">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categorias.map(c => (
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
                                onEnroll={(id) => router.post(route('courses.enroll', id))}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-slate-400 text-lg italic">No se encontraron cursos con los filtros seleccionados.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
