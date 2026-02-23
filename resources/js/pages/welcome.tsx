import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { BookOpen, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';
import AppLogo from '@/components/app-logo';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-red-100 selection:text-red-900">
            <Head title="Tuteur Capacitaciones" />

            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <AppLogo />
                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard().url}
                                className="rounded-full bg-[#E30613] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#c40510] hover:shadow-lg hover:shadow-red-200"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login().url}
                                    className="text-sm font-medium text-slate-600 transition-colors hover:text-[#E30613]"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register().url}
                                        className="rounded-full bg-[#E30613] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#c40510] hover:shadow-lg hover:shadow-red-200"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-red-50/50 opacity-50 blur-3xl translate-x-1/2 -translate-y-1/2" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center lg:text-left lg:flex lg:items-center lg:gap-12">
                        <div className="lg:flex-1">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                                Potencia tu <span className="text-[#E30613]">Crecimiento</span> Profesional
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto lg:mx-0">
                                Accede a una plataforma de capacitación diseñada exclusivamente para el equipo de Tuteur.
                                Gestiona tus cursos, obtén certificados y sincroniza tu perfil con tus credenciales de dominio.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Link
                                    href={register().url}
                                    className="w-full sm:w-auto rounded-full bg-[#E30613] px-8 py-4 text-center text-lg font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-[#c40510] hover:-translate-y-1"
                                >
                                    Comenzar ahora
                                </Link>
                                <Link
                                    href="#features"
                                    className="w-full sm:w-auto rounded-full border border-slate-200 bg-white px-8 py-4 text-center text-lg font-semibold text-slate-700 transition-all hover:bg-slate-50"
                                >
                                    Saber más
                                </Link>
                            </div>
                        </div>

                        <div className="hidden lg:block lg:flex-1 mt-12 lg:mt-0 relative">
                            <div className="relative rounded-2xl bg-red-100/30 p-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-50">
                                            <BookOpen className="text-[#E30613] mb-3" size={32} />
                                            <h3 className="font-bold text-slate-800">Cursos</h3>
                                            <p className="text-sm text-slate-500">Catálogo completo disponible.</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-50">
                                            <GraduationCap className="text-[#E30613] mb-3" size={32} />
                                            <h3 className="font-bold text-slate-800">Certificados</h3>
                                            <p className="text-sm text-slate-500">Validados por RRHH.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-8">
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-50">
                                            <ShieldCheck className="text-[#E30613] mb-3" size={32} />
                                            <h3 className="font-bold text-slate-800">LDAP Sync</h3>
                                            <p className="text-sm text-slate-500">Acceso seguro con tu dominio.</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-50">
                                            <UserCheck className="text-[#E30613] mb-3" size={32} />
                                            <h3 className="font-bold text-slate-800">Perfiles</h3>
                                            <p className="text-sm text-slate-500">Datos siempre actualizados.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-100 bg-slate-50 py-12">
                <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <p className="text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} Tuteur S.A.C.I.F.I.A. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
