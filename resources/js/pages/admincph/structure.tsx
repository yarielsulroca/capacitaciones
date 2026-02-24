import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { toast } from 'sonner';

interface Entity {
    id: number;
    nombre?: string;
    cdc?: string;
    categoria?: string;
    habilidad?: string;
    programa?: string;
    provedor?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    descripcion?: string;
    activo?: boolean | number;
    id_empresa?: number;
    id_area?: number;
}

interface StructureProps {
    empresas: Entity[];
    areas: Entity[];
    departamentos: Entity[];
    cdcs: Entity[];
    categorias: Entity[];
    habilidades: Entity[];
    proveedores: Entity[];
    programas_asociados: Entity[];
}

export default function Structure({ empresas, areas, departamentos, cdcs, categorias, habilidades, proveedores, programas_asociados }: StructureProps) {
    const [editingItem, setEditingItem] = useState<{ type: string; item: Entity | null; label: string; isNew: boolean } | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: string; item: Entity } | null>(null);
    const [formData, setFormData] = useState<any>({ value: '', parentId: '', descripcion: '', activo: true, contacto: '', telefono: '', email: '' });

    const handleEdit = (type: string, item: any, label: string) => {
        setEditingItem({ type, item, label, isNew: false });
        setFormData({
            value: item[label] || '',
            parentId: type === 'areas' ? item.id_empresa?.toString() :
                      type === 'departamentos' ? item.id_area?.toString() : '',
            descripcion: item.descripcion || '',
            activo: item.activo === undefined ? true : !!item.activo,
            contacto: item.contacto || '',
            telefono: item.telefono || '',
            email: item.email || '',
        });
        setIsDialogOpen(true);
    };

    const handleCreate = (type: string, label: string) => {
        setEditingItem({ type, item: null, label, isNew: true });
        setFormData({ value: '', parentId: '', descripcion: '', activo: true, contacto: '', telefono: '', email: '' });
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (type: string, item: Entity) => {
        setItemToDelete({ type, item });
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        router.delete(`/admin/structure/${itemToDelete.type}/${itemToDelete.item.id}`, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setItemToDelete(null);
                toast.success('Registro eliminado correctamente');
            },
            onError: () => {
                toast.error('Error al eliminar el registro');
            },
            preserveScroll: true
        });
    };

    const handleSubmit = () => {
        if (!editingItem) return;

        const payload: any = {
            [editingItem.label]: formData.value,
            descripcion: formData.descripcion || null,
        };

        if (editingItem.type === 'programas_asociados') {
            payload.activo = formData.activo ? 1 : 0;
        }

        if (editingItem.type === 'proveedores') {
            payload.contacto = formData.contacto || null;
            payload.telefono = formData.telefono || null;
            payload.email = formData.email || null;
        }

        if (editingItem.type === 'areas') payload.id_empresa = formData.parentId;
        if (editingItem.type === 'departamentos') payload.id_area = formData.parentId;

        if (editingItem.isNew) {
            router.post(`/admin/structure/${editingItem.type}`, payload, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingItem(null);
                    toast.success('Registro creado correctamente');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Error al crear el registro');
                },
                preserveScroll: true
            });
        } else {
            router.patch(`/admin/structure/${editingItem.type}/${editingItem.item?.id}`, payload, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingItem(null);
                    toast.success('Registro actualizado correctamente');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Error al guardar los cambios');
                },
                preserveScroll: true
            });
        }
    };

    const sections = [
        { id: 'empresas', title: 'Empresas', data: empresas, label: 'nombre' },
        { id: 'areas', title: 'Áreas', data: areas, label: 'nombre' },
        { id: 'departamentos', title: 'Departamentos', data: departamentos, label: 'nombre' },
        { id: 'cdcs', title: 'CDCs', data: cdcs, label: 'cdc' },
        { id: 'categorias', title: 'Categorías', data: categorias, label: 'categoria' },
        { id: 'habilidades', title: 'Habilidades', data: habilidades, label: 'habilidad' },
        { id: 'proveedores', title: 'Proveedores', data: proveedores, label: 'provedor' },
        { id: 'programas_asociados', title: 'Programas', data: programas_asociados, label: 'programa' },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Estructura', href: '/admin/structure' }]}>
            <Head title="Gestión de Estructura" />
            <TooltipProvider>
                <div className="p-4 space-y-4">
                    <h1 className="text-2xl font-bold italic text-tuteur-red">Gestión Administrativa</h1>

                    <Tabs defaultValue="empresas" className="w-full">
                        <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-4 h-auto bg-slate-100 p-1 rounded-xl">
                            {sections.map(s => (
                                <TabsTrigger key={s.id} value={s.id} className="text-[10px] lg:text-xs py-2 font-black uppercase tracking-wider">{s.title}</TabsTrigger>
                            ))}
                        </TabsList>

                        {sections.map(section => (
                            <TabsContent key={section.id} value={section.id}>
                                <Card className="border-2 border-slate-100 shadow-sm overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between bg-white border-b-2 border-slate-50">
                                        <div className="flex flex-col gap-1">
                                            <CardTitle className="text-lg font-black uppercase text-slate-700 tracking-tight">
                                                {section.title}
                                            </CardTitle>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                                Gestión de registros de {section.id.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <Button onClick={() => handleCreate(section.id, section.label)} className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest px-6 h-9 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95">
                                            <Plus className="mr-2 h-3.5 w-3.5" strokeWidth={3} />
                                            Nuevo
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-slate-50/50">
                                                <TableRow className="hover:bg-transparent border-b-2 border-slate-100">
                                                    <TableHead className="w-[80px] text-[10px] font-black uppercase text-slate-400 px-6">ID</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Nombre / Valor</TableHead>
                                                    {section.id === 'proveedores' && (
                                                        <>
                                                            <TableHead className="text-[10px] font-black uppercase text-slate-400">Contacto</TableHead>
                                                            <TableHead className="text-[10px] font-black uppercase text-slate-400">Teléfono</TableHead>
                                                            <TableHead className="text-[10px] font-black uppercase text-slate-400">Email</TableHead>
                                                        </>
                                                    )}
                                                    {['programas_asociados', 'habilidades', 'categorias', 'cdcs'].includes(section.id) && (
                                                        <>
                                                            <TableHead className="text-[10px] font-black uppercase text-slate-400">Descripción</TableHead>
                                                            {section.id === 'programas_asociados' && <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center">Estado</TableHead>}
                                                        </>
                                                    )}
                                                    <TableHead className="text-right text-[10px] font-black uppercase text-slate-400 px-6">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="bg-white">
                                                {section.data.map((item: any) => (
                                                    <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-50/50">
                                                        <TableCell className="font-mono text-[10px] text-slate-300 px-6 font-bold">#{item.id}</TableCell>
                                                        <TableCell>
                                                            <span className="font-bold text-slate-600 text-sm tracking-tight">{item[section.label] || 'N/A'}</span>
                                                        </TableCell>
                                                        {section.id === 'proveedores' && (
                                                            <>
                                                                <TableCell><span className="text-[11px] text-slate-500">{item.contacto || '—'}</span></TableCell>
                                                                <TableCell><span className="text-[11px] text-slate-500">{item.telefono || '—'}</span></TableCell>
                                                                <TableCell><span className="text-[11px] text-slate-500">{item.email || '—'}</span></TableCell>
                                                            </>
                                                        )}
                                                        {['programas_asociados', 'habilidades', 'categorias', 'cdcs'].includes(section.id) && (
                                                            <>
                                                                <TableCell className="max-w-[300px]">
                                                                    <p className="text-[11px] text-slate-400 line-clamp-1 italic font-medium">{item.descripcion || 'Sin descripción'}</p>
                                                                </TableCell>
                                                                {section.id === 'programas_asociados' && (
                                                                    <TableCell className="text-center">
                                                                        {item.activo ? (
                                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                                                        ) : (
                                                                            <XCircle className="h-4 w-4 text-slate-300 mx-auto" />
                                                                        )}
                                                                    </TableCell>
                                                                )}
                                                            </>
                                                        )}
                                                        <TableCell className="text-right px-6">
                                                            <div className="flex justify-end gap-1">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleEdit(section.id, item, section.label)}
                                                                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all rounded-lg"
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-slate-900 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5">
                                                                        Editar {section.id.slice(0, -1)}
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleDeleteClick(section.id, item)}
                                                                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-red-600 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 shadow-lg shadow-red-500/20">
                                                                        Eliminar {section.id.slice(0, -1)}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {section.data.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={section.id === 'programas_asociados' ? 5 : 3} className="text-center py-20 text-slate-400 text-xs italic font-medium">
                                                            <div className="flex flex-col items-center gap-2 opacity-60">
                                                                <CardTitle className="text-slate-200">SIN REGISTROS</CardTitle>
                                                                No hay registros disponibles en esta sección.
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                {/* MODAL DE EDICIÓN / CREACIÓN */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                        <DialogHeader className="p-8 bg-slate-900 border-b border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 rounded-full" />
                            <DialogTitle className="text-white font-black tracking-tight uppercase text-xl relative z-10">
                                {editingItem?.isNew ? 'Nuevo Registro' : 'Editar Registro'}
                            </DialogTitle>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic relative z-10 opacity-70">
                                {editingItem?.type.replace('_', ' ')}
                            </p>
                        </DialogHeader>
                        <div className="p-8 space-y-6">
                            {editingItem?.type === 'areas' && (
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Empresa Asociada</Label>
                                    <Select value={formData.parentId} onValueChange={(val) => setFormData({ ...formData, parentId: val })}>
                                        <SelectTrigger className="h-12 border-2 border-slate-100 focus:border-primary font-bold text-slate-700 rounded-xl transition-all">
                                            <SelectValue placeholder="Seleccionar empresa..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-2 border-slate-100">
                                            {empresas.map(e => (
                                                <SelectItem key={e.id} value={e.id.toString()} className="font-bold text-slate-600">{e.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {editingItem?.type === 'departamentos' && (
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Área Asociada</Label>
                                    <Select value={formData.parentId} onValueChange={(val) => setFormData({ ...formData, parentId: val })}>
                                        <SelectTrigger className="h-12 border-2 border-slate-100 focus:border-primary font-bold text-slate-700 rounded-xl transition-all">
                                            <SelectValue placeholder="Seleccionar área..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-2 border-slate-100">
                                            {areas.map(a => (
                                                <SelectItem key={a.id} value={a.id.toString()} className="font-bold text-slate-600">{a.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                    {editingItem?.label === 'nombre' ? 'Nombre de la Entidad' :
                                     editingItem?.label === 'programa' ? 'Nombre del Programa' :
                                     editingItem?.label === 'provedor' ? 'Nombre del Proveedor' : 'Valor / Etiqueta'}
                                </Label>
                                <Input
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    placeholder="Escribe aquí..."
                                    className="h-12 border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700 rounded-xl"
                                />
                            </div>

                            {editingItem?.type === 'proveedores' && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Contacto</Label>
                                        <Input
                                            value={formData.contacto}
                                            onChange={e => setFormData({ ...formData, contacto: e.target.value })}
                                            placeholder="Nombre del contacto"
                                            className="h-10 border-2 border-slate-100 focus:border-primary font-bold text-slate-700 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Teléfono</Label>
                                        <Input
                                            value={formData.telefono}
                                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                            placeholder="+54 11 ..."
                                            className="h-10 border-2 border-slate-100 focus:border-primary font-bold text-slate-700 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Email</Label>
                                        <Input
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="proveedor@ejemplo.com"
                                            className="h-10 border-2 border-slate-100 focus:border-primary font-bold text-slate-700 rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}

                            {['programas_asociados', 'habilidades', 'categorias', 'cdcs'].includes(editingItem?.type as string) && (
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Descripción</Label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                        placeholder={`Detalles del ${editingItem?.type.slice(0, -1)}...`}
                                        className="w-full min-h-[100px] p-4 border-2 border-slate-100 focus:border-primary outline-none transition-all font-bold text-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                            )}

                            {editingItem?.type === 'programas_asociados' && (
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-100/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase text-slate-600">Estado Activo</span>
                                        <span className="text-[10px] text-slate-400 font-bold italic uppercase tracking-wider">Habilitar visibilidad en la plataforma</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.activo}
                                        onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                                        className="w-5 h-5 accent-primary"
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter className="p-8 bg-slate-50 flex gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest border-2 border-slate-200 rounded-xl hover:bg-white transition-all">
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} className="flex-[1.5] h-12 font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                                {editingItem?.isNew ? 'Crear Registro' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL DE ELIMINACIÓN */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="max-w-sm bg-white rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                        <div className="p-8 pt-10 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="h-8 w-8" />
                            </div>
                            <DialogTitle className="text-slate-900 font-black tracking-tight uppercase text-xl">¿Eliminar registro?</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs font-bold px-4 leading-relaxed italic uppercase tracking-wider">
                                Esta acción eliminará permanentemente el registro <span className="text-red-500 not-italic">"{itemToDelete?.item.nombre || itemToDelete?.item.programa || itemToDelete?.item.cdc || itemToDelete?.item.habilidad || itemToDelete?.item.categoria || itemToDelete?.item.provedor}"</span> y no se puede deshacer.
                            </DialogDescription>
                        </div>
                        <DialogFooter className="p-8 pb-10 bg-white flex flex-col gap-2">
                            <Button onClick={confirmDelete} className="w-full h-12 font-black uppercase text-[10px] tracking-widest bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xl shadow-red-500/20 mb-2 transition-all active:scale-95">
                                Sí, eliminar definitivamente
                            </Button>
                            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="w-full h-12 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                No, mantener registro
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </TooltipProvider>
        </AppLayout>
    );
}
