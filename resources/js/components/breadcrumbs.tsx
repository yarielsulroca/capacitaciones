import { Link } from '@inertiajs/react';
import { Breadcrumb } from 'antd';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    const items = breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return {
            title: isLast ? item.title : <Link href={item.href}>{item.title}</Link>,
        };
    });

    return <Breadcrumb items={items} />;
}
