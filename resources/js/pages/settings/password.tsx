import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button, Input } from 'antd';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import { edit } from '@/routes/user-password';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Password settings',
        href: edit().url,
    },
];

export default function Password() {
    const passwordInput = useRef<any>(null);
    const currentPasswordInput = useRef<any>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />

            <h1 className="sr-only">Password Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Update password"
                        description="Ensure your account is using a long, random password to stay secure"
                    />

                    <Form
                        {...PasswordController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful, data, setData }: any) => (
                            <>
                                <div className="grid gap-2">
                                    <label htmlFor="current_password" className="text-sm font-medium leading-none">
                                        Current password
                                    </label>

                                    <Input.Password
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                        size="large"
                                        value={data?.current_password}
                                        onChange={e => setData && setData('current_password', e.target.value)}
                                        status={errors?.current_password ? 'error' : ''}
                                    />

                                    <InputError
                                        message={errors?.current_password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label htmlFor="password" className="text-sm font-medium leading-none">
                                        New password
                                    </label>

                                    <Input.Password
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder="New password"
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
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder="Confirm password"
                                        size="large"
                                        value={data?.password_confirmation}
                                        onChange={e => setData && setData('password_confirmation', e.target.value)}
                                        status={errors?.password_confirmation ? 'error' : ''}
                                    />

                                    <InputError
                                        message={errors?.password_confirmation}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={processing}
                                        data-test="update-password-button"
                                        size="large"
                                    >
                                        Save password
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
