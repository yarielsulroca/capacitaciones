import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Layout } from 'antd';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
};

export function AppShell({ children, variant = 'header' }: Props) {
    if (variant === 'header') {
        return (
            <Layout className="min-h-screen w-full bg-background">{children}</Layout>
        );
    }
    return <Layout className="min-h-screen w-full bg-background" hasSider>{children}</Layout>;
}
