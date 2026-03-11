import { Modal, Button, Input, Select, Tabs, Checkbox, InputNumber, Tag, Tooltip, Progress, Switch, Cascader } from 'antd';
import { useState, useMemo, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Cdc, Habilidad, Presupuesto, Categoria, Proveedor, Modalidad, CursoTipo, User, PresupuestoGrupo, Curso, Area, Departamento } from '@/types/capacitaciones';
import { SelectableInput } from './SelectableInput';
import { Plus, Trash2, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

interface CdcItem {
    [key: string]: any;
    area_id: string;
    dept_id: string;
    cdc_id: string;
    monto: number;
}

interface AltaCursoModalProps {
    isOpen: boolean;
    onClose: () => void;
    editCourse?: Curso | null;
    metadata: {
        habilidades: Habilidad[];
        categorias: Categoria[];
        areas: Area[];
        departamentos: Departamento[];
        cdcs: Cdc[];
        proveedores: Proveedor[];
        modalidades: Modalidad[];
        cursos_tipos: CursoTipo[];
        users: User[];
        presupuestos?: (PresupuestoGrupo & { presupuestos?: Presupuesto[] })[];
    };
}

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function AltaCursoModal({ isOpen, onClose, editCourse, metadata }: AltaCursoModalProps) {
    const { errors } = usePage().props as any;
    const [selectedTab, setSelectedTab] = useState('abierto');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [cdcItems, setCdcItems] = useState<CdcItem[]>([]);
    const isEditing = !!editCourse;

    if (!metadata || !metadata.cdcs) return null;

    const emptyForm = {
        nombre: '',
        descripcion: '',
        id_proveedor: '',
        costo: '',
        id_habilidad: '',
        id_categoria: '',
        jornadas: '',
        cant_horas: '',
        id_modalidad: '',
        mes_pago: '',
        twiins: false,
        certificado: false,
        anio_formacion: new Date().getFullYear().toString(),
        mes_formacion: '',
        horarios: '',
        id_presupuesto: '',
        costo_cero: false,
        publicado: true,
        inicio: '',
        fin: '',
        capacidad: '30'
    };

    const [formData, setFormData] = useState(emptyForm);

    const resetForm = () => setFormData(emptyForm);

    // Populate form when editing
    useEffect(() => {
        if (isOpen) {
            if (editCourse) {
                const formatDate = (d: any) => {
                    if (!d) return '';
                    const date = new Date(d);
                    return date.toISOString().split('T')[0];
                };

                // Resolve tipo tab
                const tipoObj = editCourse.tipo;
                const tipoStr = typeof tipoObj === 'object' && tipoObj ? (tipoObj as CursoTipo).tipo : '';
                if (tipoStr) setSelectedTab(tipoStr.toLowerCase());

                setFormData({
                    nombre: editCourse.nombre || '',
                    descripcion: editCourse.descripcion || '',
                    id_proveedor: (editCourse as any).id_proveedor?.toString() || '',
                    costo: editCourse.costo?.toString() || '',
                    id_habilidad: (editCourse as any).habilidad_id?.toString() || (editCourse as any).id_habilidad?.toString() || '',
                    id_categoria: (editCourse as any).categoria_id?.toString() || (editCourse as any).id_categoria?.toString() || '',
                    jornadas: editCourse.jornadas || '',
                    cant_horas: editCourse.cant_horas?.toString() || '',
                    id_modalidad: editCourse.id_modalidad?.toString() || '',
                    mes_pago: editCourse.mes_pago || '',
                    twiins: editCourse.twiins || false,
                    certificado: editCourse.certificado || false,
                    anio_formacion: editCourse.anio_formacion?.toString() || new Date().getFullYear().toString(),
                    mes_formacion: editCourse.mes_formacion || '',
                    horarios: Array.isArray(editCourse.horarios) ? editCourse.horarios.join(', ') : (editCourse.horarios || ''),
                    inicio: formatDate(editCourse.inicio),
                    fin: formatDate(editCourse.fin),
                    capacidad: editCourse.capacidad?.toString() || '30',
                    id_presupuesto: editCourse.id_presupuesto?.toString() || '',
                    costo_cero: !!editCourse.costo_cero,
                    publicado: editCourse.publicado !== undefined ? !!editCourse.publicado : true,
                });

                // Populate CDC items from pivot
                if (editCourse.cdcs && editCourse.cdcs.length > 0) {
                    setCdcItems(editCourse.cdcs.map(c => {
                        const deptId = c.id_departamento?.toString() || '';
                        const dept = metadata.departamentos.find(d => String(d.id) === deptId);
                        const areaId = dept?.id_area?.toString() || '';

                        return {
                            area_id: areaId,
                            dept_id: deptId,
                            cdc_id: c.id.toString(),
                            monto: c.pivot?.monto || 0,
                        };
                    }));
                } else {
                    setCdcItems([]);
                }

                setSelectedUsers([]);
            } else {
                // Auto-select unique budget group or default to current year one
                const currentYear = new Date().getFullYear().toString();
                const defaultGroup = metadata.presupuestos?.length === 1
                    ? metadata.presupuestos[0].id.toString()
                    : (metadata.presupuestos || []).find(g => String(g.fecha) === currentYear)?.id.toString() || '';

                resetForm();
                if (defaultGroup) setFormData(prev => ({ ...prev, id_presupuesto: defaultGroup }));
            }
        } else {
            // Reset when modal closes
            setFormData(emptyForm);
            setCdcItems([]);
            setSelectedUsers([]);
            setSelectedTab('abierto');
        }
    }, [editCourse, isOpen, metadata.presupuestos]);

    const filteredUsers = useMemo(() => {
        return (metadata.users || []).filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [metadata.users, searchTerm]);

    // Budget calculation helper
    const getCdcBudgetInfo = (cdcId: string | null, monto: number, deptIdFromState?: string) => {
        const targetGroupId = formData.id_presupuesto
            ? parseInt(formData.id_presupuesto)
            : null;

        let presupuesto: Presupuesto | undefined;
        let deptId = deptIdFromState;

        // If cdcId is provided but no deptIdFromState, try to find deptId from cdc
        if (cdcId && !deptId) {
            const cdc = (metadata.cdcs || []).find(c => String(c.id) === String(cdcId));
            if (cdc) deptId = cdc.id_departamento?.toString();
        }

        if (targetGroupId && deptId) {
            const selectedGroup = (metadata.presupuestos || []).find(g => String(g.id) === String(targetGroupId));
            if (selectedGroup && selectedGroup.presupuestos) {
                presupuesto = selectedGroup.presupuestos.find(p => String(p.id_departamento) === String(deptId));
            }
        } else if (!targetGroupId) {
            return { error: 'Seleccione un grupo de presupuesto.' };
        }

        if (!presupuesto) return { error: 'Sin presupuesto en este grupo para este departamento.' };

        const totalDeduction = formData.costo_cero ? 0 : monto;
        const remaining = (presupuesto.actual || 0) - totalDeduction;
        const pctUsed = (presupuesto.inicial || 0) > 0
            ? (((presupuesto.inicial || 0) - remaining) / (presupuesto.inicial || 1)) * 100
            : 0;

        const dept = (metadata.departamentos || []).find(d => String(d.id) === String(deptId));

        return {
            departamento: dept?.nombre || 'N/A',
            area: dept?.area?.nombre || '',
            presupuestoInicial: presupuesto.inicial || 0,
            presupuestoActual: presupuesto.actual || 0,
            totalDeduction,
            remaining,
            pctUsed,
            sufficient: remaining >= 0
        };
    };

    const totalCdcMonto = cdcItems.reduce((sum, item) => sum + (item.monto || 0), 0);
    const costoNum = parseFloat(formData.costo) || 0;

    const handleUserToggle = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const addCdcItem = () => {
        setCdcItems(prev => [...prev, { area_id: '', dept_id: '', cdc_id: '', monto: 0 }]);
    };

    const removeCdcItem = (index: number) => {
        setCdcItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateCdcItem = (index: number, field: keyof CdcItem, value: any) => {
        setCdcItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const newItem = { ...item, [field]: value };
            if (field === 'area_id') {
                newItem.dept_id = '';
                newItem.cdc_id = '';
            } else if (field === 'dept_id') {
                // Auto-select CDC for this department
                const deptCdcs = (metadata.cdcs || []).filter(c => String(c.id_departamento) === String(value));
                if (deptCdcs.length === 1) {
                    // Only one CDC → auto-select it
                    newItem.cdc_id = String(deptCdcs[0].id);
                } else if (deptCdcs.length > 1) {
                    // Multiple CDCs → select first one by default, user can change in dropdown
                    newItem.cdc_id = String(deptCdcs[0].id);
                } else {
                    newItem.cdc_id = '';
                }
            }
            return newItem;
        }));
    };

    const handleSubmit = () => {
        const tipoId = metadata.cursos_tipos.find(t => t.tipo.toLowerCase() === selectedTab.toLowerCase())?.id;

        // Ensure CDC items have proper numeric types and filter out incomplete ones
        const validCdcItems = cdcItems
            .filter(item => item.cdc_id && item.monto > 0)
            .map(item => ({
                cdc_id: parseInt(String(item.cdc_id), 10),
                monto: parseFloat(String(item.monto)),
            }));

        const payload = {
            ...formData,
            id_tipo: tipoId,
            id_presupuesto: formData.id_presupuesto ? parseInt(String(formData.id_presupuesto), 10) : null,
            costo_cero: formData.costo_cero,
            cdc_items: validCdcItems,
        };

        if (isEditing && editCourse) {
            router.patch(`/admin/courses/${editCourse.id}`, payload, {
                onSuccess: () => onClose(),
                onError: (errors) => console.error('[AltaCursoModal] PATCH errors:', errors),
                preserveScroll: true,
            });
        } else {
            router.post('/admin/courses', {
                ...payload,
                selected_users: selectedUsers,
            }, {
                onSuccess: () => onClose(),
                onError: (errors) => console.error('[AltaCursoModal] POST errors:', errors),
            });
        }
    };

    const ErrorMsg = ({ name }: { name: string }) => errors && errors[name] ? (
        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors[name]}</p>
    ) : null;

    if (!isOpen) return null;

    return (
        <>
        <style dangerouslySetInnerHTML={{ __html: `
            .budget-group-select .ant-select-selector {
                background: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: white !important;
            }
            .budget-group-select .ant-select-selection-item,
            .budget-group-select .ant-select-selection-placeholder {
                color: white !important;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 11px;
            }
            .budget-group-select .ant-select-arrow {
                color: white !important;
            }
            .budget-group-dropdown .ant-select-item-option-content {
                font-weight: 500;
            }
            .cdc-select .ant-select-selection-item {
                font-weight: 600;
            }
        `}} />
        <Modal
            open={isOpen}
            onCancel={onClose}
            width="90vw"
            style={{ maxWidth: 1100, top: 20 }}
            centered={false}
            className="pb-10"
            title={
                <div>
                    <div className="flex justify-between items-center mr-8">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-semibold uppercase">{isEditing ? 'Editar Curso' : 'Alta de Curso'}</div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border">
                            <span className={`text-[10px] font-bold uppercase transition-colors ${formData.publicado ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {formData.publicado ? 'Publicado' : 'Borrador'}
                            </span>
                            <Switch
                                size="small"
                                checked={formData.publicado}
                                onChange={v => setFormData({ ...formData, publicado: v })}
                                className={formData.publicado ? 'bg-emerald-500' : ''}
                            />
                        </div>
                    </div>
                    <div className="font-normal text-sm text-slate-500 mt-1">
                        {isEditing ? 'Modifique los datos del curso y sus asignaciones de CDC.' : 'Complete los datos para crear una nueva capacitación e inscribir colaboradores.'}
                    </div>
                </div>
            }
            footer={[
                <Button key="back" onClick={onClose} size="large">Cancelar</Button>,
                <Button key="submit" type="primary" danger onClick={handleSubmit} size="large" className="font-semibold uppercase px-8 border-none bg-tuteur-red hover:bg-tuteur-red/90">
                    {isEditing ? 'Actualizar Curso' : 'Dar de Alta e Inscribir'}
                </Button>
            ]}
        >
            <div className="max-h-[78vh] overflow-y-auto pr-2">
                <Tabs
                    activeKey={selectedTab}
                    onChange={setSelectedTab}
                    className="mt-4"
                    items={[
                        { key: 'abierto', label: <span className="font-semibold uppercase">Abierto</span> },
                        { key: 'a pedido', label: <span className="font-semibold uppercase">A Pedido</span> }
                    ]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="nombre" className="text-sm font-semibold">Nombre del Curso</label>
                            <Input id="nombre" size="large" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Excel Avanzado" />
                            <ErrorMsg name="nombre" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Proveedor</label>
                                <SelectableInput
                                    value={formData.id_proveedor}
                                    onChange={v => setFormData({...formData, id_proveedor: v})}
                                    options={metadata.proveedores.map(p => ({ id: p.id, label: p.provedor }))}
                                    placeholder="Seleccionar o escribir..."
                                />
                                <ErrorMsg name="id_proveedor" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="costo" className="text-sm font-semibold flex justify-between">
                                    Costo Total ($)
                                    <Checkbox
                                        checked={formData.costo_cero}
                                        onChange={e => setFormData({...formData, costo_cero: e.target.checked, costo: e.target.checked ? '0' : formData.costo})}
                                    >
                                        <span className="text-[10px] font-bold uppercase text-tuteur-red">Costo $0</span>
                                    </Checkbox>
                                </label>
                                <Input id="costo" size="large" type="number" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} placeholder="0.00" disabled={formData.costo_cero} />
                                <ErrorMsg name="costo" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Habilidad / Tipo de Curso</label>
                                <SelectableInput
                                    value={formData.id_habilidad}
                                    onChange={v => setFormData({...formData, id_habilidad: v})}
                                    options={metadata.habilidades.map(h => ({ id: h.id, label: h.habilidad }))}
                                    placeholder="Seleccionar o escribir..."
                                />
                                <ErrorMsg name="id_habilidad" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Categoría</label>
                                <SelectableInput
                                    value={formData.id_categoria}
                                    onChange={v => setFormData({...formData, id_categoria: v})}
                                    options={metadata.categorias.map(c => ({ id: c.id, label: c.categoria }))}
                                    placeholder="Seleccionar o escribir..."
                                />
                                <ErrorMsg name="id_categoria" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="cant_horas" className="text-sm font-semibold">Duración (Horas)</label>
                                <Input id="cant_horas" size="large" type="number" value={formData.cant_horas} onChange={e => setFormData({...formData, cant_horas: e.target.value})} placeholder="Ej: 20" />
                                <ErrorMsg name="cant_horas" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Modalidad</label>
                                <SelectableInput
                                    value={formData.id_modalidad}
                                    onChange={v => setFormData({...formData, id_modalidad: v})}
                                    options={metadata.modalidades.map(m => ({ id: m.id, label: m.modalidad }))}
                                    placeholder="P. ej: Virtual"
                                />
                                <ErrorMsg name="id_modalidad" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="horarios" className="text-sm font-semibold">Horarios</label>
                            <Input id="horarios" size="large" value={formData.horarios} onChange={e => setFormData({...formData, horarios: e.target.value})} placeholder="Ej: Lunes y Miércoles 10 a 12hs, 14 a 16hs" />
                            <ErrorMsg name="horarios" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold block mb-1">Mes de Pago</label>
                                <Select size="large" className="w-full" placeholder="Seleccione..." value={formData.mes_pago || undefined} onChange={v => setFormData({...formData, mes_pago: v})}>
                                    {MESES.map(m => <Select.Option key={m} value={m}>{m}</Select.Option>)}
                                </Select>
                                <ErrorMsg name="mes_pago" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold block mb-1">Mes de Formación</label>
                                <Select size="large" className="w-full" placeholder="Seleccione..." value={formData.mes_formacion || undefined} onChange={v => setFormData({...formData, mes_formacion: v})}>
                                    {MESES.map(m => <Select.Option key={m} value={m}>{m}</Select.Option>)}
                                </Select>
                                <ErrorMsg name="mes_formacion" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="inicio" className="text-sm font-semibold">Fecha Inicio</label>
                                <Input id="inicio" size="large" type="date" value={formData.inicio} onChange={e => setFormData({...formData, inicio: e.target.value})} />
                                <ErrorMsg name="inicio" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="fin" className="text-sm font-semibold">Fecha Fin</label>
                                <Input id="fin" size="large" type="date" value={formData.fin} onChange={e => setFormData({...formData, fin: e.target.value})} />
                                <ErrorMsg name="fin" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center">
                                <Checkbox id="twiins" checked={formData.twiins} onChange={e => setFormData({...formData, twiins: e.target.checked})}>
                                    <span className="cursor-pointer font-semibold ml-1">Cargado en Twiins</span>
                                </Checkbox>
                            </div>
                            <div className="flex items-center">
                                <Checkbox id="certificado" checked={formData.certificado} onChange={e => setFormData({...formData, certificado: e.target.checked})}>
                                    <span className="cursor-pointer font-semibold ml-1">Emite Certificado</span>
                                </Checkbox>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="descripcion" className="text-sm font-semibold">Descripción</label>
                            <Input.TextArea id="descripcion" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Detalles del curso..." autoSize={{ minRows: 3, maxRows: 5 }} />
                            <ErrorMsg name="descripcion" />
                        </div>
                    </div>
                </div>

                {/* === MULTI-CDC SECTION === */}
                <div className="mt-8 border-2 border-slate-100 rounded-xl overflow-hidden">
                    <div className="bg-slate-700 p-4 flex justify-between items-center rounded-t-xl">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-white" />
                                <span className="text-sm font-semibold uppercase tracking-wider text-white">Asignación de Centros de Costo (CDC)</span>
                            </div>

                            {/* Prominent Budget Group Selector */}
                            <div className="flex flex-col gap-2 relative">
                                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1 border border-white/20 min-w-[300px]">
                                    <span className="text-[9px] font-semibold uppercase whitespace-nowrap text-white opacity-80">Año/Grupo de Presupuesto:</span>
                                    <Select
                                        size="small"
                                        className="flex-1 budget-group-select"
                                        popupClassName="budget-group-dropdown"
                                        placeholder="Seleccionar Año/Grupo..."
                                        value={formData.id_presupuesto || undefined}
                                        onChange={v => setFormData({...formData, id_presupuesto: v})}
                                    >
                                        {(metadata.presupuestos || []).map((g: any) => (
                                            <Select.Option key={g.id} value={g.id.toString()}>
                                                [{g.fecha}] {g.descripcion}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </div>
                                {formData.id_presupuesto && (() => {
                                    const group = (metadata.presupuestos || []).find(g => g.id.toString() === formData.id_presupuesto);
                                    if (!group) return null;
                                    const totInicial = group.presupuestos?.reduce((sum: number, p: any) => sum + (parseFloat(p.inicial || 0)), 0) || 0;
                                    const totActual = group.presupuestos?.reduce((sum: number, p: any) => sum + (parseFloat(p.actual || 0)), 0) || 0;
                                    return (
                                        <div className="absolute top-10 right-0 bg-white shadow-xl border border-slate-200 rounded-lg p-3 w-64 z-10 flex flex-col gap-1">
                                            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest border-b pb-1 mb-1">Resumen del Grupo</div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-semibold text-slate-600">Inicial:</span>
                                                <span className="font-semibold">${totInicial.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-semibold text-slate-600">Actual:</span>
                                                <span className="font-semibold text-emerald-600">${totActual.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <Button
                            onClick={addCdcItem}
                            icon={<Plus className="w-3 h-3" />}
                            className="flex items-center gap-1 bg-white text-slate-700 border-white/60 font-semibold hover:bg-slate-50!"
                        >
                            Añadir CDC
                        </Button>
                    </div>

                    {cdcItems.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm italic">
                            No se han asignado centros de costo. Presione "Añadir CDC" para comenzar.
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Costo total del curso: <span className="text-slate-900">${costoNum.toLocaleString()}</span></span>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs font-semibold uppercase ${totalCdcMonto === costoNum ? 'text-emerald-600' : totalCdcMonto > costoNum ? 'text-red-600' : 'text-amber-600'}`}>
                                            Asignado: ${totalCdcMonto.toLocaleString()} {totalCdcMonto === costoNum ? '✓ Cuadrado' : totalCdcMonto > costoNum ? '⚠ Excede' : `Pendiente: $${(costoNum - totalCdcMonto).toLocaleString()}`}
                                        </span>
                                    </div>
                                </div>

                            {cdcItems.map((item, index) => {
                                const budgetInfo = item.cdc_id ? getCdcBudgetInfo(item.cdc_id, item.monto, item.dept_id) : null;
                                const filteredDepts = (metadata.departamentos || []).filter(d => String(d.id_area) === String(item.area_id));
                                const filteredCdcs = (metadata.cdcs || []).filter(c => String(c.id_departamento) === String(item.dept_id));

                                return (
                                    <div key={index} className="border-2 border-slate-50 rounded-2xl p-5 bg-white space-y-5 hover:border-slate-100 transition-all shadow-sm relative group">
                                        <Button
                                            danger
                                            type="text"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            icon={<Trash2 className="w-4 h-4" />}
                                            onClick={() => removeCdcItem(index)}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold uppercase text-slate-400 ml-1">1. Seleccionar Área</label>
                                                <Select
                                                    size="large"
                                                    className="w-full cdc-select"
                                                    placeholder="Área..."
                                                    value={item.area_id || undefined}
                                                    onChange={v => updateCdcItem(index, 'area_id', v)}
                                                    showSearch
                                                    optionFilterProp="label"
                                                >
                                                    {metadata.areas.map(a => {
                                                        const currentGroup = (metadata.presupuestos || []).find(g => g.id.toString() === formData.id_presupuesto);
                                                        const areaDepts = (metadata.departamentos || []).filter(d => String(d.id_area) === String(a.id)).map(d => String(d.id));
                                                        const areaBudgetTotal = currentGroup?.presupuestos
                                                            ?.filter(p => areaDepts.includes(String(p.id_departamento)))
                                                            .reduce((sum, p) => sum + (parseFloat(p.actual?.toString() || '0')), 0) || 0;

                                                        const hasBudget = areaBudgetTotal > 0;
                                                        const balanceStr = ` ($${areaBudgetTotal.toLocaleString()})`;

                                                        return (
                                                            <Select.Option key={a.id} value={String(a.id)} label={a.nombre}>
                                                                <div className="flex justify-between items-center w-full">
                                                                    <span>{a.nombre}</span>
                                                                    <span className={`text-[10px] font-bold ${hasBudget ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                        {balanceStr}
                                                                    </span>
                                                                </div>
                                                            </Select.Option>
                                                        );
                                                    })}
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold uppercase text-slate-400 ml-1">2. Departamento</label>
                                                <Select
                                                    size="large"
                                                    className="w-full cdc-select"
                                                    placeholder="Departamento..."
                                                    disabled={!item.area_id}
                                                    value={item.dept_id || undefined}
                                                    onChange={v => updateCdcItem(index, 'dept_id', v)}
                                                    showSearch
                                                    optionFilterProp="label"
                                                >
                                                    {filteredDepts.map(d => {
                                                        const currentGroup = (metadata.presupuestos || []).find(g => g.id.toString() === formData.id_presupuesto);
                                                        const budget = currentGroup?.presupuestos?.find((p: any) => String(p.id_departamento) === String(d.id));
                                                        const balanceStr = budget ? ` ($${(budget.actual || 0).toLocaleString()})` : ' ($0)';

                                                        return (
                                                            <Select.Option key={d.id} value={String(d.id)} label={d.nombre}>
                                                                <div className="flex justify-between items-center w-full">
                                                                    <span>{d.nombre}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400">{balanceStr}</span>
                                                                </div>
                                                            </Select.Option>
                                                        );
                                                    })}
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold uppercase text-slate-400 ml-1">3. Centro de Costo (CDC)</label>
                                                <Select
                                                    size="large"
                                                    className="w-full cdc-select"
                                                    placeholder="CDC..."
                                                    disabled={!item.dept_id}
                                                    value={item.cdc_id || undefined}
                                                    onChange={v => updateCdcItem(index, 'cdc_id', v)}
                                                    showSearch
                                                    optionFilterProp="label"
                                                    options={filteredCdcs.map(c => ({ value: String(c.id), label: c.cdc }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold uppercase text-slate-400 ml-1">Monto Total A Descontar ($)</label>
                                                <InputNumber
                                                    size="large"
                                                    className="w-full"
                                                    min={0}
                                                    value={item.monto}
                                                    onChange={v => updateCdcItem(index, 'monto', v || 0)}
                                                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                                                />
                                            </div>
                                        </div>

                                        {/* Budget forecast */}
                                        {(item.dept_id || item.cdc_id) && (() => {
                                            const budgetInfo = getCdcBudgetInfo(item.cdc_id || null, item.monto, item.dept_id);
                                            if (!budgetInfo) return null;
                                            return (
                                                <div className={`rounded-xl p-4 border shadow-sm ${(budgetInfo as any).error ? 'bg-amber-50 border-amber-200' : (budgetInfo as any).sufficient ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                                                    {(budgetInfo as any).error ? (
                                                        <div className="flex items-center gap-2 py-1">
                                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                                            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">{(budgetInfo as any).error}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {(budgetInfo as any).sufficient ? (
                                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                                    ) : (
                                                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                                                    )}
                                                                    <div className="leading-tight">
                                                                        <div className={`text-[11px] font-semibold uppercase ${(budgetInfo as any).sufficient ? 'text-emerald-700' : 'text-red-700'}`}>
                                                                            Análisis de Presupuesto — {(budgetInfo as any).departamento}
                                                                        </div>
                                                                        <div className="text-[9px] text-slate-400 uppercase font-bold">Saldo actual en el grupo seleccionado</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-sm font-semibold ${(budgetInfo as any).sufficient ? 'text-emerald-700' : 'text-red-700'}`}>
                                                                        ${(budgetInfo as any).remaining.toLocaleString()}
                                                                    </div>
                                                                    <div className="text-[8px] font-bold text-slate-400 uppercase">Quedaría</div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                                                                <div>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Inicial</span>
                                                                    <span className="text-xs font-bold text-slate-700">${(budgetInfo as any).presupuestoInicial.toLocaleString()}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Actual</span>
                                                                    <span className="text-xs font-bold text-slate-700">${(budgetInfo as any).presupuestoActual.toLocaleString()}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Deducción</span>
                                                                    <span className="text-xs font-bold text-red-600">-${(budgetInfo as any).totalDeduction.toLocaleString()}</span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                                                    <span>Uso del Presupuesto</span>
                                                                    <span>{Math.round((budgetInfo as any).pctUsed)}%</span>
                                                                </div>
                                                                <Progress
                                                                    percent={Math.round((budgetInfo as any).pctUsed)}
                                                                    size="small"
                                                                    showInfo={false}
                                                                    status={(budgetInfo as any).sufficient ? 'normal' : 'exception'}
                                                                    strokeColor={(budgetInfo as any).pctUsed > 90 ? '#ef4444' : (budgetInfo as any).pctUsed > 70 ? '#f59e0b' : '#10b981'}
                                                                    strokeWidth={6}
                                                                    className="m-0"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* === ENROLLED USERS LIST (edit mode) === */}
                {isEditing && editCourse && (editCourse.users || []).length > 0 && (
                    <div className="mt-8 border rounded-lg overflow-hidden">
                        <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-sm uppercase text-slate-600">Colaboradores Inscriptos</h3>
                            <Tag color="red" className="font-semibold">{editCourse.users!.length} inscriptos</Tag>
                        </div>
                        <div className="divide-y max-h-48 overflow-y-auto">
                            {editCourse.users!.map((u: any) => (
                                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-semibold text-sm text-slate-700">{u.name}</div>
                                            <div className="text-[10px] text-tuteur-grey-mid">{u.departamento?.nombre || 'Sin depto'} · {u.departamento?.area?.nombre || ''}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tag color="green" className="font-semibold text-[9px] uppercase m-0">
                                            {u.pivot?.status_label || 'inscripto'}
                                        </Tag>
                                        <Button
                                            danger
                                            size="small"
                                            type="text"
                                            icon={<Trash2 className="w-3.5 h-3.5" />}
                                            onClick={() => {
                                                if (u.pivot?.id) {
                                                    router.delete(`/admin/enrollments/${u.pivot.id}`, {
                                                        preserveScroll: true,
                                                        onSuccess: () => router.reload({ only: ['cursos'] }),
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === ADD NEW USERS SECTION === */}
                <div className="mt-8 border rounded-lg overflow-hidden">
                    <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-sm uppercase text-slate-600">
                            {isEditing ? 'Inscribir Nuevos Colaboradores' : 'Inscripción Directa'}
                        </h3>
                        {selectedUsers.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Tag color="blue" className="font-bold">{selectedUsers.length} seleccionados</Tag>
                                {isEditing && (
                                    <Button
                                        type="primary"
                                        size="small"
                                        className="bg-tuteur-red border-none font-semibold uppercase text-[10px]"
                                        onClick={() => {
                                            selectedUsers.forEach(userId => {
                                                router.post(`/admin/courses/${editCourse!.id}/enroll-manual`, {
                                                    user_id: userId,
                                                }, {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setSelectedUsers([]);
                                                        router.reload({ only: ['cursos'] });
                                                    },
                                                });
                                            });
                                        }}
                                    >
                                        Inscribir Ahora
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-4 space-y-4">
                        <Input
                            placeholder="Buscar colaboradores..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                            size="large"
                        />
                        <div className="max-h-40 overflow-y-auto border rounded-md divide-y bg-white">
                            {filteredUsers.length > 0 ? filteredUsers
                                .filter(u => !(isEditing && editCourse?.users?.some((eu: any) => eu.id === u.id)))
                                .map(u => (
                                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-slate-50 transition-colors">
                                    <div className="text-xs">
                                        <div className="font-semibold text-sm">{u.name}</div>
                                        <div className="text-tuteur-grey-mid">{u.departamento?.nombre} - {u.departamento?.area?.nombre}</div>
                                    </div>
                                    <Checkbox
                                        checked={selectedUsers.includes(u.id)}
                                        onChange={() => handleUserToggle(u.id)}
                                    />
                                </div>
                            )) : (
                                <div className="p-4 text-center text-sm text-tuteur-grey-mid italic">No se encontraron colaboradores</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
        </>
    );
}
