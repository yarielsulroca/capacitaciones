import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Card } from 'antd';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="flex h-9 w-9 items-center justify-center">
                        <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                    </div>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 w-full !bg-card text-card-foreground">
                        <div className="text-center px-4 pt-4 pb-2">
                            <h2 className="text-xl font-semibold leading-none tracking-tight">{title}</h2>
                            <p className="text-sm text-muted-foreground mt-2">{description}</p>
                        </div>
                        <div className="px-4 py-4 pt-0">
                            {children}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
