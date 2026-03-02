import { Modal, Table } from 'antd';
import { StatusBadge } from '@/components/status-badge';
import { Enrollment } from '@/types/capacitaciones';

interface CourseEnrollmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseName: string;
    enrollments: Enrollment[];
}

export default function CourseEnrollmentsModal({ isOpen, onClose, courseName, enrollments }: CourseEnrollmentsModalProps) {
    const columns = [
        { title: 'Nombre', dataIndex: ['user', 'name'], key: 'name', render: (text: string) => <span className="font-medium">{text || 'Usuario'}</span> },
        { title: 'Email', dataIndex: ['user', 'email'], key: 'email', render: (text: string) => text || 'N/A' },
        { title: 'Estado', dataIndex: 'status_label', key: 'status', render: (status: string) => <StatusBadge status={status || 'solicitado'} /> }
    ];

    return (
        <Modal
            title={<span className="text-xl font-bold uppercase">Inscriptos: {courseName}</span>}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={800}
            centered
        >
            <div className="mt-4">
                <Table
                    columns={columns}
                    dataSource={enrollments}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: <span className="text-slate-400">No hay inscriptos en este curso todavía.</span> }}
                />
            </div>
        </Modal>
    );
}
