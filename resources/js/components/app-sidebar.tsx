import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Building2 } from 'lucide-react';
import { Layout, Menu } from 'antd';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { NavUser } from '@/components/nav-user';

const { Sider } = Layout;

export function AppSidebar() {
    const { auth, sidebarOpen, user_views } = usePage().props as any;
    const { isCurrentUrl } = useCurrentUrl();
    const views: string[] = user_views || [];

    const allNavItems: (NavItem & { viewKey?: string })[] = [
        {
            title: 'Mis Capacitaciones',
            href: '/dashboard',
            icon: LayoutGrid,
            viewKey: 'dashboard',
        },
        ...(views.includes('courses') ? [{
            title: 'Gestión de Cursos',
            href: '/courses',
            icon: BookOpen,
            viewKey: 'courses',
        }] : []),
        ...(views.some(v => v.startsWith('admin.')) ? [{
            title: 'Administración',
            href: '/admin',
            icon: Folder,
        }] : []),
    ];

    const menuItems = allNavItems.map(item => ({
        key: item.href as string,
        icon: item.icon ? <item.icon className="h-4 w-4" /> : null,
        label: <Link href={item.href}>{item.title}</Link>,
    }));

    const activeKey = menuItems.find(item => isCurrentUrl(item.key))?.key;

    return (
        <Sider
            theme="light"
            collapsible
            collapsed={!sidebarOpen}
            className="border-r border-neutral-200 dark:border-neutral-800 hidden md:block min-h-screen"
            width={260}
        >
            <div className="flex h-16 items-center px-4 mb-4">
                <Link href="/dashboard" prefetch className="flex items-center gap-2">
                    <AppLogo />
                </Link>
            </div>

            <div className="flex flex-col justify-between h-[calc(100vh-80px)]">
                <Menu
                    mode="inline"
                    selectedKeys={activeKey ? [activeKey] : []}
                    items={menuItems}
                    className="border-r-0"
                />
                <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 hidden md:block">
                    <NavUser />
                </div>
            </div>
        </Sider>
    );
}
