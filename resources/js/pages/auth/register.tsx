import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button, Input } from 'antd';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Registro de Dominio"
            description="Ingresa tus credenciales de dominio para sincronizar tu cuenta."
        >
            <Head title="Registrarse" />
            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <label htmlFor="email" className="text-sm font-medium leading-none">Correo Electrónico</label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={1}
                            autoComplete="email"
                            name="email"
                            size="large"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="usuario@tuteur.com.ar"
                            status={errors.email ? 'error' : ''}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="password" className="text-sm font-medium leading-none">Contraseña de Dominio</label>
                        <Input.Password
                            id="password"
                            required
                            tabIndex={2}
                            autoComplete="new-password"
                            name="password"
                            size="large"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            status={errors.password ? 'error' : ''}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="rounded-md p-3 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                        <p><strong>Nota:</strong> Tu nombre, cargo, área y departamento se sincronizarán automáticamente desde el Active Directory después de la validación.</p>
                    </div>

                    <Button
                        type="primary"
                        htmlType="submit"
                        className="mt-2 w-full"
                        style={{ backgroundColor: '#E30613' }}
                        size="large"
                        tabIndex={3}
                        loading={processing}
                        data-test="register-user-button"
                    >
                        Validar y Registrar
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    ¿Ya tienes una cuenta?{' '}
                    <TextLink href={login().url} tabIndex={4} className="text-[#E30613] hover:text-[#c40510]">
                        Iniciar sesión
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
