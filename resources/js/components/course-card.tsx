import { Button, Tag } from 'antd';
import { Curso, EnrollmentStatus } from '@/types/capacitaciones';
import { Calendar, Clock, Laptop, Users, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
    curso: Curso;
    status?: EnrollmentStatus;
    isAdmin?: boolean;
    onEnroll?: (id: number) => void;
    onCancel?: (id: number) => void;
    onEdit?: (curso: Curso) => void;
    onManageUsers?: (curso: Curso) => void;
    onManageEnrollments?: (curso: Curso) => void;
    onClick?: (curso: Curso) => void;
    className?: string;
}

const statusStyles: Record<string, { bg: string, border: string, accent: string, text: string }> = {
    'solicitado': { bg: 'bg-amber-50/50', border: 'border-amber-200', accent: 'bg-amber-500', text: 'text-amber-600' },
    'procesando': { bg: 'bg-amber-50/50', border: 'border-amber-200', accent: 'bg-amber-500', text: 'text-amber-600' },
    'aceptado': { bg: 'bg-emerald-50/50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-600' },
    'matriculado': { bg: 'bg-emerald-50/50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-600' },
    'cancelado': { bg: 'bg-rose-50/50', border: 'border-rose-200', accent: 'bg-rose-500', text: 'text-rose-600' },
    'terminado': { bg: 'bg-blue-50/50', border: 'border-blue-200', accent: 'bg-blue-500', text: 'text-blue-600' },
    'certificado': { bg: 'bg-violet-50/50', border: 'border-violet-200', accent: 'bg-violet-500', text: 'text-violet-600' },
    'incompleto': { bg: 'bg-slate-50/50', border: 'border-slate-200', accent: 'bg-slate-500', text: 'text-slate-600' },
};

const statusLabels: Record<string, string> = {
    'matriculado': 'inscripto',
};

const formatDate = (val: string | null | undefined) => {
    if (!val) return '—';
    try { return new Date(val).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return val; }
};

export function CourseCard({ curso, status, isAdmin, onEnroll, onCancel, onEdit, onManageUsers, onManageEnrollments, onClick, className }: CourseCardProps) {
    const style = status ? statusStyles[status] : { bg: 'bg-white', border: 'border-slate-100', accent: 'bg-slate-200', text: 'text-slate-400' };

    const modalidadLabel = typeof curso.modalidad === 'object' ? curso.modalidad?.modalidad : curso.modalidad || 'Presencial';

    return (
        <div className={cn(
            "group relative flex flex-col h-full rounded-2xl overflow-hidden bg-white border border-slate-200/80",
            "shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
            className
        )}>
            {/* Clickable overlay for details (covers everything except footer buttons) */}
            {onClick && (
                <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onClick(curso); }}
                    style={{ bottom: '60px' }}
                />
            )}
            {/* Red accent top bar */}
            <div className="h-1 w-full bg-linear-to-r from-tuteur-red via-tuteur-red-light to-tuteur-red" />

            {/* Dark Premium Header */}
            <div className="bg-linear-to-br from-slate-800 to-slate-900 px-5 py-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/3 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/2 rounded-full translate-y-6 -translate-x-4" />
                <h3 className="text-base font-semibold text-white leading-snug tracking-tight relative z-10">
                    {curso.nombre}
                </h3>
                <div className="flex items-center gap-2 mt-2 relative z-10">
                    <Tag className="bg-white/10 border-white/20 text-white/80 text-[9px] font-semibold uppercase m-0 py-0 rounded-md">
                        {modalidadLabel}
                    </Tag>
                    {curso.cant_horas > 0 && (
                        <Tag className="bg-emerald-500/20 border-emerald-400/30 text-emerald-300 text-[9px] font-semibold m-0 py-0 rounded-md">
                            {curso.cant_horas}h
                        </Tag>
                    )}
                </div>
            </div>

            <div className="flex flex-col flex-1">
                {/* Key Info Section */}
                <div className="px-5 py-4 space-y-2.5">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                            <Calendar className="h-3.5 w-3.5 text-tuteur-red" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Período</span>
                            <p className="text-xs font-medium text-slate-700 leading-tight truncate">
                                {formatDate(curso.inicio)} — {formatDate(curso.fin)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                            <Laptop className="h-3.5 w-3.5 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Modalidad</span>
                            <p className="text-xs font-medium text-slate-700 leading-tight capitalize truncate">
                                {modalidadLabel} · {curso.cant_horas || 0} horas
                            </p>
                        </div>
                    </div>
                    {curso.capacidad > 0 && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                <Users className="h-3.5 w-3.5 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Cupos</span>
                                <p className="text-xs font-medium text-slate-700 leading-tight">{curso.capacidad} participantes</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Description */}
                {curso.descripcion && (
                    <div className="border-t border-slate-100 mx-5 pt-3 pb-4">
                        <p className="text-[12px] leading-relaxed text-slate-500 line-clamp-3">
                            {curso.descripcion}
                        </p>
                    </div>
                )}

                {/* Footer with Actions */}
                <div className="border-t border-slate-100 bg-slate-50/60 p-4 mt-auto shrink-0">
                    <div className="flex items-center justify-between gap-3">
                        <span className={cn(
                            "text-xs font-semibold tracking-wide capitalize px-2.5 py-1 rounded-full",
                            status ? `${style.bg} ${style.text} border ${style.border}` : "bg-slate-100 text-slate-400"
                        )}>
                            {status ? (statusLabels[status] || status) : 'Disponible'}
                        </span>

                        {isAdmin ? (
                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="small"
                                    onClick={() => onManageUsers?.(curso)}
                                    className="text-[9px] font-semibold uppercase tracking-wider rounded-lg h-7 px-2.5 border border-slate-200 text-slate-500 hover:border-slate-300! hover:text-slate-700!"
                                >
                                    Colaboradores
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => onManageEnrollments?.(curso)}
                                    className="text-[9px] font-semibold uppercase tracking-wider rounded-lg h-7 px-2.5 border border-slate-200 text-slate-500 hover:border-slate-300! hover:text-slate-700!"
                                >
                                    Matrículas
                                </Button>
                                <Button
                                    size="small"
                                    type="primary"
                                    onClick={() => onEdit?.(curso)}
                                    className="bg-tuteur-red hover:bg-tuteur-red-dark! text-white text-[9px] font-semibold uppercase tracking-wider rounded-lg h-7 px-3 border-none shadow-sm"
                                >
                                    Editar
                                </Button>
                            </div>
                        ) : !status ? (
                            <Button
                                onClick={() => onEnroll?.(curso.id)}
                                type="primary"
                                className="bg-tuteur-red hover:bg-tuteur-red-dark! text-white text-[11px] font-semibold uppercase tracking-wider rounded-lg h-9 px-5 border-none shadow-md shadow-red-500/15"
                            >
                                Inscribirse
                            </Button>
                        ) : (
                            <Button
                                onClick={() => onCancel?.(curso.id)}
                                className="text-slate-500 hover:text-rose-600! hover:border-rose-200! border text-[11px] font-semibold rounded-lg h-9 px-5 transition-all"
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
