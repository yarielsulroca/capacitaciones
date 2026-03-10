import { Link, router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { Divider } from 'antd';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import type { User } from '@/types';
import { logout } from '@/routes';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <div className="rounded-md shadow-md border border-neutral-200 dark:border-neutral-800 p-1 w-56 bg-white dark:bg-neutral-900 text-black dark:text-white">
            <div className="px-2 py-1.5 text-sm">
                <UserInfo user={user} showEmail={true} />
            </div>
            <Divider className="my-1" />
            <Link
                className="flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-black dark:text-white"
                href={logout()}
                as="button"
                onClick={handleLogout}
            >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
            </Link>
        </div>
    );
}
