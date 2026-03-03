import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Table, Card, Tabs, Modal, Button, Input, Select, Tooltip, Switch, Form, Tag, Space, Collapse } from 'antd';
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, DollarSign, Building2, BookOpen, Filter, X, ChevronDown } from 'lucide-react';
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
    inversion?: number | string;
    fecha?: number;
    presupuesto?: number | string;
    inicial?: number | string;
    actual?: number | string;
    id_departamento?: number;
    departamento?: { id: number; nombre: string; area?: { id: number; nombre: string } };
    inicio?: string;
    fin?: string;
    cant_horas?: number | string;
    costo?: number | string;
    capacidad?: number;
    habilidad_id?: number;
    categoria_id?: number;
    id_cdc?: number;
    id_modalidad?: number;
    id_tipo?: number;
    id_proveedor?: number;
    id_programa_asociado?: number;
    publicado?: boolean | number;
    mes_pago?: string;
    twiins?: boolean | number;
    jornadas?: string;
    certificado?: boolean | number;
    anio_formacion?: number;
    mes_formacion?: string;
}

interface StructureProps {
    empresas: Entity[];
    areas: Entity[];
    departamentos: Entity[];
    cdcs: any[];
    categorias: Entity[];
    habilidades: Entity[];
    proveedores: Entity[];
    programas_asociados: Entity[];
    presupuestos: any[];
    cursos: any[];
    cursos_tipos: any[];
    modalidades: any[];
}

const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
};

export default function Structure({ empresas, areas, departamentos, cdcs, categorias, habilidades, proveedores, programas_asociados, presupuestos, cursos, cursos_tipos, modalidades }: StructureProps) {
    const [editingItem, setEditingItem] = useState<{ type: string; item: Entity | null; label: string; isNew: boolean } | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: string; item: Entity } | null>(null);
    const [budgetItems, setBudgetItems] = useState<{id_departamento: string; nombre: string; inicial: string; areaId: number; areaName: string}[]>([]);
    const [selectedBudgetArea, setSelectedBudgetArea] = useState<number | undefined>(undefined);
    const [presupFilterArea, setPresupFilterArea] = useState<number | undefined>(undefined);
    const [presupFilterYear, setPresupFilterYear] = useState<number | undefined>(undefined);
    const [formData, setFormData] = useState<any>({
        value: '', parentId: '', descripcion: '', activo: true, contacto: '', telefono: '', email: '',
        fecha: new Date().getFullYear(),
        inicial: '', id_departamento: '', inversion: '', id_grupo: '',
        nombre: '', inicio: '', fin: '', cant_horas: '', costo: '', capacidad: '',
        habilidad_id: '', categoria_id: '', id_cdc: '', id_modalidad: '', id_tipo: '',
        id_proveedor: '', id_programa_asociado: '', publicado: false, mes_pago: '',
        twiins: false, jornadas: '', certificado: false, anio_formacion: '', mes_formacion: '',
    });

    // Filter presupuesto grupos
    const filteredPresupuestos = useMemo(() => {
        let data = presupuestos;
        if (presupFilterYear) {
            data = data.filter((g: any) => g.fecha === presupFilterYear);
        }
        if (presupFilterArea) {
            // Filter grupos that have at least one item in the selected area
            data = data.filter((g: any) => g.items?.some((item: any) => item.departamento?.area?.id === presupFilterArea));
        }
        return data;
    }, [presupuestos, presupFilterArea, presupFilterYear]);

    // Distinct years from presupuesto grupos
    const presupYears = useMemo(() => {
        const years = [...new Set(presupuestos.map((g: any) => g.fecha))].filter(Boolean).sort((a: number, b: number) => b - a);
        return years;
    }, [presupuestos]);

    const hasPresupFilters = presupFilterArea || presupFilterYear;

    const handleEdit = (type: string, item: any, label: string) => {
        setEditingItem({ type, item, label, isNew: false });
        if (type === 'cursos') {
            setFormData({
                nombre: item.nombre || '', descripcion: item.descripcion || '',
                inicio: item.inicio ? String(item.inicio).slice(0,10) : '',
                fin: item.fin ? String(item.fin).slice(0,10) : '',
                cant_horas: item.cant_horas || '', costo: item.costo || '', capacidad: item.capacidad || '',
                habilidad_id: item.habilidad_id?.toString() || '',
                categoria_id: item.categoria_id?.toString() || '',
                id_cdc: item.id_cdc?.toString() || '',
                id_modalidad: item.id_modalidad?.toString() || '',
                id_tipo: item.id_tipo?.toString() || '',
                id_proveedor: item.id_proveedor?.toString() || '',
                id_programa_asociado: item.id_programa_asociado?.toString() || '',
                publicado: !!item.publicado, mes_pago: item.mes_pago || '',
                twiins: !!item.twiins, jornadas: item.jornadas || '',
                certificado: !!item.certificado,
                anio_formacion: item.anio_formacion || '', mes_formacion: item.mes_formacion || '',
            });
        } else {
            setFormData({
                value: item[label] || '',
                parentId: type === 'areas' ? item.id_empresa?.toString() :
                          type === 'departamentos' ? item.id_area?.toString() : '',
                descripcion: item.descripcion || '',
                activo: item.activo === undefined ? true : !!item.activo,
                contacto: item.contacto || '', telefono: item.telefono || '', email: item.email || '',
                fecha: item.fecha || new Date().getFullYear(),
                inicial: item.inicial || '',
                id_departamento: item.id_departamento?.toString() || '',
                id_grupo: item.id_grupo?.toString() || '',
                inversion: item.inversion || '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleCreate = (type: string, label: string) => {
        setEditingItem({ type, item: null, label, isNew: true });
        setFormData({
            value: '', parentId: '', descripcion: '', activo: true, contacto: '', telefono: '', email: '',
            fecha: new Date().getFullYear(), inicial: '', id_departamento: '', inversion: '',
            nombre: '', inicio: '', fin: '', cant_horas: '', costo: '', capacidad: '',
            habilidad_id: '', categoria_id: '', id_cdc: '', id_modalidad: '', id_tipo: '',
            id_proveedor: '', id_programa_asociado: '', publicado: false, mes_pago: '',
            twiins: false, jornadas: '', certificado: false, anio_formacion: '', mes_formacion: '',
        });
        if (type === 'presupuestos') {
            setBudgetItems([]);
            setSelectedBudgetArea(undefined);
            if (label && typeof label === 'number') { // If group ID passed via label
                 setFormData(prev => ({ ...prev, id_grupo: label.toString() }));
            }
        }
        setIsDialogOpen(true);
    };

    const handleCreateInGroup = (groupId: number) => {
        setEditingItem({ type: 'presupuestos', item: null, label: 'inicial', isNew: true });
        setFormData({
            ...formData,
            id_grupo: groupId.toString(),
            fecha: new Date().getFullYear(),
            inicial: '', id_departamento: '', descripcion: '',
        });
        setBudgetItems([]);
        setSelectedBudgetArea(undefined);
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

        let payload: any = {};

        if (editingItem.type === 'cursos') {
            payload = {
                nombre: formData.nombre,
                descripcion: formData.descripcion || null,
                inicio: formData.inicio,
                fin: formData.fin,
                cant_horas: formData.cant_horas ? parseFloat(formData.cant_horas) : null,
                costo: parseFloat(formData.costo) || 0,
                capacidad: parseInt(formData.capacidad) || 1,
                habilidad_id: formData.habilidad_id || null,
                categoria_id: formData.categoria_id || null,
                id_cdc: formData.id_cdc || null,
                id_modalidad: formData.id_modalidad || null,
                id_tipo: formData.id_tipo || null,
                id_proveedor: formData.id_proveedor || null,
                id_programa_asociado: formData.id_programa_asociado || null,
                publicado: formData.publicado ? 1 : 0,
                mes_pago: formData.mes_pago || null,
                twiins: formData.twiins ? 1 : 0,
                jornadas: formData.jornadas || null,
                certificado: formData.certificado ? 1 : 0,
                anio_formacion: formData.anio_formacion ? parseInt(formData.anio_formacion) : null,
                mes_formacion: formData.mes_formacion || null,
            };
        } else if (editingItem.type === 'presupuestos') {
            if (editingItem.isNew && budgetItems.length > 0) {
                // Batch creation: multiple departments
                payload = {
                    fecha: parseInt(formData.fecha) || new Date().getFullYear(),
                    descripcion: formData.descripcion || null,
                    items: budgetItems.filter(bi => bi.id_departamento && bi.inicial).map(bi => ({
                        id_departamento: parseInt(bi.id_departamento),
                        inicial: parseFloat(bi.inicial) || 0,
                    })),
                };
            } else {
                payload = {
                    fecha: parseInt(formData.fecha) || new Date().getFullYear(),
                    descripcion: formData.descripcion || null,
                    inicial: parseFloat(formData.inicial) || 0,
                    id_departamento: formData.id_departamento || null,
                    id_grupo: formData.id_grupo || null,
                };
            }
        } else if (editingItem.type === 'cdcs') {
            payload = {
                [editingItem.label]: formData.value,
                descripcion: formData.descripcion || null,
                inversion: parseFloat(formData.inversion) || 0,
                id_departamento: formData.id_departamento || null,
            };
        } else {
            payload = {
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
        }

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
        { id: 'departamentos', title: 'Depts.', data: departamentos, label: 'nombre' },
        { id: 'cdcs', title: 'CDCs', data: cdcs, label: 'cdc' },
        { id: 'categorias', title: 'Categorías', data: categorias, label: 'categoria' },
        { id: 'habilidades', title: 'Habilidades', data: habilidades, label: 'habilidad' },
        { id: 'proveedores', title: 'Proveedores', data: proveedores, label: 'provedor' },
        { id: 'programas_asociados', title: 'Programas', data: programas_asociados, label: 'programa' },
        { id: 'presupuestos', title: 'Presupuestos', data: filteredPresupuestos, label: 'inicial' },
        { id: 'cursos', title: 'Cursos', data: cursos, label: 'nombre' },
    ];

    const getColumns = (section: any) => {
        const baseColumns: any[] = [
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80, render: (id: number) => <span className="font-mono text-xs text-tuteur-grey-mid font-bold">#{id}</span> }
        ];

        if (section.id === 'presupuestos') {
            baseColumns.push(
                { title: 'Área', key: 'area', render: (_: any, record: any) => (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-50 rounded-md flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-tuteur-red" />
                        </div>
                        <span className="font-bold text-tuteur-grey text-sm tracking-tight">{record.departamento?.area?.nombre || '—'}</span>
                    </div>
                )},
                { title: 'Departamento', key: 'departamento', render: (_: any, record: any) => <span className="text-xs text-tuteur-grey-mid font-semibold">{record.departamento?.nombre || '—'}</span> },
                { title: 'Año', dataIndex: 'fecha', key: 'fecha', render: (fecha: number) => <Tag color="red" className="font-black border-none">{fecha}</Tag> },
                { title: 'Inicial', dataIndex: 'inicial', key: 'inicial', align: 'right', render: (val: number) => <span className="text-xs font-bold text-tuteur-grey-mid">{formatCurrency(val)}</span> },
                { title: 'Actual', dataIndex: 'actual', key: 'actual', align: 'right', render: (val: number) => (
                    <span className="inline-flex items-center gap-1 text-sm font-black text-tuteur-red bg-red-50 px-3 py-1 rounded-lg">
                        <DollarSign className="h-3.5 w-3.5" />{formatCurrency(val)}
                    </span>
                )}
            );
        } else if (section.id === 'cursos') {
            baseColumns.push(
                { title: 'Nombre', key: 'nombre', render: (_: any, record: any) => (
                    <div className="max-w-[180px]">
                        <span className="font-bold text-slate-700 text-sm block leading-tight">{record.nombre}</span>
                        <span className="text-xs text-slate-400 italic" title={record.descripcion}>{record.descripcion ? record.descripcion.slice(0,40) + (record.descripcion.length > 40 ? '…' : '') : ''}</span>
                    </div>
                )},
                { title: 'Inicio / Fin', key: 'fechas', render: (_: any, record: any) => (
                    <>
                        <span className="text-xs text-slate-600 font-semibold block">{record.inicio ? String(record.inicio).slice(0,10) : '—'}</span>
                        <span className="text-[10px] text-slate-400">{record.fin ? String(record.fin).slice(0,10) : '—'}</span>
                    </>
                )},
                { title: 'Hrs / Costo', key: 'hrscosto', render: (_: any, record: any) => (
                    <>
                        <span className="text-xs font-bold text-slate-600 block">{record.cant_horas ? `${record.cant_horas}h` : '—'}</span>
                        <span className="text-xs text-tuteur-red font-black">{record.costo ? formatCurrency(record.costo) : '—'}</span>
                    </>
                )},
                { title: 'CDC / Inversión', key: 'cdc', render: (_: any, record: any) => (
                    <>
                        <span className="text-xs font-bold text-slate-700 block">{record.cdc?.cdc || '—'}</span>
                        <span className="text-[10px] text-tuteur-grey-mid font-bold">{record.cdc?.inversion ? formatCurrency(record.cdc.inversion) : ''}</span>
                    </>
                )},
                { title: 'Modalidad / Tipo', key: 'modtipo', render: (_: any, record: any) => (
                    <>
                        <Tag color="red" className="font-black uppercase block w-fit mb-0.5 text-[10px] border-none">{record.modalidad?.modalidad || '—'}</Tag>
                        <Tag color="default" className="font-black uppercase block w-fit text-[10px] border-none">{record.tipo?.tipo || '—'}</Tag>
                    </>
                )},
                { title: 'Proveedor', key: 'proveedor', render: (_: any, record: any) => <span className="text-xs text-slate-500 font-semibold">{record.proveedor?.provedor || '—'}</span> },
                { title: 'Pub.', dataIndex: 'publicado', key: 'publicado', align: 'center', render: (pub: boolean) => pub ? <CheckCircle2 className="h-4 w-4 text-tuteur-red mx-auto" /> : <XCircle className="h-4 w-4 text-gray-300 mx-auto" /> }
            );
        } else {
            baseColumns.push(
                { title: 'Nombre / Valor', key: 'valor', render: (_: any, record: any) => <span className="font-bold text-slate-600 text-sm tracking-tight">{record[section.label] || 'N/A'}</span> }
            );

            if (section.id === 'proveedores') {
                baseColumns.push(
                    { title: 'Contacto', dataIndex: 'contacto', key: 'contacto', render: (val: string) => <span className="text-xs text-slate-500">{val || '—'}</span> },
                    { title: 'Teléfono', dataIndex: 'telefono', key: 'telefono', render: (val: string) => <span className="text-xs text-slate-500">{val || '—'}</span> },
                    { title: 'Email', dataIndex: 'email', key: 'email', render: (val: string) => <span className="text-xs text-slate-500">{val || '—'}</span> }
                );
            }

            if (['programas_asociados', 'habilidades', 'categorias', 'cdcs'].includes(section.id)) {
                baseColumns.push(
                    { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion', render: (val: string) => <p className="text-xs text-slate-400 line-clamp-1 italic font-medium max-w-[250px]">{val || 'Sin descripción'}</p> }
                );

                if (section.id === 'cdcs') {
                    baseColumns.push(
                        { title: 'Inversión', dataIndex: 'inversion', key: 'inversion', align: 'right', render: (val: number) => <span className="text-xs font-black text-tuteur-red">{val ? formatCurrency(val) : '—'}</span> },
                        { title: 'Departamento', key: 'departamentocdc', render: (_: any, record: any) => <span className="text-xs text-slate-500 font-semibold">{record.departamento?.nombre || '—'}</span> }
                    );
                }

                if (section.id === 'programas_asociados') {
                    baseColumns.push(
                        { title: 'Estado', dataIndex: 'activo', key: 'estado', align: 'center', render: (activo: boolean) => activo ? <CheckCircle2 className="h-4 w-4 text-tuteur-red mx-auto" /> : <XCircle className="h-4 w-4 text-gray-300 mx-auto" /> }
                    );
                }
            }
        }

        baseColumns.push({
            title: 'Acciones',
            key: 'acciones',
            align: 'right',
            render: (_: any, item: any) => (
                <div className="flex justify-end gap-1">
                    <Tooltip title={`Editar ${section.id.slice(0, -1)}`}>
                        <Button
                            type="text"
                            icon={<Pencil className="h-4 w-4 text-slate-400 hover:text-primary transition-all" />}
                            onClick={() => handleEdit(section.id, item, section.label)}
                        />
                    </Tooltip>
                    <Tooltip title={`Eliminar ${section.id.slice(0, -1)}`} color="red">
                        <Button
                            type="text"
                            danger
                            icon={<Trash2 className="h-4 w-4 hover:text-red-500 transition-all" />}
                            onClick={() => handleDeleteClick(section.id, item)}
                        />
                    </Tooltip>
                </div>
            )
        });

        return baseColumns;
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '/admin' }, { title: 'Estructura', href: '/admin/structure' }]}>
            <Head title="Gestión de Estructura" />
            <div className="p-4 space-y-4">
                <h1 className="text-2xl font-bold italic text-tuteur-red">Gestión Administrativa</h1>

                <Tabs
                    defaultActiveKey="empresas"
                    className="w-full bg-gray-50 p-2 rounded-xl"
                    items={sections.map(section => ({
                        key: section.id,
                        label: <span className="text-[12px] font-black uppercase tracking-wider">{section.title}</span>,
                        children: (
                            <Card
                                title={
                                    <div className="flex items-center gap-2">
                                        {section.id === 'presupuestos' && <DollarSign className="text-tuteur-red" />}
                                        {section.id === 'cursos' && <BookOpen className="text-tuteur-red" />}
                                        <span className="font-bold uppercase tracking-wide">{section.title}</span>
                                        {section.id === 'presupuestos' && (
                                            <Tag color="red" className="font-black border-none m-0">{filteredPresupuestos.length}</Tag>
                                        )}
                                    </div>
                                }
                                extra={
                                    <Button type="primary" onClick={() => handleCreate(section.id, section.label)} className="bg-tuteur-red hover:bg-tuteur-red-dark border-none font-black uppercase text-xs">
                                        + Nuevo
                                    </Button>
                                }
                                className="shadow-sm mt-2"
                            >
                                {section.id === 'presupuestos' && (
                                    <div className="mb-3 flex flex-wrap items-center gap-3 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2 text-tuteur-grey-mid">
                                            <Filter className="h-4 w-4" />
                                            <span className="text-xs font-black uppercase tracking-wider">Filtros</span>
                                        </div>
                                        <Select
                                            placeholder="Área"
                                            allowClear
                                            value={presupFilterArea}
                                            onChange={setPresupFilterArea}
                                            className="w-48"
                                            size="small"
                                            options={areas.map((a: any) => ({ value: a.id, label: a.nombre }))}
                                        />
                                        <Select
                                            placeholder="Año"
                                            allowClear
                                            value={presupFilterYear}
                                            onChange={setPresupFilterYear}
                                            className="w-28"
                                            size="small"
                                            options={presupYears.map((y: number) => ({ value: y, label: String(y) }))}
                                        />
                                        {hasPresupFilters && (
                                            <Button
                                                size="small"
                                                onClick={() => { setPresupFilterArea(undefined); setPresupFilterYear(undefined); }}
                                                icon={<X className="h-3 w-3" />}
                                                className="text-tuteur-grey-mid font-bold text-xs uppercase"
                                            >
                                                Limpiar
                                            </Button>
                                        )}
                                        {filteredPresupuestos.length > 0 && (
                                            <div className="ml-auto flex items-center gap-4 text-xs">
                                                <span className="text-tuteur-grey-mid font-bold">Inicial: <span className="text-tuteur-grey">{formatCurrency(filteredPresupuestos.reduce((s: number, g: any) => s + (parseFloat(g.total_inicial) || 0), 0))}</span></span>
                                                <span className="text-tuteur-red font-black">Actual: {formatCurrency(filteredPresupuestos.reduce((s: number, g: any) => s + (parseFloat(g.total_actual) || 0), 0))}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {section.id === 'presupuestos' ? (
                                    <div className="space-y-2">
                                        {filteredPresupuestos.length === 0 ? (
                                            <div className="text-center py-8 text-tuteur-grey-mid text-sm">No hay presupuestos registrados.</div>
                                        ) : (
                                            <Collapse
                                                defaultActiveKey={filteredPresupuestos.length <= 2 ? filteredPresupuestos.map((g: any) => `grupo-${g.id}`) : []}
                                                expandIcon={({ isActive }) => <ChevronDown className={`h-4 w-4 text-tuteur-red transition-transform ${isActive ? 'rotate-180' : ''}`} />}
                                                items={filteredPresupuestos.map((grupo: any) => {
                                                    // Group items by area
                                                    const areaGroups: Record<number, { areaName: string; items: any[]; totalInicial: number; totalActual: number }> = {};
                                                    (grupo.items || []).forEach((item: any) => {
                                                        const areaId = item.departamento?.area?.id || 0;
                                                        const areaName = item.departamento?.area?.nombre || 'Sin \u00c1rea';
                                                        if (!areaGroups[areaId]) {
                                                            areaGroups[areaId] = { areaName, items: [], totalInicial: 0, totalActual: 0 };
                                                        }
                                                        areaGroups[areaId].items.push(item);
                                                        areaGroups[areaId].totalInicial += parseFloat(item.inicial) || 0;
                                                        areaGroups[areaId].totalActual += parseFloat(item.actual) || 0;
                                                    });
                                                    const sortedAreas = Object.entries(areaGroups).sort(([, a], [, b]) => a.areaName.localeCompare(b.areaName));

                                                    return {
                                                        key: `grupo-${grupo.id}`,
                                                        label: (
                                                            <div className="flex items-center justify-between w-full pr-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                                                        <DollarSign className="h-4 w-4 text-tuteur-red" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-black text-tuteur-grey text-sm block">{grupo.descripcion || 'Presupuesto sin descripci\u00f3n'}</span>
                                                                        <span className="text-xs text-tuteur-grey-mid">
                                                                            <Tag color="red" className="font-black border-none text-[10px] m-0 mr-1">{grupo.fecha}</Tag>
                                                                            {sortedAreas.length} \u00e1rea{sortedAreas.length > 1 ? 's' : ''} \u00b7 {(grupo.items || []).length} depto{(grupo.items || []).length > 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-6">
                                                                    <span className="text-xs font-bold text-tuteur-grey-mid">Inicial: <span className="text-tuteur-grey">{formatCurrency(grupo.total_inicial)}</span></span>
                                                                    <span className="inline-flex items-center gap-1 text-xs font-black text-tuteur-red bg-red-50 px-2 py-0.5 rounded-md">
                                                                        <DollarSign className="h-3 w-3" />{formatCurrency(grupo.total_actual)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ),
                                                        children: (
                                                            <div className="space-y-1">
                                                                <Collapse
                                                                    defaultActiveKey={sortedAreas.length <= 3 ? sortedAreas.map(([id]) => `area-${id}`) : []}
                                                                    expandIcon={({ isActive }) => <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}`} />}
                                                                    size="small"
                                                                    items={sortedAreas.map(([areaId, areaData]) => ({
                                                                        key: `area-${areaId}`,
                                                                        label: (
                                                                            <div className="flex items-center justify-between w-full pr-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Building2 className="h-3.5 w-3.5 text-tuteur-red" />
                                                                                    <span className="font-bold text-tuteur-grey text-xs">{areaData.areaName}</span>
                                                                                    <Tag color="default" className="font-bold border-none text-[10px] m-0">{areaData.items.length} dptos</Tag>
                                                                                </div>
                                                                                <div className="flex items-center gap-4">
                                                                                    <span className="text-[11px] font-bold text-tuteur-grey-mid">{formatCurrency(areaData.totalInicial)}</span>
                                                                                    <span className="text-[11px] font-black text-tuteur-red">{formatCurrency(areaData.totalActual)}</span>
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                        children: (
                                                                            <Table
                                                                                columns={[
                                                                                    { title: 'ID', dataIndex: 'id', key: 'id', width: 50, render: (id: number) => <span className="font-mono text-xs text-tuteur-grey-mid font-bold">#{id}</span> },
                                                                                    { title: 'Departamento', key: 'departamento', render: (_: any, r: any) => <span className="font-bold text-tuteur-grey text-sm">{r.departamento?.nombre || '\u2014'}</span> },
                                                                                    { title: 'Inicial', dataIndex: 'inicial', key: 'inicial', align: 'right' as const, width: 120, render: (val: number) => <span className="text-xs font-bold text-tuteur-grey-mid">{formatCurrency(val)}</span> },
                                                                                    { title: 'Actual', dataIndex: 'actual', key: 'actual', align: 'right' as const, width: 140, render: (val: number) => (
                                                                                        <span className="inline-flex items-center gap-1 text-sm font-black text-tuteur-red bg-red-50 px-3 py-1 rounded-lg">
                                                                                            <DollarSign className="h-3.5 w-3.5" />{formatCurrency(val)}
                                                                                        </span>
                                                                                    )},
                                                                                    {
                                                                                        title: 'Acciones',
                                                                                        key: 'acciones',
                                                                                        align: 'right' as const,
                                                                                        width: 80,
                                                                                        render: (_: any, item: any) => (
                                                                                            <div className="flex justify-end gap-1">
                                                                                                <Tooltip title="Editar"><Button type="text" icon={<Pencil className="h-3.5 w-3.5 text-slate-400" />} onClick={() => handleEdit('presupuestos', item, 'inicial')} /></Tooltip>
                                                                                                <Tooltip title="Eliminar" color="red"><Button type="text" danger icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => handleDeleteClick('presupuestos', item)} /></Tooltip>
                                                                                            </div>
                                                                                        ),
                                                                                    },
                                                                                ]}
                                                                                dataSource={areaData.items}
                                                                                rowKey="id"
                                                                                pagination={false}
                                                                                size="small"
                                                                            />
                                                                        ),
                                                                    }))}
                                                                    className="bg-white"
                                                                />
                                                            </div>
                                                        ),
                                                    };
                                                })}
                                                className="bg-white"
                                            />
                                        )}
                                        {filteredPresupuestos.length > 0 && (
                                            <div className="flex items-center justify-between px-4 py-3 bg-red-50 rounded-lg border border-red-100">
                                                <span className="font-black text-tuteur-grey text-sm">Total General ({filteredPresupuestos.length} presupuesto{filteredPresupuestos.length > 1 ? 's' : ''})</span>
                                                <div className="flex items-center gap-6">
                                                    <span className="text-sm font-bold text-tuteur-grey">Inicial: {formatCurrency(filteredPresupuestos.reduce((s: number, g: any) => s + (parseFloat(g.total_inicial) || 0), 0))}</span>
                                                    <span className="inline-flex items-center gap-1 text-sm font-black text-tuteur-red">
                                                        <DollarSign className="h-4 w-4" />Actual: {formatCurrency(filteredPresupuestos.reduce((s: number, g: any) => s + (parseFloat(g.total_actual) || 0), 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Table
                                        columns={getColumns(section)}
                                        dataSource={section.data}
                                        rowKey="id"
                                        pagination={{ pageSize: 15 }}
                                        size="small"
                                        className="overflow-x-auto"
                                    />
                                )}
                            </Card>
                        )
                    }))}
                />
            </div>

            {/* MODAL DE EDICIÓN / CREACIÓN */}
            <Modal
                title={
                    <div className="font-bold uppercase tracking-wide flex items-center gap-2 text-xl">
                        {editingItem?.type === 'presupuestos' && <DollarSign className="text-emerald-500" />}
                        {editingItem?.type === 'cursos' && <BookOpen className="text-blue-500" />}
                        {editingItem?.isNew ? 'Nuevo Registro' : 'Editar Registro'} - {editingItem?.type?.replace('_', ' ')}
                    </div>
                }
                open={isDialogOpen}
                onCancel={() => setIsDialogOpen(false)}
                width={editingItem?.type === 'cursos' ? 700 : editingItem?.type === 'presupuestos' ? 600 : 500}
                centered
                footer={[
                    <Button key="back" onClick={() => setIsDialogOpen(false)} size="large">Cancelar</Button>,
                    <Button key="submit" type="primary" onClick={handleSubmit} size="large" className="font-bold uppercase">
                        {editingItem?.isNew ? 'Crear Registro' : 'Guardar Cambios'}
                    </Button>
                ]}
            >
                <div className="pt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {editingItem?.type === 'cursos' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold">Nombre *</label>
                                <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Nombre del curso..." size="large" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold">Descripción</label>
                                <Input value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Descripción..." size="large" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm font-semibold">Inicio *</label><Input type="date" value={formData.inicio} onChange={e => setFormData({...formData, inicio: e.target.value})} size="large" /></div>
                                <div><label className="text-sm font-semibold">Fin *</label><Input type="date" value={formData.fin} onChange={e => setFormData({...formData, fin: e.target.value})} size="large" /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="text-sm font-semibold">Horas</label><Input type="number" value={formData.cant_horas} onChange={e => setFormData({...formData, cant_horas: e.target.value})} placeholder="0" size="large" /></div>
                                <div><label className="text-sm font-semibold">Costo *</label><Input type="number" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} placeholder="0" size="large" /></div>
                                <div><label className="text-sm font-semibold">Capacidad *</label><Input type="number" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} placeholder="1" size="large" /></div>
                            </div>
                            {/* Selects for Cursos */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold">Habilidad</label>
                                    <Select className="w-full" size="large" value={formData.habilidad_id} onChange={v => setFormData({...formData, habilidad_id: v})} placeholder="Habilidad...">
                                        {habilidades.map((h: any) => <Select.Option key={h.id} value={h.id.toString()}>{h.habilidad}</Select.Option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold">Categoría</label>
                                    <Select className="w-full" size="large" value={formData.categoria_id} onChange={v => setFormData({...formData, categoria_id: v})} placeholder="Categoría...">
                                        {categorias.map((c: any) => <Select.Option key={c.id} value={c.id.toString()}>{c.categoria}</Select.Option>)}
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold">CDC</label>
                                    <Select className="w-full" size="large" value={formData.id_cdc} onChange={v => setFormData({...formData, id_cdc: v})} placeholder="CDC...">
                                        {cdcs.map((c: any) => <Select.Option key={c.id} value={c.id.toString()}>{c.cdc}</Select.Option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold">Modalidad</label>
                                    <Select className="w-full" size="large" value={formData.id_modalidad} onChange={v => setFormData({...formData, id_modalidad: v})} placeholder="Modalidad...">
                                        {modalidades.map((m: any) => <Select.Option key={m.id} value={m.id.toString()}>{m.modalidad}</Select.Option>)}
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold">Tipo</label>
                                    <Select className="w-full" size="large" value={formData.id_tipo} onChange={v => setFormData({...formData, id_tipo: v})} placeholder="Tipo...">
                                        {cursos_tipos.map((t: any) => <Select.Option key={t.id} value={t.id.toString()}>{t.tipo}</Select.Option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold">Proveedor</label>
                                    <Select className="w-full" size="large" value={formData.id_proveedor} onChange={v => setFormData({...formData, id_proveedor: v})} placeholder="Proveedor...">
                                        {proveedores.map((p: any) => <Select.Option key={p.id} value={p.id.toString()}>{p.provedor}</Select.Option>)}
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold">Programa Asociado</label>
                                <Select className="w-full" size="large" value={formData.id_programa_asociado} onChange={v => setFormData({...formData, id_programa_asociado: v})} placeholder="Programa...">
                                    {programas_asociados.map((p: any) => <Select.Option key={p.id} value={p.id.toString()}>{p.programa}</Select.Option>)}
                                </Select>
                            </div>
                            <Space size="large">
                                <Form.Item label="Publicado" valuePropName="checked" className="mb-0">
                                    <Switch checked={formData.publicado} onChange={c => setFormData({...formData, publicado: c})} />
                                </Form.Item>
                                <Form.Item label="Certificado" valuePropName="checked" className="mb-0">
                                    <Switch checked={formData.certificado} onChange={c => setFormData({...formData, certificado: c})} />
                                </Form.Item>
                                <Form.Item label="Twiins" valuePropName="checked" className="mb-0">
                                    <Switch checked={formData.twiins} onChange={c => setFormData({...formData, twiins: c})} />
                                </Form.Item>
                            </Space>
                        </div>
                    )}
                    {editingItem?.type === 'presupuestos' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold">Año</label>
                                <Input type="number" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} size="large" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold">Descripción</label>
                                <Input.TextArea
                                    value={formData.descripcion}
                                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                    placeholder="Descripción del presupuesto (opcional)"
                                    rows={2}
                                    maxLength={500}
                                    showCount
                                />
                            </div>

                            {editingItem.isNew ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-semibold">Agregar Área</label>
                                        <Select
                                            className="w-full"
                                            size="large"
                                            placeholder="Seleccionar área para agregar..."
                                            value={selectedBudgetArea}
                                            onChange={(areaId: number) => {
                                                setSelectedBudgetArea(areaId);
                                                const areaObj = areas.find((a: any) => a.id === areaId);
                                                const areaName = areaObj?.nombre || 'Sin nombre';
                                                const areaDepts = departamentos.filter((d: any) => d.id_area === areaId || d.area?.id === areaId);
                                                // Add only departments not already in the list
                                                const existingIds = new Set(budgetItems.map(bi => bi.id_departamento));
                                                const newItems = areaDepts
                                                    .filter((d: any) => !existingIds.has(d.id.toString()))
                                                    .map((d: any) => ({
                                                        id_departamento: d.id.toString(),
                                                        nombre: d.nombre,
                                                        inicial: '',
                                                        areaId,
                                                        areaName,
                                                    }));
                                                setBudgetItems(prev => [...prev, ...newItems]);
                                            }}
                                            options={areas.map((a: any) => ({ value: a.id, label: a.nombre }))}
                                        />
                                    </div>

                                    {budgetItems.length > 0 && (
                                        <div>
                                            <label className="text-sm font-black uppercase tracking-wider text-tuteur-grey">Asignación por Departamento</label>
                                            <div className="border rounded-lg overflow-hidden mt-2">
                                                <div className="divide-y max-h-80 overflow-y-auto">
                                                    {(() => {
                                                        // Group by area
                                                        const areaGroups: Record<number, typeof budgetItems> = {};
                                                        budgetItems.forEach(bi => {
                                                            if (!areaGroups[bi.areaId]) areaGroups[bi.areaId] = [];
                                                            areaGroups[bi.areaId].push(bi);
                                                        });
                                                        return Object.entries(areaGroups).map(([areaId, items]) => (
                                                            <div key={areaId}>
                                                                <div className="bg-gray-100 px-3 py-2 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Building2 className="h-4 w-4 text-tuteur-red" />
                                                                        <span className="text-xs font-black uppercase tracking-wider text-tuteur-grey">{items[0].areaName}</span>
                                                                        <Tag color="default" className="font-bold border-none text-[10px] m-0">{items.length} dptos</Tag>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-tuteur-red">
                                                                        {formatCurrency(items.reduce((s, b) => s + (parseFloat(b.inicial) || 0), 0))}
                                                                    </span>
                                                                </div>
                                                                {items.map(bi => {
                                                                    const globalIdx = budgetItems.findIndex(b => b.id_departamento === bi.id_departamento);
                                                                    return (
                                                                        <div key={bi.id_departamento} className="grid grid-cols-12 gap-2 items-center px-3 py-2 hover:bg-gray-50">
                                                                            <div className="col-span-7">
                                                                                <span className="text-sm font-semibold text-tuteur-grey">{bi.nombre}</span>
                                                                            </div>
                                                                            <div className="col-span-5">
                                                                                <Input
                                                                                    type="number"
                                                                                    size="small"
                                                                                    placeholder="0.00"
                                                                                    value={bi.inicial}
                                                                                    onChange={e => {
                                                                                        const items = [...budgetItems];
                                                                                        items[globalIdx].inicial = e.target.value;
                                                                                        setBudgetItems(items);
                                                                                    }}
                                                                                    prefix={<DollarSign className="h-3 w-3 text-gray-400" />}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                                <div className="bg-red-50 px-3 py-2 border-t flex justify-between items-center">
                                                    <span className="text-xs font-bold text-tuteur-grey-mid">
                                                        {budgetItems.filter(b => b.inicial && parseFloat(b.inicial) > 0).length} de {budgetItems.length} departamento(s) con valor
                                                    </span>
                                                    <span className="text-sm font-black text-tuteur-red">
                                                        Total: {formatCurrency(budgetItems.reduce((sum, b) => sum + (parseFloat(b.inicial) || 0), 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedBudgetArea && budgetItems.filter(b => b.areaId === selectedBudgetArea).length === 0 && (
                                        <div className="text-center py-6 text-tuteur-grey-mid text-sm">
                                            No hay departamentos asignados a esta área.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Edit single presupuesto */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-tuteur-grey-mid uppercase tracking-wide">Grupo de Presupuesto</label>
                                            <Select
                                                className="w-full"
                                                size="large"
                                                value={formData.id_grupo}
                                                onChange={v => setFormData({...formData, id_grupo: v})}
                                                placeholder="Sin grupo..."
                                                allowClear
                                            >
                                                {presupuestos.map((g: any) => <Select.Option key={g.id} value={g.id.toString()}>{g.descripcion || `Grupo ${g.fecha}`} ({g.fecha})</Select.Option>)}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-tuteur-grey-mid uppercase tracking-wide">A\u00f1o</label>
                                            <Input type="number" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} size="large" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold">Departamento</label>
                                        <Select className="w-full" size="large" value={formData.id_departamento} onChange={v => setFormData({...formData, id_departamento: v})} placeholder="Seleccionar...">
                                            {departamentos.map((d: any) => <Select.Option key={d.id} value={d.id.toString()}>{d.area?.nombre} / {d.nombre}</Select.Option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold">Monto Inicial</label>
                                        <Input type="number" value={formData.inicial} onChange={e => setFormData({...formData, inicial: e.target.value})} size="large" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold">Descripción</label>
                                        <Input.TextArea
                                            value={formData.descripcion}
                                            onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                            placeholder="Descripción del presupuesto (opcional)"
                                            rows={2}
                                            maxLength={500}
                                            showCount
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {editingItem?.type !== 'cursos' && editingItem?.type !== 'presupuestos' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold capitalize">{editingItem?.label?.replace('_', ' ') || 'Valor'}</label>
                                <Input value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} size="large" />
                            </div>
                            {(editingItem?.type === 'areas' || editingItem?.type === 'departamentos') && (
                                <div>
                                    <label className="text-sm font-semibold">{editingItem.type === 'areas' ? 'Empresa' : 'Área'}</label>
                                    <Select className="w-full" size="large" value={formData.parentId} onChange={v => setFormData({...formData, parentId: v})} placeholder="Seleccionar...">
                                        {(editingItem.type === 'areas' ? empresas : areas).map((e: any) => <Select.Option key={e.id} value={e.id.toString()}>{e.nombre}</Select.Option>)}
                                    </Select>
                                </div>
                            )}
                            {['programas_asociados', 'habilidades', 'categorias', 'cdcs'].includes(editingItem?.type || '') && (
                                <div>
                                    <label className="text-sm font-semibold">Descripción</label>
                                    <Input value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} size="large" />
                                </div>
                            )}
                            {editingItem?.type === 'cdcs' && (
                                <>
                                    <div><label className="text-sm font-semibold">Inversión ($)</label><Input type="number" value={formData.inversion} onChange={e => setFormData({...formData, inversion: e.target.value})} size="large" /></div>
                                    <div>
                                        <label className="text-sm font-semibold">Departamento</label>
                                        <Select className="w-full" size="large" value={formData.id_departamento} onChange={v => setFormData({...formData, id_departamento: v})} placeholder="Seleccionar...">
                                            {departamentos.map((d: any) => <Select.Option key={d.id} value={d.id.toString()}>{d.nombre}</Select.Option>)}
                                        </Select>
                                    </div>
                                </>
                            )}
                            {editingItem?.type === 'programas_asociados' && (
                                <Form.Item label="Activo" valuePropName="checked" className="mb-0">
                                    <Switch checked={formData.activo} onChange={c => setFormData({...formData, activo: c})} />
                                </Form.Item>
                            )}
                            {editingItem?.type === 'proveedores' && (
                                <>
                                    <div><label className="text-sm font-semibold">Contacto</label><Input value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} size="large" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-sm font-semibold">Teléfono</label><Input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} size="large" /></div>
                                        <div><label className="text-sm font-semibold">Email</label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} size="large" /></div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            <Modal
                title={
                    <div className="font-bold flex items-center gap-2 text-xl text-red-600">
                        <Trash2 className="h-5 w-5" /> Eliminar Registro
                    </div>
                }
                open={isDeleteDialogOpen}
                onCancel={() => setIsDeleteDialogOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>,
                    <Button key="submit" type="primary" danger onClick={confirmDelete}>Sí, eliminar</Button>
                ]}
            >
                <div className="py-4">
                    <p className="text-slate-600 font-medium">¿Estás seguro de que deseas eliminar este registro? Esta acción es permanente.</p>
                </div>
            </Modal>

        </AppLayout>
    );
}
