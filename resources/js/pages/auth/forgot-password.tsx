// Components
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button, Input } from 'antd';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors, data, setData }: any) => (
                        <>
                            <div className="grid gap-2">
                                <label htmlFor="email" className="text-sm font-medium leading-none">Email address</label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                    value={data?.email}
                                    onChange={(e) => setData && setData('email', e.target.value)}
                                    size="large"
                                    status={errors?.email ? 'error' : ''}
                                />

                                <InputError message={errors?.email} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="w-full"
                                    size="large"
                                    loading={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    Email password reset link
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Or, return to</span>
                    <TextLink href={login()}>log in</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
