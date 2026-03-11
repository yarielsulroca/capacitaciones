import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button, Input } from 'antd';
import AppLogoIcon from '@/components/app-logo-icon';
import { store } from '@/routes/login';
import { Lock, Mail } from 'lucide-react';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    return (
        <div className="flex min-h-screen">
            <Head title="Iniciar Sesión — Hub de Aprendizaje Tuteur (HAT)" />

            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-linear-to-br from-tuteur-red to-[#8a0b1f] p-12 text-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                            <AppLogoIcon className="size-8 fill-current text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight">Hub de Aprendizaje Tuteur</span>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-4xl font-extrabold leading-tight lg:leading-[1.1] sm:text-5xl">
                        Potencia tu<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-white">Crecimiento Profesional</span>
                    </h2>
                    <p className="text-white/80 text-lg leading-relaxed max-w-md font-medium">
                        Accede a tu plataforma de capacitación, gestiona tus cursos y obtén tus certificados con tus credenciales de dominio.
                    </p>
                </div>

                <div className="relative z-10">
                    <p className="text-white/40 text-xs">
                        &copy; {new Date().getFullYear()} Tuteur S.A.C.I.F.I.A. Todos los derechos reservados.
                    </p>
                </div>
            </div>

            {/* Right panel — login form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
                {/* Mobile logo */}
                <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
                    <div className="bg-red-50 p-3 rounded-2xl border border-red-100 shadow-sm">
                        <AppLogoIcon className="size-10 fill-current text-tuteur-red" />
                    </div>
                    <span className="text-xl font-bold text-tuteur-grey tracking-tight text-center">Hub de Aprendizaje Tuteur</span>
                </div>

                <div className="w-full max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-extrabold text-tuteur-grey">Iniciar Sesión</h1>
                        <p className="text-tuteur-grey-mid mt-2 text-base">
                            Ingresa con tus credenciales de dominio corporativo.
                        </p>
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-5"
                    >
                        {({ processing, errors }: any) => (
                            <>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-semibold text-tuteur-grey">
                                            Correo electrónico
                                        </label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="tu.nombre@tuteur.com"
                                            size="large"
                                            prefix={<Mail className="h-4 w-4 text-tuteur-grey-mid" />}
                                            status={errors?.email ? 'error' : ''}
                                            className="rounded-lg"
                                        />
                                        <InputError message={errors?.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="password" className="text-sm font-semibold text-tuteur-grey">
                                            Contraseña
                                        </label>
                                        <Input.Password
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            size="large"
                                            prefix={<Lock className="h-4 w-4 text-tuteur-grey-mid" />}
                                            status={errors?.password ? 'error' : ''}
                                            className="rounded-lg"
                                        />
                                        <InputError message={errors?.password} />
                                    </div>

                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        className="w-full h-12 text-base font-bold rounded-xl border-none shadow-xl shadow-red-200/50 hover:shadow-red-300/50 hover:-translate-y-0.5 transition-all duration-300"
                                        style={{ backgroundColor: '#c8102e', borderColor: '#c8102e' }}
                                        tabIndex={3}
                                        loading={processing}
                                        data-test="login-button"
                                    >
                                        Iniciar Sesión
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>

                    {status && (
                        <div className="mt-6 text-center text-sm font-medium text-tuteur-grey bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
                            {status}
                        </div>
                    )}

                    <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                        <div className="inline-flex items-center justify-center space-x-2 text-xs text-tuteur-grey-mid bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                            <Lock className="w-3 h-3 text-tuteur-grey-mid" />
                            <span>La autenticación se realiza mediante Active Directory (LDAP)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
