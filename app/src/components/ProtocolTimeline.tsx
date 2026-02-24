import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    History,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    User as UserIcon,
    Circle,
    TrendingUp,
    Paperclip,
    Edit2
} from 'lucide-react';
import type { ProtocolEvent, ProtocolEventType } from '@/types';
import { cn } from '@/lib/utils';

interface ProtocolTimelineProps {
    events: ProtocolEvent[];
    onEditEvent?: (event: ProtocolEvent) => void;
    className?: string;
}

const eventIcons: Record<ProtocolEventType, any> = {
    'status_change': CheckCircle2,
    'comment': MessageSquare,
    'document_attached': Paperclip,
    'external_update': History,
    'sla_warning': AlertTriangle,
    'requirement_received': AlertTriangle,
};

const eventColors: Record<ProtocolEventType, string> = {
    'status_change': 'text-blue-600 bg-blue-100',
    'comment': 'text-slate-600 bg-slate-100',
    'document_attached': 'text-amber-600 bg-amber-100',
    'external_update': 'text-indigo-600 bg-indigo-100',
    'sla_warning': 'text-red-600 bg-red-100',
    'requirement_received': 'text-orange-600 bg-orange-100',
};

export function ProtocolTimeline({ events, onEditEvent, className }: ProtocolTimelineProps) {
    if (!events || events.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum evento registrado ainda.</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent", className)}>
            {events.map((event) => {
                const Icon = eventIcons[event.type] || Circle;
                const colorClass = eventColors[event.type] || 'text-slate-600 bg-slate-100';

                return (
                    <div key={event.id} className="relative flex items-start group">
                        <div className={cn(
                            "absolute left-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white z-10 transition-transform group-hover:scale-110",
                            colorClass
                        )}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="ml-12 pt-0.5 w-full">
                            <div className="flex items-center justify-between mb-1">
                                <time className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    {format(new Date(event.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                </time>
                                {event.user && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full border">
                                        <UserIcon className="w-3 h-3" />
                                        {event.user.name}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white border rounded-xl p-4 shadow-sm group-hover:shadow-md transition-shadow relative">
                                <p className="text-sm text-slate-700 leading-relaxed font-medium mb-2">
                                    {event.description}
                                </p>

                                {typeof event.progress === 'number' && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 self-start px-2 py-0.5 rounded border border-amber-100 mb-2">
                                        <TrendingUp className="w-3 h-3" />
                                        EVOLUÇÃO: {event.progress}%
                                    </div>
                                )}

                                {event.attachments && event.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                        {event.attachments.map(att => (
                                            <a
                                                key={att.id}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-500 hover:text-amber-600 hover:border-amber-300 transition-colors"
                                            >
                                                <Paperclip className="w-3 h-3" />
                                                {att.name}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {onEditEvent && (
                                    <button
                                        onClick={() => onEditEvent(event)}
                                        className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-all md:opacity-0 group-hover:opacity-100"
                                        title="Editar evento"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {event.metadata && typeof event.metadata === 'string' && (
                                    <p className="mt-2 text-xs text-slate-500 italic">
                                        {event.metadata}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
