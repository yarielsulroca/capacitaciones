import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { BookOpen, Award, TrendingUp, ArrowRight, GraduationCap, ShieldCheck, Clock, Trash2 } from 'lucide-react';
import { CourseCard } from '@/components/course-card';
import { Curso, EnrollmentStatus } from '@/types/capacitaciones';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    stats: {
        available: number;
        solicitado: number;
        matriculado: number;
        cancelado: number;
        terminado: number;
        incompleto: number;
        certificado: number;
    };
    featured: (Curso & { status?: EnrollmentStatus })[];
    activeStatus?: string;
}

export default function Dashboard({ stats, featured, activeStatus }: DashboardProps) {
    const { auth, flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            alert(flash.success);
        }
        if (flash?.error) {
            alert(flash.error);
        }
    }, [flash]);

    const handleEnroll = (id: number) => {
        router.post(`/courses/${id}/enroll`, {}, {
            preserveScroll: true,
        });
    };

    const handleCancel = (id: number) => {
        router.post(`/courses/${id}/cancelado`, {}, {
            preserveScroll: true,
        });
    };

    const handleFilter = (status: string | null) => {
        if (!status) {
            router.get('/dashboard');
            return;
        }
        router.get('/dashboard', { status }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-8 p-6 lg:p-10 w-full">

                {/* Welcome Header */}
                <header className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            ¡Hola, {auth.user.name.split(' ')[0]}! 👋
                        </h1>
                        <p className="mt-2 text-slate-500 max-w-xl text-lg">
                            Bienvenido a tu panel de capacitaciones. Aquí podrás gestionar tu crecimiento profesional y descubrir nuevas oportunidades de aprendizaje.
                        </p>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#E30613]/5 rounded-full blur-3xl opacity-50" />
                </header>

                {/* Stats Grid - Interactive cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                    {/* Disponibles */}
                    <button
                        onClick={() => handleFilter(null)}
                        className={cn(
                            "group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm border transition-all hover:shadow-md",
                            !activeStatus ? "border-red-500 ring-2 ring-red-50" : "border-slate-100 hover:border-red-100"
                        )}
                    >
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="rounded-lg bg-red-50 p-2 text-[#E30613]">
                                <BookOpen size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{stats.available}</h3>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disponibles</p>
                        </div>
                    </button>

                    {/* Solicitado */}
                    <button
                        onClick={() => handleFilter('solicitado')}
                        className={cn(
                            "group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm border transition-all hover:shadow-md",
                            activeStatus === 'solicitado' ? "border-amber-500 ring-2 ring-amber-50" : "border-slate-100 hover:border-amber-100"
                        )}
                    >
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                                <Clock size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{stats.solicitado}</h3>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitado</p>
                        </div>
                    </button>

                    {/* Matriculado */}
                    <button
                        onClick={() => handleFilter('matriculado')}
                        className={cn(
                            "group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm border transition-all hover:shadow-md",
                            activeStatus === 'matriculado' ? "border-blue-500 ring-2 ring-blue-50" : "border-slate-100 hover:border-blue-100"
                        )}
                    >
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <GraduationCap size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{stats.matriculado}</h3>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matriculado</p>
                        </div>
                    </button>

                    {/* Terminado */}
                    <button
                        onClick={() => handleFilter('terminado')}
                        className={cn(
                            "group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm border transition-all hover:shadow-md",
                            activeStatus === 'terminado' ? "border-emerald-500 ring-2 ring-emerald-50" : "border-slate-100 hover:border-emerald-100"
                        )}
                    >
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{stats.terminado}</h3>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Terminado</p>
                        </div>
                    </button>

                    {/* Certificado */}
                    <button
                        onClick={() => handleFilter('certificado')}
                        className={cn(
                            "group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm border transition-all hover:shadow-md",
                            activeStatus === 'certificado' ? "border-violet-500 ring-2 ring-violet-50" : "border-slate-100 hover:border-violet-100"
                        )}
                    >
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                                <Award size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{stats.certificado}</h3>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificado</p>
                        </div>
                    </button>

                    {/* Incompleto */}
                    <button
                        onClick={() => handleFilter('incompleto')}
                        className={cn(
                            "group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm border transition-all hover:shadow-md",
                            activeStatus === 'incompleto' ? "border-slate-500 ring-2 ring-slate-50" : "border-slate-100 hover:border-slate-200"
                        )}
                    >
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="rounded-lg bg-slate-50 p-2 text-slate-600">
                                <ArrowRight className="rotate-45" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{stats.incompleto}</h3>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incompleto</p>
                        </div>
                    </button>

                    {/* Cancelado */}
                    <button
                        onClick={() => handleFilter('cancelado')}
                        className={cn(
                            "group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm border transition-all hover:shadow-md",
                            activeStatus === 'cancelado' ? "border-rose-500 ring-2 ring-rose-50" : "border-slate-100 hover:border-rose-100"
                        )}
                    >
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{stats.cancelado}</h3>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancelado</p>
                        </div>
                    </button>
                </div>

                {/* Featured Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {activeStatus ? `Mis Cursos: ${activeStatus}` : 'Oferta Académica'}
                            </h2>
                            {activeStatus && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                                    Filtrado
                                </span>
                            )}
                        </div>

                        {!activeStatus && (
                            <Link href="/courses" className="text-sm font-semibold text-[#E30613] hover:underline flex items-center gap-1">
                                Ver todos <ArrowRight size={14} />
                            </Link>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(Array.isArray(featured) ? featured : []).map((curso) => (
                            <CourseCard
                                key={curso.id}
                                curso={curso}
                                status={curso.status}
                                onEnroll={handleEnroll}
                                onCancel={handleCancel}
                            />
                        ))}
                        {(!Array.isArray(featured) || featured.length === 0) && (
                            <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-100 mb-4">
                                    <BookOpen className="text-slate-300" size={32} />
                                </div>
                                <p className="text-slate-500 font-bold">No se encontraron cursos con el estado "{activeStatus}".</p>
                                <button
                                    onClick={() => handleFilter(null)}
                                    className="mt-4 text-sm font-bold text-[#E30613] hover:underline"
                                >
                                    Ver todas las ofertas
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
