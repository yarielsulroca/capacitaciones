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
    modalidad?: string;
    instructores?: string;
    rating?: number;
    users_count?: number;
}

export type EnrollmentStatus = 'solicitado' | 'procesando' | 'aceptado' | 'matriculado' | 'cancelar' | 'terminado' | 'incompleto' | 'certificado';

export interface Enrollment {
    id: number;
    id_user: number;
    id_curso: number;
    curso_estado: number;
    status_label?: EnrollmentStatus;
    curso?: Curso;
}
