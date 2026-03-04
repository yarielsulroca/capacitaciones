import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Menu as MenuIcon, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, Button, Drawer, Dropdown, Tooltip } from 'antd';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn, toUrl } from '@/lib/utils';
import type { BreadcrumbItem, NavItem } from '@/types';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';
import { useState } from 'react';

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
        title: 'Catálogo de Cursos',
        href: '/courses',
        icon: BookOpen,
    },
    {
        title: 'Administración',
        href: '/admin',
        icon: Folder,
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'Documentación',
        href: 'https://laravel.com/docs',
        icon: BookOpen,
    },
];

const activeItemStyles =
    'bg-white/10 text-white';

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props as any;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();
    const [drawerOpen, setDrawerOpen] = useState(false);

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
                            title={<AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />}
                            styles={{ body: { padding: 0 } }}
                        >
                            <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                <div className="flex flex-col space-y-2">
                                    {mainNavItems.map((item) => (
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
                                </div>
                                <div className="flex flex-col space-y-2 mt-auto">
                                    {rightNavItems.map((item) => (
                                        <a
                                            key={item.title}
                                            href={toUrl(item.href)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 font-medium px-4 py-3 text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900 rounded-md transition-colors"
                                        >
                                            {item.icon && <item.icon className="h-5 w-5" />}
                                            <span>{item.title}</span>
                                        </a>
                                    ))}
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
                        {mainNavItems.map((item, index) => {
                            const currentUrlPath = new URL(page.url, window?.location.origin).pathname;
                            const isActive = item.href === '/dashboard'
                                ? currentUrlPath === '/dashboard' || currentUrlPath === '/'
                                : currentUrlPath.startsWith(item.href as string);
                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={cn(
                                        'relative flex items-center h-9 cursor-pointer px-4 rounded-md text-sm font-semibold transition-colors !no-underline',
                                        isActive
                                            ? 'bg-white/15 !text-white'
                                            : 'bg-transparent !text-white/80 hover:bg-white/10 hover:!text-white',
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
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        <div className="relative flex items-center space-x-1">
                            <Button
                                type="text"
                                icon={<Search className="h-5 w-5 text-white" />}
                                className="group hover:bg-white/10 flex items-center justify-center p-0 w-9 h-9"
                            />
                            <div className="ml-1 hidden gap-1 lg:flex text-white">
                                {rightNavItems.map((item) => (
                                    <Tooltip
                                        key={item.title}
                                        title={item.title}
                                    >
                                        <a
                                            href={toUrl(item.href)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium text-white transition-colors hover:bg-white/10"
                                        >
                                            <span className="sr-only">
                                                {item.title}
                                            </span>
                                            {item.icon && (
                                                <item.icon className="h-5 w-5 text-white" />
                                            )}
                                        </a>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                        <Dropdown popupRender={() => <UserMenuContent user={auth.user} />} trigger={['click']} placement="bottomRight">
                            <Button type="text" className="h-10 w-10 p-0 flex justify-center items-center hover:bg-white/10 rounded-full border-0">
                                <Avatar src={auth.user.avatar} className="bg-white/20 !text-white flex justify-center items-center font-bold text-sm" style={{ width: 34, height: 34, lineHeight: '34px' }}>
                                    {getInitials(auth.user.name)}
                                </Avatar>
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
