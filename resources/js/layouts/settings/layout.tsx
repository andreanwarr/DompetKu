import { Link } from '@inertiajs/react';
import { Palette, ShieldCheck, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { PageHeading } from '@/components/finance/page-heading';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const items = [
        { title: t('Profil'), href: edit(), icon: UserRound },
        { title: t('Keamanan'), href: editSecurity(), icon: ShieldCheck },
        { title: t('Tampilan'), href: editAppearance(), icon: Palette },
    ];
    return (
        <main
            id="main-content"
            className="finance-page flex flex-1 flex-col gap-7 p-4 md:p-6 lg:p-8"
        >
            <PageHeading
                eyebrow={t('Personal space')}
                title={t('Pengaturan')}
                description={t('Kelola profil dan pengaturan akun lo')}
            />
            <div className="grid items-start gap-6 lg:grid-cols-[200px_1fr]">
                <nav
                    className="bg-muted grid grid-cols-3 gap-1 rounded-2xl p-1.5 lg:grid-cols-1"
                    aria-label={t('Pengaturan')}
                >
                    {items.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            aria-current={
                                isCurrentOrParentUrl(item.href)
                                    ? 'page'
                                    : undefined
                            }
                            className={cn(
                                'flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium transition-colors lg:justify-start lg:px-4 lg:text-sm',
                                isCurrentOrParentUrl(item.href)
                                    ? 'bg-card text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <item.icon className="size-4 shrink-0" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
                <div className="surface max-w-3xl min-w-0">
                    <section className="space-y-10 sm:p-3">{children}</section>
                </div>
            </div>
        </main>
    );
}
