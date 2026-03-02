import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';
import { Avatar } from 'antd';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <div className="flex items-center gap-2 overflow-hidden w-full">
            <Avatar src={user.avatar} className="shrink-0 bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white flex items-center justify-center font-bold">
                {getInitials(user.name)}
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </div>
    );
}
