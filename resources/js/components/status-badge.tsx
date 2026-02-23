import { Badge } from '@/components/ui/badge';
import { EnrollmentStatus } from '@/types/capacitaciones';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: EnrollmentStatus;
    className?: string;
}

export const statusColors: Record<string, string> = {
    'solicitado': 'bg-amber-100 text-amber-700 border-amber-200',
    'procesando': 'bg-amber-100 text-amber-700 border-amber-200',
    'matriculado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'cancelado': 'bg-rose-100 text-rose-700 border-rose-200',
    'terminado': 'bg-blue-100 text-blue-700 border-blue-200',
    'certificado': 'bg-violet-100 text-violet-700 border-violet-200',
    'incompleto': 'bg-slate-100 text-slate-700 border-slate-200',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
    const style = statusColors[status.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200';

    return (
        <Badge variant="outline" className={cn("capitalize px-3 py-1 font-semibold tracking-wide", style, className)}>
            {status}
        </Badge>
    );
}
