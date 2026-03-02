import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button, Input } from 'antd';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <AuthLayout
            title="Confirm your password"
            description="This is a secure area of the application. Please confirm your password before continuing."
        >
            <Head title="Confirm password" />

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors, data, setData }: any) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
                            <Input.Password
                                id="password"
                                name="password"
                                placeholder="Password"
                                autoComplete="current-password"
                                autoFocus
                                size="large"
                                value={data?.password}
                                onChange={e => setData && setData('password', e.target.value)}
                                status={errors?.password ? 'error' : ''}
                            />

                            <InputError message={errors?.password} />
                        </div>

                        <div className="flex items-center">
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="w-full"
                                size="large"
                                loading={processing}
                                data-test="confirm-password-button"
                            >
                                Confirm password
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
