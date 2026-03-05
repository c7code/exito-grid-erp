import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Bell,
    ClipboardList,
    AlertTriangle,
    PlayCircle,
    CheckCircle2,
    CheckCheck,
} from 'lucide-react';

const typeConfig: Record<
    AppNotification['type'],
    { icon: typeof Bell; color: string; bg: string }
> = {
    new_task: { icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
    overdue_task: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    task_started: { icon: PlayCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    task_completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

export default function NotificationDropdown() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const {
        notifications,
        unreadCount,
        isLoading,
        loadNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotifications(!!user);

    const handleOpen = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            loadNotifications();
        }
    };

    const handleClick = (notif: AppNotification) => {
        if (!notif.isRead) markAsRead(notif.id);
        setOpen(false);

        // Navigate to appropriate tasks page
        if (user?.role === 'admin') {
            navigate('/admin/tasks');
        } else {
            navigate('/employee/tasks');
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" id="notification-bell">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-[380px] p-0 shadow-xl border border-slate-200"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-sm text-slate-900">Notificações</h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Marcar todas como lidas
                        </button>
                    )}
                </div>

                {/* List */}
                <ScrollArea className="max-h-[400px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                            Carregando...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <Bell className="w-8 h-8 text-slate-300" />
                            <p className="text-sm text-slate-400">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {notifications.map(notif => {
                                const cfg = typeConfig[notif.type] || typeConfig.new_task;
                                const Icon = cfg.icon;

                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/40' : ''
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm truncate ${!notif.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.isRead && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <p className="text-[11px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
