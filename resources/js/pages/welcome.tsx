import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import { BookOpen, ShieldCheck, UserCheck, BarChart3 } from 'lucide-react';
import AppLogo from '@/components/app-logo';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-white font-sans text-tuteur-grey selection:bg-red-100 selection:text-red-900">
            <Head title="Hub de Aprendizaje Tuteur (HAT)" />

            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <AppLogo variant="dark" />
                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard().url}
                                className="rounded-full bg-tuteur-red px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-tuteur-red-dark hover:shadow-lg hover:shadow-red-200"
                            >
                                Panel
                            </Link>
                        ) : (
                            <Link
                                href={login().url}
                                className="rounded-full bg-tuteur-red px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-tuteur-red-dark hover:shadow-lg hover:shadow-red-200"
                            >
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-red-50/50 opacity-50 blur-3xl translate-x-1/2 -translate-y-1/2" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center lg:text-left lg:flex lg:items-center lg:gap-12">
                        <div className="lg:flex-1 relative z-10">
                            <div className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-red-50 text-tuteur-red text-sm font-medium mb-6 ring-1 ring-inset ring-red-100">
                                <span className="flex h-1 text-lg rounded-full bg-tuteur-red"></span>
                                HAT
                            </div>
                            <h1 className="text-5xl font-extrabold tracking-tight text-tuteur-grey sm:text-7xl lg:leading-[1.1]">
                                Potencia tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-tuteur-red to-red-600">Crecimiento</span> Profesional
                            </h1>
                            <p className="mt-6 text-lg leading-relaxed text-tuteur-grey-mid max-w-2xl mx-auto lg:mx-0">
                                Accede a una plataforma de capacitación diseñada exclusivamente para el equipo de Tuteur.
                                Gestiona tus cursos.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Link
                                    href={login().url}
                                    className="group w-full sm:w-auto rounded-full bg-tuteur-red px-8 py-4 text-center text-lg font-bold text-white shadow-xl shadow-red-200/50 transition-all duration-300 hover:bg-tuteur-red-dark hover:-translate-y-1 hover:shadow-red-300/50 flex items-center justify-center gap-2"
                                >
                                    Comenzar ahora
                                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <a
                                    href="#features"
                                    className="w-full sm:w-auto rounded-full border-2 border-gray-200 bg-white/50 backdrop-blur-sm px-8 py-4 text-center text-lg font-semibold text-tuteur-grey transition-all duration-300 hover:bg-gray-50 hover:border-gray-300"
                                >
                                    Saber más
                                </a>
                            </div>
                        </div>

                        <div className="hidden lg:block lg:flex-1 mt-12 lg:mt-0 relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-red-100 to-red-50 rounded-[2.5rem] transform rotate-3 scale-105 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 opacity-70"></div>
                            <div className="relative rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 p-8 shadow-2xl">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow hover:-translate-y-1 duration-300 group/card">
                                            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform duration-300">
                                                <BookOpen className="text-tuteur-red" size={24} />
                                            </div>
                                            <h3 className="font-bold text-tuteur-grey text-lg mb-1">Cursos</h3>
                                            <p className="text-sm text-tuteur-grey-mid">Catálogo completo disponible.</p>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow hover:-translate-y-1 duration-300 group/card">
                                            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform duration-300">
                                                <BarChart3 className="text-tuteur-red" size={24} />
                                            </div>
                                            <h3 className="font-bold text-tuteur-grey text-lg mb-1">Métricas</h3>
                                            <p className="text-sm text-tuteur-grey-mid">Análisis estadístico en tiempo real.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow hover:-translate-y-1 duration-300 group/card">
                                            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform duration-300">
                                                <ShieldCheck className="text-tuteur-red" size={24} />
                                            </div>
                                            <h3 className="font-bold text-tuteur-grey text-lg mb-1">LDAP Sync</h3>
                                            <p className="text-sm text-tuteur-grey-mid">Acceso seguro con tu dominio.</p>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow hover:-translate-y-1 duration-300 group/card">
                                            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform duration-300">
                                                <UserCheck className="text-tuteur-red" size={24} />
                                            </div>
                                            <h3 className="font-bold text-tuteur-grey text-lg mb-1">Perfiles</h3>
                                            <p className="text-sm text-tuteur-grey-mid">Datos siempre actualizados.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Saber más Section */}
            <section id="features" className="relative bg-white py-24 sm:py-32 overflow-hidden scroll-mt-20">
                <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-red-50/50 opacity-50 blur-3xl" />
                <div className="absolute bottom-0 left-1/4 -z-10 h-96 w-96 rounded-full bg-red-50/50 opacity-50 blur-3xl" />

                <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                    <div className="mx-auto max-w-3xl lg:text-center mb-16">
                        <h2 className="text-base/7 font-bold text-tuteur-red uppercase tracking-widest">Saber más</h2>
                        <p className="mt-3 text-4xl tracking-tight text-tuteur-grey sm:text-5xl font-extrabold pb-2">
                            Hub de Aprendizaje Tuteur (HAT)
                        </p>
                    </div>

                    <div className="mx-auto max-w-4xl bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 relative">
                        <div className="absolute -top-6 -left-6 text-red-100">
                            <svg width="84" height="84" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                            </svg>
                        </div>
                        <div className="text-lg/8 text-tuteur-grey-mid space-y-6 relative z-10">
                            <p className="text-xl font-medium text-tuteur-grey leading-relaxed">
                                El Hub de Aprendizaje Tuteur es el espacio donde vas a poder conocer y acceder a las oportunidades de capacitación disponibles dentro de la compañía.
                            </p>
                            <div className="h-px w-24 bg-gradient-to-r from-tuteur-red to-transparent my-8" />
                            <p>
                                Desde aquí podrás explorar el catálogo de cursos, inscribirte en las propuestas que te interesen y seguir desarrollando tus habilidades para potenciar tu crecimiento profesional.
                            </p>
                            <p>
                                Además, los líderes podrán gestionar las solicitudes de capacitación de sus equipos y hacer seguimiento del uso del presupuesto asignado para el desarrollo de su área.
                            </p>
                            <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 mt-8">
                                <p className="font-medium text-tuteur-red italic">
                                    "Nuestro objetivo es facilitar el acceso al aprendizaje y acompañar el desarrollo continuo de todas las personas que forman parte de Tuteur."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-gray-50 py-12">
                <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <p className="text-sm text-tuteur-grey-mid">
                        &copy; {new Date().getFullYear()} Tuteur S.A.C.I.F.I.A. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
