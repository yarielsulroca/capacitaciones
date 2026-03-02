import * as React from 'react';
import { Layout } from 'antd';

const { Content } = Layout;

type Props = React.ComponentProps<typeof Content> & {
    variant?: 'header' | 'sidebar';
};

export function AppContent({ variant = 'header', children, className, ...props }: Props) {
    if (variant === 'sidebar') {
        return <Content className={`flex flex-col flex-1 bg-background ${className || ''}`} {...props}>{children}</Content>;
    }

    return (
        <Content
            className={`flex h-full w-full flex-1 flex-col gap-4 rounded-xl bg-background p-4 ${className || ''}`}
            {...props}
        >
            {children}
        </Content>
    );
}
