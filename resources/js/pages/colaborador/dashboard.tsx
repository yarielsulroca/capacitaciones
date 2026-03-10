import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { BookOpen, Award, TrendingUp, ArrowRight, GraduationCap, ShieldCheck, Clock, Trash2, Calendar, Laptop, Users, Tag, Building2, X, FileText } from 'lucide-react';
import { CourseCard } from '@/components/course-card';
import { Curso, EnrollmentStatus } from '@/types/capacitaciones';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from 'antd';

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
    const [selectedCurso, setSelectedCurso] = useState<(Curso & { status?: EnrollmentStatus }) | null>(null);

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

                    {/* Inscripto */}
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
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inscripto</p>
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
                                onClick={(c) => setSelectedCurso(c as Curso & { status?: EnrollmentStatus })}
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

                {/* Course Details Modal */}
                <Modal
                    open={!!selectedCurso}
                    onCancel={() => setSelectedCurso(null)}
                    footer={null}
                    width={640}
                    centered
                    destroyOnClose
                    closable={false}
                    styles={{ body: { padding: 0 } }}
                >
                    {selectedCurso && (() => {
                        const c = selectedCurso;
                        const modalidad = typeof c.modalidad === 'object' ? (c.modalidad as any)?.modalidad : c.modalidad || 'Presencial';
                        const tipo = typeof c.tipo === 'object' ? (c.tipo as any)?.tipo : c.tipo;
                        const formatDate = (val: string | null | undefined) => {
                            if (!val) return '—';
                            try { return new Date(val).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }); }
                            catch { return val; }
                        };
                        const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => {
                            if (!value || value === '—') return null;
                            return (
                                <div className="flex items-start gap-3 py-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Icon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">{label}</span>
                                        <div className="text-sm font-medium text-slate-700 leading-snug mt-0.5">{value}</div>
                                    </div>
                                </div>
                            );
                        };
                        return (
                            <>
                                {/* Dark Header */}
                                <div className="bg-linear-to-br from-slate-800 to-slate-900 px-6 py-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/3 rounded-full -translate-y-12 translate-x-12" />
                                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/2 rounded-full translate-y-8 -translate-x-6" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex-1">
                                            <h2 className="text-xl font-semibold text-white leading-snug tracking-tight pr-8">
                                                {c.nombre}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-white/80 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md">
                                                    {modalidad}
                                                </span>
                                                {(c.cant_horas ?? 0) > 0 && (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                                        <Clock className="w-3 h-3" /> {c.cant_horas}h
                                                    </span>
                                                )}
                                                {c.certificado && (
                                                    <span className="inline-flex items-center gap-1 bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                                        <Award className="w-3 h-3" /> Certificado
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedCurso(null)} className="text-white/50 hover:text-white transition-colors p-1">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                                    {/* Description */}
                                    {c.descripcion && (
                                        <div className="mb-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Descripción</span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                {c.descripcion}
                                            </p>
                                        </div>
                                    )}

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-slate-100">
                                        <div className="space-y-0 divide-y divide-slate-100">
                                            <InfoRow icon={Calendar} label="Fecha de Inicio" value={formatDate(c.inicio)} />
                                            <InfoRow icon={Calendar} label="Fecha de Fin" value={formatDate(c.fin)} />
                                            <InfoRow icon={Clock} label="Duración" value={c.cant_horas ? `${c.cant_horas} horas` : null} />
                                            <InfoRow icon={Laptop} label="Modalidad" value={modalidad} />
                                            <InfoRow icon={Users} label="Capacidad" value={c.capacidad > 0 ? `${c.capacidad} participantes` : null} />
                                        </div>
                                        <div className="space-y-0 divide-y divide-slate-100">
                                            <InfoRow icon={Building2} label="Proveedor" value={c.proveedor as string} />
                                            <InfoRow icon={GraduationCap} label="Instructores" value={c.instructores as string} />
                                            <InfoRow icon={Tag} label="Categoría" value={c.categoria as string} />
                                            <InfoRow icon={TrendingUp} label="Habilidad" value={c.habilidad as string} />
                                            <InfoRow icon={BookOpen} label="Tipo" value={tipo} />
                                        </div>
                                    </div>

                                    {/* Horarios */}
                                    {c.horarios && c.horarios.length > 0 && (
                                        <div className="mt-5 pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Horarios</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {c.horarios.map((h, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg">
                                                        <span className="font-semibold">{h.dia}</span>
                                                        <span className="text-blue-400">·</span>
                                                        {h.hora}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Extra info */}
                                    {(c.jornadas || c.anio_formacion || c.mes_formacion || c.programa) && (
                                        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {c.jornadas && (
                                                <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
                                                    <div className="text-[9px] font-semibold uppercase text-slate-400">Jornadas</div>
                                                    <div className="text-sm font-semibold text-slate-700 mt-0.5">{c.jornadas}</div>
                                                </div>
                                            )}
                                            {c.anio_formacion && (
                                                <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
                                                    <div className="text-[9px] font-semibold uppercase text-slate-400">Año</div>
                                                    <div className="text-sm font-semibold text-slate-700 mt-0.5">{c.anio_formacion}</div>
                                                </div>
                                            )}
                                            {c.mes_formacion && (
                                                <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
                                                    <div className="text-[9px] font-semibold uppercase text-slate-400">Mes</div>
                                                    <div className="text-sm font-semibold text-slate-700 mt-0.5">{c.mes_formacion}</div>
                                                </div>
                                            )}
                                            {c.programa && (
                                                <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
                                                    <div className="text-[9px] font-semibold uppercase text-slate-400">Programa</div>
                                                    <div className="text-sm font-semibold text-slate-700 mt-0.5">{c.programa}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </Modal>
        </AppLayout>
    );
}
