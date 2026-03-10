import { usePage } from '@inertiajs/react';
import { CircleUserRound } from 'lucide-react';
import { Dropdown } from 'antd';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';

export function NavUser() {
    const { auth, sidebarOpen } = usePage().props as any;
    const isMobile = useIsMobile();

    return (
        <div className="w-full">
            <Dropdown dropdownRender={() => <UserMenuContent user={auth.user} />} trigger={['click']} placement={isMobile ? 'top' : 'topRight'}>
                <div
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors w-full"
                    data-test="sidebar-menu-button"
                >
                    <UserInfo user={auth.user} />
                    {sidebarOpen && <CircleUserRound className="ml-auto size-4 text-muted-foreground" />}
                </div>
            </Dropdown>
        </div>
    );
}
