export interface Empresa {
    id: number;
    nombre: string;
    direccion?: string;
}

export interface Area {
    id: number;
    nombre: string;
    descripcion?: string;
    id_empresa: number;
    empresa?: Empresa;
}

export interface Departamento {
    id: number;
    nombre: string;
    descripcion?: string;
    id_area: number;
    area?: Area;
    users_count?: number;
}

export type UserRole = 'user' | 'jefe_area' | 'jefe_general' | 'admin';

export interface User {
    id: number;
    name: string;
    email: string;
    id_departamento?: number;
    departamento?: Departamento;
    role: UserRole;
    email_verified_at?: string;
}

export interface Habilidad {
    id: number;
    habilidad: string;
    descripcion?: string;
}

export interface Cdc {
    id: number;
    cdc: string;
    descripcion?: string;
    inversion?: number;
    id_departamento?: number;
    departamento?: Departamento;
    pivot?: { monto: number };
}

export interface Categoria {
    id: number;
    categoria: string;
    descripcion?: string;
}

export interface ProgramaAsociado {
    id: number;
    nombre: string;
}

export interface PresupuestoGrupo {
    id: number;
    fecha: number;
    descripcion: string;
    total_inicial?: number;
    total_actual?: number;
    presupuestos?: Presupuesto[];
}

export interface Presupuesto {
    id: number;
    fecha: number;
    inicial: number;
    actual: number;
    id_departamento: number;
    departamento?: Departamento;
    id_grupo?: number;
    grupo?: PresupuestoGrupo;
}

export interface Curso {
    id: number;
    nombre: string;
    descripcion?: string;
    cant_horas?: number;
    inicio: string;
    fin: string;
    horarios?: Array<{ dia: string; hora: string }>;
    costo: number;
    capacidad: number;
    habilidad?: string;
    cdc?: string;
    categoria?: string;
    programa?: string;
    modalidad?: string | Modalidad;
    id_modalidad?: number;
    tipo?: string | CursoTipo;
    id_tipo?: number;
    mes_pago?: string;
    twiins?: boolean;
    jornadas?: string;
    certificado?: boolean;
    anio_formacion?: number;
    mes_formacion?: string;
    instructores?: string;
    rating?: number;
    users_count?: number;
    cdcs?: Cdc[];
    users?: User[];
    id_presupuesto?: number;
    presupuesto?: PresupuestoGrupo;
    costo_cero?: boolean;
    publicado?: boolean;
}

export type EnrollmentStatus = 'solicitado' | 'procesando' | 'aceptado' | 'matriculado' | 'cancelar' | 'terminado' | 'incompleto' | 'certificado';

export interface Modalidad {
    id: number;
    modalidad: string;
    descripcion?: string;
}

export interface CursoTipo {
    id: number;
    tipo: string;
}

export interface Proveedor {
    id: number;
    provedor: string;
    email?: string;
    telefono?: string;
}

export interface Enrollment {
    id: number;
    id_user: number;
    user?: User;
    id_curso: number;
    curso_estado: number;
    status_label?: EnrollmentStatus;
    curso?: Curso;
    id_presupuesto?: number;
}
