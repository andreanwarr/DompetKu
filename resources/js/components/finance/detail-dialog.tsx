import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type DetailItem = {
    label: string;
    value: ReactNode;
    tone?: 'default' | 'positive' | 'negative';
};

export function DetailDialog({
    title,
    description,
    icon: Icon,
    items,
    trigger,
    contentClassName,
    children,
    footer,
}: {
    title: string;
    description?: string;
    icon?: LucideIcon;
    items: DetailItem[];
    trigger: ReactNode;
    contentClassName?: string;
    children?: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent
                className={cn(
                    'bg-card border-border max-h-[calc(100svh-2rem)] overflow-y-auto shadow-2xl sm:max-w-md',
                    contentClassName,
                )}
            >
                <DialogHeader className="pr-7 text-left">
                    <div className="mb-1 flex items-center gap-3">
                        {Icon && (
                            <span className="bg-primary/10 text-primary ring-primary/15 grid size-11 shrink-0 place-items-center rounded-2xl ring-1">
                                <Icon className="size-5" aria-hidden="true" />
                            </span>
                        )}
                        <div>
                            <p className="text-primary text-[11px] font-semibold tracking-[0.18em] uppercase">
                                {t('Rincian')}
                            </p>
                            <DialogTitle className="mt-1 text-xl">
                                {title}
                            </DialogTitle>
                        </div>
                    </div>
                    {description && (
                        <DialogDescription className="leading-relaxed">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <dl className="divide-border/70 border-border/70 bg-card/70 divide-y overflow-hidden rounded-2xl border">
                    {items.map((item, index) => (
                        <div
                            key={`${item.label}-${index}`}
                            className="grid gap-1 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5"
                        >
                            <dt className="text-muted-foreground text-sm">
                                {item.label}
                            </dt>
                            <dd
                                className={cn(
                                    'text-sm font-semibold break-words tabular-nums sm:text-right',
                                    item.tone === 'positive' &&
                                        'text-emerald-700 dark:text-emerald-400',
                                    item.tone === 'negative' &&
                                        'text-rose-700 dark:text-rose-400',
                                )}
                            >
                                {item.value}
                            </dd>
                        </div>
                    ))}
                </dl>
                {footer}
                {children}
            </DialogContent>
        </Dialog>
    );
}

export function DetailHint({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'text-primary mt-4 inline-flex items-center gap-1.5 text-xs font-semibold',
                className,
            )}
        >
            {t('Lihat detail')}
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
    );
}

export const interactiveCardClass =
    'record-card group relative w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
