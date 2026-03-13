import { Tag } from 'antd';
import { EnrollmentStatus } from '@/types/capacitaciones';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: EnrollmentStatus;
    className?: string;
}

export const statusColors: Record<string, string> = {
    'solicitado': 'warning',
    'matriculado': 'success',
    'cancelado': 'error',
    'terminado': 'processing',
    'incompleto': 'default',
};

const statusLabels: Record<string, string> = {
    'matriculado': 'inscripto',
    'incompleto': 'interrumpido',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
    const color = statusColors[status.toLowerCase()] || 'default';
    const label = statusLabels[status.toLowerCase()] || status;

    return (
        <Tag color={color} className={cn("capitalize px-2 py-0.5 text-xs font-semibold tracking-wide m-0", className)}>
            {label}
        </Tag>
    );
}
