import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card } from 'antd';
import { Users, BookOpen, Building2, Briefcase, Layers } from 'lucide-react';

interface DashboardStats {
    users: number;
    cursos: number;
    empresas: number;
    areas: number;
    departamentos: number;
}

export default function AdminDashboard({ stats }: { stats: DashboardStats }) {
    const cards = [
        { title: 'Colaboradores', value: stats.users.toLocaleString(), icon: Users },
        { title: 'Cursos Activos', value: stats.cursos.toLocaleString(), icon: BookOpen },
        { title: 'Empresas', value: stats.empresas.toLocaleString(), icon: Building2 },
        { title: 'Áreas', value: stats.areas.toLocaleString(), icon: Briefcase },
        { title: 'Departamentos', value: stats.departamentos.toLocaleString(), icon: Layers },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }]}>
            <Head title="Panel de Administración" />
            <div className="p-4 space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-tuteur-grey">Panel Administrativo</h1>
                    <p className="text-tuteur-grey-mid">Gestión global de capacitaciones y estructura organizacional.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {cards.map((stat) => (
                        <Card key={stat.title} size="small" bordered={false} className="shadow-sm">
                            <div className="flex flex-row items-center justify-between pb-2 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-tuteur-grey-mid">{stat.title}</span>
                                <div className="w-7 h-7 bg-red-50 rounded-md flex items-center justify-center">
                                    <stat.icon className="h-4 w-4 text-tuteur-red" />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-tuteur-grey">{stat.value}</div>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card title={<span className="font-bold uppercase tracking-wide text-tuteur-grey">Accesos Rápidos</span>} bordered={false} className="shadow-sm">
                        <div className="grid gap-2">
                             <a href="/admin/users" className="flex items-center p-3 rounded-lg hover:bg-red-50 border border-gray-100 transition-colors text-tuteur-grey font-semibold text-sm">
                                <Users className="mr-3 h-4 w-4 text-tuteur-red" /> Gestión de Usuarios
                             </a>
                             <a href="/admin/courses" className="flex items-center p-3 rounded-lg hover:bg-red-50 border border-gray-100 transition-colors text-tuteur-grey font-semibold text-sm">
                                <BookOpen className="mr-3 h-4 w-4 text-tuteur-red" /> Gestión de Cursos
                             </a>
                             <a href="/admin/structure" className="flex items-center p-3 rounded-lg hover:bg-red-50 border border-gray-100 transition-colors text-tuteur-grey font-semibold text-sm">
                                <Building2 className="mr-3 h-4 w-4 text-tuteur-red" /> Estructura (Empresas/Áreas)
                             </a>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
