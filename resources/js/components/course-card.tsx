import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Curso, EnrollmentStatus } from '@/types/capacitaciones';
import { Star, Key, Calendar, Clock, Laptop, Users } from 'lucide-react';
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

export function CourseCard({ curso, status, isAdmin, onEnroll, onCancel, onEdit, onManageUsers, onManageEnrollments, className }: CourseCardProps) {
    const style = status ? statusStyles[status] : { bg: 'bg-white', border: 'border-slate-100', accent: 'bg-slate-200', text: 'text-slate-100' };

    const formatSchedule = (horarios: any) => {
        if (!horarios || !Array.isArray(horarios)) return 'Consultar horario';
        return horarios.map(h => `${h.dia} ${h.hora}`).join(' | ');
    }

    return (
        <Card className={cn(
            "flex flex-col h-full overflow-hidden border-2 transition-all duration-300 group shadow-md hover:shadow-xl max-w-md bg-white",
            className
        )}>
            {/* Dark Header with Title */}
            <div className="bg-slate-200 py-3 px-4 border-b-2 border-slate-300">
                <h3 className="text-lg font-black text-center text-slate-800 tracking-tight leading-tight">
                    {curso.nombre}
                </h3>
            </div>

            <CardContent className="flex flex-col flex-1 p-0">
                {/* Branding & Stars */}
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
                        EXPERIENCIA TUTEUR
                    </span>
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                    </div>
                </div>

                {/* Key Info Section */}
                <div className="px-8 py-5 flex flex-col gap-3 text-sm font-bold text-slate-600">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>Inicia: <span className="text-slate-500 font-medium">{curso.inicio}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-slate-300" />
                        <span>Finaliza: <span className="text-slate-400 font-medium">{curso.fin}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>Horario: <span className="text-slate-500 font-medium">{formatSchedule(curso.horarios)}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Laptop className="h-4 w-4 text-slate-400" />
                        <span className="capitalize text-slate-500 font-medium">{curso.modalidad || 'Presencial'} · {curso.cant_horas}hs</span>
                    </div>
                </div>

                {/* Description Divider */}
                <div className="border-t-2 border-slate-900 mx-4" />

                {/* Italic Description */}
                <div className="px-8 py-6">
                    <p className="italic text-[13px] leading-relaxed text-slate-500 text-center">
                        {curso.descripcion || "Capacitación de alto desempeño para el equipo Tuteur."}
                    </p>
                </div>

                {/* Final Divider before gray footer */}
                <div className="border-t-2 border-slate-900" />

                {/* Gray Footer with Actions */}
                <div className="bg-slate-250 p-5 mt-auto flex items-center justify-between gap-4">
                    <div className="shrink-0 pl-2">
                        <span className={cn(
                            "text-sm font-black tracking-wide capitalize",
                            status ? style.text : "text-shadow-slate-950"
                        )}>
                            {status || 'Disponible'}
                        </span>
                    </div>

                    {isAdmin ? (
                        <div className="flex flex-col gap-2 flex-1">
                            <Button
                                onClick={() => onEdit?.(curso)}
                                className="bg-primary hover:bg-primary/90 text-white text-[12px] font-black uppercase tracking-wider rounded-lg h-11 px-6 w-full shadow-lg shadow-black/20 border-white border-2"
                            >
                                EDITAR CURSO
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => onManageUsers?.(curso)}
                                    variant="secondary"
                                    className="text-[10px] font-black uppercase tracking-wider rounded-lg h-9 px-3 flex-1 border-2 border-slate-100"
                                >
                                    Colaboradores
                                </Button>
                                <Button
                                    onClick={() => onManageEnrollments?.(curso)}
                                    variant="outline"
                                    className="text-[10px] font-black uppercase tracking-wider rounded-lg h-9 px-3 flex-1 border-2"
                                >
                                    Matrículas
                                </Button>
                            </div>
                        </div>
                    ) : !status ? (
                        <Button
                            onClick={() => onEnroll?.(curso.id)}
                            className="bg-[#E30613] hover:bg-[#c40510] text-white text-[12px] font-black uppercase tracking-wider rounded-lg h-11 px-6 flex-1 shadow-lg shadow-black/20 border-white border-2"
                        >
                            SOLICITAR LA INSCRIPCIÓN?
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => onCancel?.(curso.id)}
                            className="bg-white/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-2 border-white/50 text-[12px] font-black rounded-lg h-11 px-6 flex-1 transition-all"
                        >
                            CANCELAR
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
