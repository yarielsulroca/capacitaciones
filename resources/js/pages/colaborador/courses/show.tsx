import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Curso, EnrollmentStatus } from '@/types/capacitaciones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { Calendar, Clock, MapPin, Users, BookOpen, ChevronLeft, CreditCard } from 'lucide-react';

interface ShowProps {
    curso: Curso;
    status?: EnrollmentStatus;
}

export default function Show({ curso, status }: ShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Cursos', href: '/courses' },
        { title: curso.nombre, href: `/courses/${curso.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={curso.nombre} />

            <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full">
                <Button
                    variant="ghost"
                    className="mb-6 -ml-2 text-slate-500 hover:text-slate-900"
                    onClick={() => window.history.back()}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Volver al catálogo
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Badge variant="secondary" className="px-3 py-1 text-sm">{curso.categoria}</Badge>
                                {status && <StatusBadge status={status} />}
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight mb-4">
                                {curso.nombre}
                            </h1>
                            <p className="text-xl text-slate-500 leading-relaxed">
                                {curso.descripcion}
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium-sm space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-primary" />
                                Detalles del Programa
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-xs">Información General</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Fecha de Inicio</p>
                                                <p className="font-medium text-slate-900">{curso.inicio}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Carga Horaria</p>
                                                <p className="font-medium text-slate-900">{curso.cant_horas} horas totales</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-xs">Logística</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Cupos Disponibles</p>
                                                <p className="font-medium text-slate-900">{curso.capacidad} participantes</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Centro de Costo</p>
                                                <p className="font-medium text-slate-900 capitalize">{curso.cdc}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {curso.horarios && curso.horarios.length > 0 && (
                                <div className="pt-6 border-t border-slate-50">
                                    <h3 className="font-semibold text-slate-900 mb-4">Cronograma de Clases</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {curso.horarios.map((h, i) => (
                                            <div key={i} className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
                                                <span className="text-sm font-medium capitalize">{h.dia}</span>
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">{h.hora}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl sticky top-24">
                            <div className="flex items-center gap-2 mb-6">
                                <CreditCard className="w-5 h-5 text-indigo-400" />
                                <span className="text-indigo-400 font-semibold text-sm tracking-wider uppercase">Inversión</span>
                            </div>
                            <div className="mb-8">
                                <div className="text-5xl font-black mb-1">${curso.costo}</div>
                                <div className="text-slate-400 text-sm">Costo total por participante</div>
                            </div>

                            {status ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-xs text-slate-400 mb-1">Tu estado actual:</p>
                                        <StatusBadge status={status} className="w-full justify-center py-2" />
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full py-6 border-white/20 text-white hover:bg-white/10"
                                        onClick={() => router.post(`/courses/${curso.id}/cancelado`)}
                                    >
                                        Cancelar Inscripción
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    className="w-full py-8 text-lg font-bold shadow-indigo-500/20 shadow-lg hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => router.post(`/courses/${curso.id}/enroll`)}
                                >
                                    Solicitar mi lugar
                                </Button>
                            )}

                            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                                <div className="flex gap-3 text-xs text-slate-400 italic leading-relaxed">
                                    <p>* La solicitud está sujeta a aprobación por parte de Capital Humano y tu responsable directo.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
