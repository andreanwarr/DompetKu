import { router, usePage } from '@inertiajs/react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

export function LocaleSwitcher() {
    const { locale } = usePage().props;

    const update = (nextLocale: 'id' | 'en') => {
        if (locale === nextLocale) return;

        router.patch(
            '/locale',
            { locale: nextLocale },
            {
                preserveScroll: true,
                onSuccess: () => window.location.reload(),
            },
        );
    };

    return (
        <div className="border-sidebar-border flex items-center gap-1 rounded-lg border p-1 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0">
            <span className="text-muted-foreground ml-1 grid size-8 shrink-0 place-items-center group-data-[collapsible=icon]:hidden">
                <Languages className="size-4" aria-hidden="true" />
                <span className="sr-only">{t('Bahasa')}</span>
            </span>
            {(['id', 'en'] as const).map((item) => (
                <Button
                    key={item}
                    type="button"
                    variant={locale === item ? 'secondary' : 'ghost'}
                    size="sm"
                    className="min-h-11 flex-1 px-2 text-xs group-data-[collapsible=icon]:hidden"
                    aria-label={item === 'id' ? t('Indonesia') : t('Inggris')}
                    aria-pressed={locale === item}
                    onClick={() => update(item)}
                >
                    {item.toUpperCase()}
                </Button>
            ))}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden group-data-[collapsible=icon]:inline-flex"
                aria-label={t('Bahasa')}
                onClick={() => update(locale === 'id' ? 'en' : 'id')}
            >
                <Languages className="size-4" />
            </Button>
        </div>
    );
}
