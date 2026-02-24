import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Building2, Briefcase } from 'lucide-react';

export default function AdminDashboard() {
    const stats = [
        { title: 'Usuarios Totales', value: '1,234', icon: Users, color: 'text-blue-600' },
        { title: 'Cursos Activos', value: '45', icon: BookOpen, color: 'text-green-600' },
        { title: 'Empresas', value: '12', icon: Building2, color: 'text-purple-600' },
        { title: 'Áreas', value: '28', icon: Briefcase, color: 'text-orange-600' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }]}>
            <Head title="Panel de Administración" />
            <div className="p-4 space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Panel Administrativo</h1>
                    <p className="text-muted-foreground">Gestión global de capacitaciones y estructura organizacional.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Accesos Rápidos</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                             <a href="/admin/users" className="flex items-center p-2 rounded-lg hover:bg-muted border transition-colors">
                                <Users className="mr-2 h-4 w-4" /> Gestión de Usuarios
                             </a>
                             <a href="/admin/courses" className="flex items-center p-2 rounded-lg hover:bg-muted border transition-colors">
                                <BookOpen className="mr-2 h-4 w-4" /> Gestión de Cursos
                             </a>
                             <a href="/admin/structure" className="flex items-center p-2 rounded-lg hover:bg-muted border transition-colors">
                                <Building2 className="mr-2 h-4 w-4" /> Estructura (Empresas/Áreas)
                             </a>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
