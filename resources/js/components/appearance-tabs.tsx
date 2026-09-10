import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { locale } from '@/lib/i18n';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        {
            value: 'light',
            icon: Sun,
            label: locale() === 'id' ? 'Terang' : 'Light',
        },
        {
            value: 'dark',
            icon: Moon,
            label: locale() === 'id' ? 'Gelap' : 'Dark',
        },
        {
            value: 'system',
            icon: Monitor,
            label: locale() === 'id' ? 'Sistem' : 'System',
        },
    ];

    return (
        <div
            className={cn(
                'bg-muted grid w-full grid-cols-3 gap-2 rounded-2xl p-2',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    aria-pressed={appearance === value}
                    className={cn(
                        'flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 transition-colors',
                        appearance === value
                            ? 'bg-card text-foreground ring-border shadow-xs ring-1'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                >
                    <Icon className="-ml-1 h-4 w-4" />
                    <span className="ml-1.5 text-sm">{label}</span>
                </button>
            ))}
        </div>
    );
}
