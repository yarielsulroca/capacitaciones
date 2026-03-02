import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button, Input } from 'antd';
import AuthLayout from '@/layouts/auth-layout';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    return (
        <AuthLayout
            title="Reset password"
            description="Please enter your new password below"
        >
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors, data, setData }: any) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="mt-1 block w-full"
                                readOnly
                                size="large"
                            />
                            <InputError
                                message={errors?.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
                            <Input.Password
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Password"
                                size="large"
                                value={data?.password}
                                onChange={e => setData && setData('password', e.target.value)}
                                status={errors?.password ? 'error' : ''}
                            />
                            <InputError message={errors?.password} />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="password_confirmation" className="text-sm font-medium leading-none">
                                Confirm password
                            </label>
                            <Input.Password
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirm password"
                                size="large"
                                value={data?.password_confirmation}
                                onChange={e => setData && setData('password_confirmation', e.target.value)}
                                status={errors?.password_confirmation ? 'error' : ''}
                            />
                            <InputError
                                message={errors?.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="primary"
                            htmlType="submit"
                            className="mt-4 w-full"
                            size="large"
                            loading={processing}
                            data-test="reset-password-button"
                        >
                            Reset password
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
