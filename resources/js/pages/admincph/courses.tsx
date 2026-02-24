import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface Course {
    id: number;
    nombre: string;
    inicio: string;
    fin: string;
    capacidad: number;
    users_count: number;
}

interface Metadata {
    habilidades: { id: number; habilidad: string }[];
    categorias: { id: number; categoria: string }[];
}

export default function CourseIndex({ courses, metadata }: { courses: { data: Course[] }, metadata: Metadata }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        inicio: '',
        fin: '',
        capacidad: 30,
        id_habilidad: '',
        id_categoria: ''
    });

    const handleSubmit = () => {
        router.post('/admin/courses', formData, {
            onSuccess: () => setIsDialogOpen(false),
            preserveScroll: true
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Cursos', href: '/admin/courses' }]}>
            <Head title="Gestión de Cursos" />
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Cursos</h1>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Capacitaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Curso</TableHead>
                                    <TableHead>Fechas</TableHead>
                                    <TableHead>Cupos</TableHead>
                                    <TableHead>Inscritos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.data.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell className="font-medium">{course.nombre}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <span>Desde: {course.inicio}</span>
                                                <span>Hasta: {course.fin}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{course.capacidad}</TableCell>
                                        <TableCell>
                                            <Badge variant={course.users_count >= course.capacidad ? 'destructive' : 'outline'}>
                                                {course.users_count} / {course.capacidad}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Editar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Registrar Nueva Capacitación</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="name">Nombre del Curso</Label>
                                <Input id="name" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                             </div>
                             <div className="grid gap-2">
                                <Label htmlFor="cap">Capacidad (Cupos)</Label>
                                <Input id="cap" type="number" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: parseInt(e.target.value)})} />
                             </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="desc">Descripción</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.descripcion}
                                onChange={e => setFormData({...formData, descripcion: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label>Fecha Inicio</Label>
                                <Input type="date" value={formData.inicio} onChange={e => setFormData({...formData, inicio: e.target.value})} />
                             </div>
                             <div className="grid gap-2">
                                <Label>Fecha Fin</Label>
                                <Input type="date" value={formData.fin} onChange={e => setFormData({...formData, fin: e.target.value})} />
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Habilidad</Label>
                                <Select onValueChange={val => setFormData({...formData, id_habilidad: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {metadata.habilidades.map(h => (
                                            <SelectItem key={h.id} value={h.id.toString()}>{h.habilidad}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Categoría</Label>
                                <Select onValueChange={val => setFormData({...formData, id_categoria: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {metadata.categorias.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.categoria}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} className="bg-tuteur-red text-white">Crear Curso</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
