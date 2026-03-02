import { Modal, Button, Input, Select, Tabs, Checkbox, InputNumber, Tag, Tooltip, Progress } from 'antd';
import { useState, useMemo, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Cdc, Habilidad, Presupuesto, Categoria, Proveedor, Modalidad, CursoTipo, User, PresupuestoGrupo, Curso } from '@/types/capacitaciones';
import { SelectableInput } from './SelectableInput';
import { Plus, Trash2, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

interface CdcItem {
    [key: string]: string | number;
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
        id_presupuesto: '',
        costo_cero: false,
        inicio: '',
        fin: '',
        capacidad: '30'
    };

    const [formData, setFormData] = useState(emptyForm);

    // Populate form when editing
    useEffect(() => {
        if (editCourse && isOpen) {
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
                inicio: formatDate(editCourse.inicio),
                fin: formatDate(editCourse.fin),
                capacidad: editCourse.capacidad?.toString() || '30',
                id_presupuesto: editCourse.id_presupuesto?.toString() || '',
                costo_cero: !!editCourse.costo_cero,
            });

            // Populate CDC items from pivot
            if (editCourse.cdcs && editCourse.cdcs.length > 0) {
                setCdcItems(editCourse.cdcs.map(c => ({
                    cdc_id: c.id.toString(),
                    monto: c.pivot?.monto || 0,
                })));
            } else {
                setCdcItems([]);
            }

            setSelectedUsers([]);
        } else if (!isOpen) {
            // Reset when modal closes
            setFormData(emptyForm);
            setCdcItems([]);
            setSelectedUsers([]);
            setSelectedTab('abierto');
        }
    }, [editCourse, isOpen]);

    const filteredUsers = useMemo(() => {
        return (metadata.users || []).filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [metadata.users, searchTerm]);

    // Budget calculation helper
    const getCdcBudgetInfo = (cdcId: string, monto: number) => {
        const cdc = metadata.cdcs.find(c => c.id.toString() === cdcId);
        if (!cdc) return null;

        const targetGroupId = formData.id_presupuesto
            ? parseInt(formData.id_presupuesto)
            : null;

        let presupuesto: Presupuesto | undefined;

        if (targetGroupId) {
            // Find the selected budget group
            const selectedGroup = (metadata.presupuestos || []).find(g => g.id === targetGroupId);
            if (selectedGroup && selectedGroup.presupuestos) {
                // Within the group, find the department-specific budget
                presupuesto = selectedGroup.presupuestos.find(p => p.id_departamento === cdc.id_departamento);
            }
        } else {
            // If no specific group is selected, try to find a department budget that is not part of any group
            // This assumes that metadata.presupuestos might contain groups, and we need to iterate through them
            // to find a flat budget if it exists, or if there's a default way to get a budget.
            // For now, if no group is selected, we assume no budget info can be derived from grouped budgets.
            // If there are 'ungrouped' budgets, they would need to be in a separate metadata array or handled differently.
            // Given the change to PresupuestoGrupo[], we'll only find budgets if a group is selected.
            // If the intention is to allow budgets outside of groups, metadata.presupuestos would need to be a union type or two separate arrays.
            // For this change, we'll assume budgets are always within a group if metadata.presupuestos is PresupuestoGrupo[].
            return null;
        }

        if (!presupuesto) return null;

        const usersToEnroll = selectedUsers.length || 1;
        const totalDeduction = monto * usersToEnroll;
        const remaining = presupuesto.actual - totalDeduction;
        const pctUsed = presupuesto.inicial > 0
            ? ((presupuesto.inicial - remaining) / presupuesto.inicial) * 100
            : 0;

        return {
            departamento: cdc.departamento?.nombre || 'N/A',
            area: cdc.departamento?.area?.nombre || '',
            presupuestoInicial: presupuesto.inicial,
            presupuestoActual: presupuesto.actual,
            totalDeduction: formData.costo_cero ? 0 : totalDeduction,
            remaining: formData.costo_cero ? presupuesto.actual : remaining,
            pctUsed: formData.costo_cero ? 0 : Math.min(pctUsed, 100),
            sufficient: formData.costo_cero ? true : remaining >= 0,
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
        setCdcItems(prev => [...prev, { cdc_id: '', monto: 0 }]);
    };

    const removeCdcItem = (index: number) => {
        setCdcItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateCdcItem = (index: number, field: keyof CdcItem, value: any) => {
        setCdcItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const handleSubmit = () => {
        const tipoId = metadata.cursos_tipos.find(t => t.tipo.toLowerCase() === selectedTab.toLowerCase())?.id;
        const payload = {
            ...formData,
            id_tipo: tipoId,
            id_presupuesto: formData.id_presupuesto || null,
            costo_cero: formData.costo_cero,
            cdc_items: cdcItems.filter(item => item.cdc_id && item.monto > 0),
        };

        if (isEditing && editCourse) {
            router.patch(`/admin/courses/${editCourse.id}`, payload, {
                onSuccess: () => onClose(),
                preserveScroll: true,
            });
        } else {
            router.post('/admin/courses', {
                ...payload,
                selected_users: selectedUsers,
            }, {
                onSuccess: () => onClose(),
            });
        }
    };

    const ErrorMsg = ({ name }: { name: string }) => errors && errors[name] ? (
        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors[name]}</p>
    ) : null;

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            width="90vw"
            style={{ maxWidth: 1100, top: 20 }}
            centered={false}
            className="pb-10"
            title={
                <div>
                    <div className="text-2xl font-bold uppercase">{isEditing ? 'Editar Curso' : 'Alta de Curso'}</div>
                    <div className="font-normal text-sm text-slate-500 mt-1">
                        {isEditing ? 'Modifique los datos del curso y sus asignaciones de CDC.' : 'Complete los datos para crear una nueva capacitación e inscribir colaboradores.'}
                    </div>
                </div>
            }
            footer={[
                <Button key="back" onClick={onClose} size="large">Cancelar</Button>,
                <Button key="submit" type="primary" danger onClick={handleSubmit} size="large" className="font-bold uppercase px-8 border-none bg-tuteur-red hover:bg-tuteur-red/90">
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
                        { key: 'abierto', label: <span className="font-bold uppercase">Abierto</span> },
                        { key: 'a pedido', label: <span className="font-bold uppercase">A Pedido</span> }
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
                                <label className="text-sm font-semibold">Presupuesto Específico <span className="text-[10px] text-slate-400">(Opcional)</span></label>
                                <Select
                                    className="w-full"
                                    size="large"
                                    placeholder="Autodetectar por CDC..."
                                    value={formData.id_presupuesto || undefined}
                                    onChange={v => setFormData({...formData, id_presupuesto: v})}
                                    allowClear
                                >
                                    {(metadata.presupuestos || []).map((g: any) => (
                                        <Select.Option key={g.id} value={g.id.toString()}>
                                            [{g.fecha}] {g.descripcion}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <ErrorMsg name="id_presupuesto" />
                            </div>
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
                    <div className="bg-linear-to-r from-tuteur-red to-tuteur-red-dark p-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-sm uppercase text-white flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                Asignación de Centros de Costo (CDC)
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1">Defina qué departamentos financian este curso y cuánto aporta cada uno.</p>
                        </div>
                        <Button
                            type="primary"
                            ghost
                            onClick={addCdcItem}
                            icon={<Plus className="w-3 h-3" />}
                            className="flex items-center gap-1 border-emerald-500/40 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400"
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
                            {/* Summary bar */}
                            {costoNum > 0 && (
                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Costo total del curso: <span className="text-slate-900">${costoNum.toLocaleString()}</span></span>
                                    <span className={`text-xs font-bold uppercase ${totalCdcMonto === costoNum ? 'text-emerald-600' : totalCdcMonto > costoNum ? 'text-red-600' : 'text-amber-600'}`}>
                                        Asignado: ${totalCdcMonto.toLocaleString()} {totalCdcMonto === costoNum ? '✓ Cuadrado' : totalCdcMonto > costoNum ? '⚠ Excede' : `Pendiente: $${(costoNum - totalCdcMonto).toLocaleString()}`}
                                    </span>
                                </div>
                            )}

                            {cdcItems.map((item, index) => {
                                const budgetInfo = item.cdc_id ? getCdcBudgetInfo(item.cdc_id, item.monto) : null;

                                return (
                                    <div key={index} className="border rounded-xl p-4 bg-white space-y-3 hover:shadow-sm transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Centro de Costo</label>
                                                    <Select
                                                        size="large"
                                                        className="w-full"
                                                        placeholder="Seleccionar CDC..."
                                                        value={item.cdc_id || undefined}
                                                        onChange={v => updateCdcItem(index, 'cdc_id', v)}
                                                        showSearch
                                                        optionFilterProp="children"
                                                    >
                                                        {metadata.cdcs.map(c => (
                                                            <Select.Option key={c.id} value={c.id.toString()}>
                                                                {c.cdc} {c.departamento ? `(${c.departamento.nombre})` : ''}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Monto a Descontar ($)</label>
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
                                            <Button
                                                danger
                                                type="text"
                                                className="mt-5"
                                                icon={<Trash2 className="w-4 h-4" />}
                                                onClick={() => removeCdcItem(index)}
                                            />
                                        </div>

                                        {/* Budget forecast */}
                                        {budgetInfo && (
                                            <div className={`rounded-lg p-3 border ${budgetInfo.sufficient ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    {budgetInfo.sufficient ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                    <span className={`text-[10px] font-black uppercase ${budgetInfo.sufficient ? 'text-emerald-700' : 'text-red-700'}`}>
                                                        {budgetInfo.departamento} — {budgetInfo.area}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 text-[11px]">
                                                    <div>
                                                        <span className="text-slate-400 block">Presupuesto Inicial</span>
                                                        <span className="font-bold text-slate-700">${budgetInfo.presupuestoInicial.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">Actual (Antes)</span>
                                                        <span className="font-bold text-slate-700">${budgetInfo.presupuestoActual.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">Quedaría (Después)</span>
                                                        <span className={`font-bold ${budgetInfo.sufficient ? 'text-emerald-700' : 'text-red-700'}`}>
                                                            ${budgetInfo.remaining.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <Progress
                                                        percent={Math.round(budgetInfo.pctUsed)}
                                                        size="small"
                                                        status={budgetInfo.sufficient ? 'normal' : 'exception'}
                                                        strokeColor={budgetInfo.pctUsed > 90 ? '#ef4444' : budgetInfo.pctUsed > 70 ? '#f59e0b' : '#10b981'}
                                                    />
                                                </div>
                                                {selectedUsers.length > 1 && (
                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                        * Cálculo para {selectedUsers.length} colaboradores × ${item.monto.toLocaleString()} = ${budgetInfo.totalDeduction.toLocaleString()} deducción total.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* === ENROLLED USERS LIST (edit mode) === */}
                {isEditing && editCourse && (editCourse.users || []).length > 0 && (
                    <div className="mt-8 border rounded-lg overflow-hidden">
                        <div className="bg-tuteur-grey-light p-3 border-b flex justify-between items-center">
                            <h3 className="font-bold text-sm uppercase text-tuteur-grey">Colaboradores Inscriptos</h3>
                            <Tag color="red" className="font-bold">{editCourse.users!.length} inscriptos</Tag>
                        </div>
                        <div className="divide-y max-h-48 overflow-y-auto">
                            {editCourse.users!.map((u: any) => (
                                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-bold text-sm text-tuteur-grey">{u.name}</div>
                                            <div className="text-[10px] text-tuteur-grey-mid">{u.departamento?.nombre || 'Sin depto'} · {u.departamento?.area?.nombre || ''}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tag color="green" className="font-bold text-[9px] uppercase m-0">
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
                    <div className="bg-tuteur-grey-light p-3 border-b flex justify-between items-center">
                        <h3 className="font-bold text-sm uppercase text-tuteur-grey">
                            {isEditing ? 'Inscribir Nuevos Colaboradores' : 'Inscripción Directa'}
                        </h3>
                        {selectedUsers.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Tag color="blue" className="font-bold">{selectedUsers.length} seleccionados</Tag>
                                {isEditing && (
                                    <Button
                                        type="primary"
                                        size="small"
                                        className="bg-tuteur-red border-none font-bold uppercase text-[10px]"
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
                                        <div className="font-bold text-sm">{u.name}</div>
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
    );
}
