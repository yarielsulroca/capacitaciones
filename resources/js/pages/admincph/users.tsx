import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    cargo?: string;
    id_departamento?: number;
    departamento?: {
        id: number;
        nombre: string;
        area?: {
            nombre: string;
        }
    }
}

interface Metadata {
    roles: string[];
    departamentos: { id: number; nombre: string; area?: { nombre: string } }[];
}

export default function UserIndex({ users, metadata }: { users: { data: User[] }, metadata: Metadata }) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        cargo: '',
        id_departamento: '' as string | number
    });

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            cargo: user.cargo || '',
            id_departamento: user.id_departamento || ''
        });
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            role: 'user',
            cargo: '',
            id_departamento: ''
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = () => {
        if (editingUser) {
            router.patch(`/admin/users/${editingUser.id}`, formData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingUser(null);
                },
                preserveScroll: true
            });
        } else {
            router.post('/admin/users', formData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                },
                preserveScroll: true
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Usuarios', href: '/admin/users' }]}>
            <Head title="Gestión de Usuarios" />
            <div className="p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Colaboradores</CardTitle>
                        <Button onClick={handleCreate} className="bg-tuteur-red text-white hover:bg-red-700">
                            Nuevo Colaborador
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Cargo / Departamento</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{user.cargo || 'N/A'}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {user.departamento?.nombre} {user.departamento?.area?.nombre ? `(${user.departamento.area.nombre})` : ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>Editar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? `Editar Usuario: ${editingUser.name}` : 'Nuevo Colaborador'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Nombre completo"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="correo@ejemplo.com"
                                    disabled={!!editingUser}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rol en el Sistema</Label>
                            <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {metadata.roles.map(role => (
                                        <SelectItem key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cargo">Cargo / Puesto</Label>
                            <Input
                                id="cargo"
                                value={formData.cargo}
                                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dep">Departamento</Label>
                            <Select
                                value={formData.id_departamento.toString()}
                                onValueChange={(val) => setFormData({...formData, id_departamento: parseInt(val)})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar departamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    {metadata.departamentos.map(dep => (
                                        <SelectItem key={dep.id} value={dep.id.toString()}>
                                            {dep.nombre} {dep.area?.nombre ? `(${dep.area.nombre})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
