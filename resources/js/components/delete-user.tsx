import { Form } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button, Modal, Input } from 'antd';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';

export default function DeleteUser() {
    const passwordInput = useRef<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Delete account"
                description="Delete your account and all of its resources"
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">
                        Please proceed with caution, this cannot be undone.
                    </p>
                </div>

                <Button
                    danger
                    type="primary"
                    onClick={() => setIsModalOpen(true)}
                    data-test="delete-user-button"
                >
                    Delete account
                </Button>

                <Modal
                    title="Are you sure you want to delete your account?"
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                >
                    <p className="mb-4 text-sm text-neutral-500">
                        Once your account is deleted, all of its resources
                        and data will also be permanently deleted. Please
                        enter your password to confirm you would like to
                        permanently delete your account.
                    </p>

                    <Form
                        {...ProfileController.destroy.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        onError={() => passwordInput.current?.focus()}
                        resetOnSuccess
                        className="space-y-6"
                    >
                        {({ resetAndClearErrors, processing, errors, data, setData }: any) => (
                            <>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="password"
                                        className="sr-only"
                                    >
                                        Password
                                    </label>

                                    <Input.Password
                                        id="password"
                                        name="password"
                                        ref={passwordInput}
                                        placeholder="Password"
                                        autoComplete="current-password"
                                        size="large"
                                        value={data?.password}
                                        onChange={e => setData && setData('password', e.target.value)}
                                        status={errors?.password ? 'error' : ''}
                                    />

                                    <InputError message={errors?.password} />
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <Button
                                        onClick={() => {
                                            resetAndClearErrors();
                                            setIsModalOpen(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        danger
                                        type="primary"
                                        htmlType="submit"
                                        loading={processing}
                                        data-test="confirm-delete-user-button"
                                    >
                                        Delete account
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Modal>
            </div>
        </div>
    );
}
