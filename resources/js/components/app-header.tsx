import { Link, usePage } from '@inertiajs/react';
import { BookOpen, CircleUserRound, Folder, LayoutGrid, Menu as MenuIcon, BarChart3, Building2, Users, GraduationCap } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button, Drawer, Dropdown } from 'antd';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';

import { cn } from '@/lib/utils';
import type { BreadcrumbItem, NavItem } from '@/types';
import AppLogo from './app-logo';

import { useState } from 'react';
import type { MenuProps } from 'antd';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const mainNavItems: NavItem[] = [
    {
        title: 'Mis Capacitaciones',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Gestión de Cursos',
        href: '/courses',
        icon: BookOpen,
    },
];

const adminSubItems: MenuProps['items'] = [
    {
        key: 'courses',
        label: <Link href="/admin/courses" className="no-underline">Cursos e Inscripciones</Link>,
        icon: <GraduationCap className="w-4 h-4" />,
    },
    {
        key: 'metrics',
        label: <Link href="/admin/metrics" className="no-underline">Métricas y Análisis</Link>,
        icon: <BarChart3 className="w-4 h-4" />,
    },
    { type: 'divider' },
    {
        key: 'structure',
        label: <Link href="/admin/structure" className="no-underline">Presupuestos y Estructura</Link>,
        icon: <Building2 className="w-4 h-4" />,
    },
    {
        key: 'admin',
        label: <Link href="/admin/users" className="no-underline">Colaboradores</Link>,
        icon: <Users className="w-4 h-4" />,
    },
];





export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth, user_views } = page.props as any;
    const views: string[] = user_views || [];

    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const currentUrlPath = typeof window !== 'undefined' ? new URL(page.url, window.location.origin).pathname : page.url;
    const isAdminActive = currentUrlPath.startsWith('/admin');

    // Filter main nav items based on view permissions
    const viewKeyMap: Record<string, string> = {
        '/dashboard': 'dashboard',
        '/courses': 'courses',
    };
    const filteredMainNav = mainNavItems.filter(item => {
        const key = viewKeyMap[item.href as string];
        return !key || views.includes(key);
    });

    // Filter admin sub-items based on view permissions
    const adminKeyMap: Record<string, string> = {
        'courses': 'admin.courses',
        'metrics': 'admin.metrics',
        'structure': 'admin.structure',
        'admin': 'admin.users',
    };
    const filteredAdminItems = (adminSubItems || []).filter((item: any) => {
        if (!item || !item.key) return item?.type === 'divider'; // keep dividers
        const viewKey = adminKeyMap[item.key];
        return !viewKey || views.includes(viewKey);
    });
    // Remove dividers if no admin items around them
    const hasAnyAdminView = filteredAdminItems.some((i: any) => i && i.key);

    return (
        <>
            <div className="bg-tuteur-red border-b border-tuteur-red-dark shadow-md">
                <div className="flex h-16 items-center px-4">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Button
                            type="text"
                            icon={<MenuIcon className="h-5 w-5 text-white" />}
                            onClick={() => setDrawerOpen(true)}
                            className="mr-2"
                        />
                        <Drawer
                            placement="left"
                            onClose={() => setDrawerOpen(false)}
                            open={drawerOpen}
                            size="default"
                            title={<img src="/logo_tuteur_transparente.png" alt="Tuteur" className="h-6 w-auto object-contain" />}
                            styles={{ body: { padding: 0 } }}
                        >
                            <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                <div className="flex flex-col space-y-2">
                                    {filteredMainNav.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            onClick={() => setDrawerOpen(false)}
                                            className={cn(
                                                "flex items-center space-x-2 font-medium px-4 py-3 rounded-md transition-colors",
                                                isCurrentUrl(item.href) ? "bg-neutral-100 text-black dark:bg-neutral-800 dark:text-white" : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900"
                                            )}
                                        >
                                            {item.icon && <item.icon className="h-5 w-5" />}
                                            <span>{item.title}</span>
                                        </Link>
                                    ))}
                                    {hasAnyAdminView && (
                                        <div className="border-t pt-2 mt-2">
                                            <div className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider px-4 mb-2">Administración</div>
                                            {filteredAdminItems.filter((i: any) => i && i.key).map((item: any) => (
                                                <div key={item.key} className="px-2 py-1" onClick={() => setDrawerOpen(false)}>{item.label}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </Drawer>
                    </div>

                    <Link
                        href="/dashboard"
                        prefetch
                        className="flex items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-2 lg:flex">
                        {filteredMainNav.map((item, index) => {
                            const isActive = item.href === '/dashboard'
                                ? currentUrlPath === '/dashboard' || currentUrlPath === '/'
                                : currentUrlPath.startsWith(item.href as string);
                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={cn(
                                        'relative flex items-center h-9 cursor-pointer px-4 rounded-md text-sm font-semibold transition-colors no-underline!',
                                        isActive
                                            ? 'bg-white/15 text-white!'
                                            : 'bg-transparent text-white/80! hover:bg-white/10 hover:text-white!',
                                    )}
                                >
                                    {item.icon && (
                                        <item.icon className="mr-2 h-4 w-4" />
                                    )}
                                    {item.title}
                                    {isActive && (
                                        <div className="absolute bottom-[-13px] left-0 h-[3px] w-full bg-white rounded-t"></div>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Admin Dropdown — only show if user has any admin view */}
                        {hasAnyAdminView && (
                            <Dropdown menu={{ items: filteredAdminItems }} trigger={['hover']} placement="bottomLeft">
                                <div
                                    className={cn(
                                        'relative flex items-center h-9 cursor-pointer px-4 rounded-md text-sm font-semibold transition-colors no-underline! select-none',
                                        isAdminActive
                                            ? 'bg-white/15 text-white!'
                                            : 'bg-transparent text-white/80! hover:bg-white/10 hover:text-white!',
                                    )}
                                >
                                    <Folder className="mr-2 h-4 w-4" />
                                    Administración
                                    {isAdminActive && (
                                        <div className="absolute bottom-[-13px] left-0 h-[3px] w-full bg-white rounded-t"></div>
                                    )}
                                </div>
                            </Dropdown>
                        )}
                    </div>

                    <div className="ml-auto flex items-center">
                        <Dropdown popupRender={() => <UserMenuContent user={auth.user} />} trigger={['click']} placement="bottomRight">
                            <Button type="text" className="h-12 w-12 p-0 flex justify-center items-center hover:bg-white/10 rounded-full border-0">
                                <CircleUserRound className="w-8 h-8 text-white" />
                            </Button>
                        </Dropdown>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-neutral-200 dark:border-neutral-800 bg-background">
                    <div className="flex h-12 w-full items-center justify-start px-4 text-neutral-500">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}

