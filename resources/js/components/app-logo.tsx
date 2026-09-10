import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';
import { t } from '@/lib/i18n';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[var(--lime)] text-[var(--lime-ink)]">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-1 truncate text-lg leading-tight font-semibold tracking-[-0.05em]">
                    {name}
                </span>
                <span className="text-muted-foreground truncate text-[10px] leading-none">
                    {t('Keuangan pribadi')}
                </span>
            </div>
        </>
    );
}
