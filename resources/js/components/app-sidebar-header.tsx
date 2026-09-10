import { Link } from '@inertiajs/react';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { locale, t } from '@/lib/i18n';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItem[];
}) {
    const date = new Date().toLocaleDateString(
        locale() === 'id' ? 'id-ID' : 'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' },
    );
    return (
        <header className="border-border/70 flex h-20 shrink-0 items-center justify-between gap-3 border-b px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="bg-card size-11 rounded-xl border" />
                {breadcrumbs.length > 0 ? (
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                ) : (
                    <span className="text-sm font-medium">
                        {t('Dashboard')}
                    </span>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
                <span className="text-muted-foreground hidden items-center gap-2 text-xs lg:flex">
                    <CalendarDays className="size-4" />
                    {date}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="hidden sm:inline-flex"
                >
                    <Link href="/reports">
                        {t('Laporan')}
                        <ArrowUpRight className="size-3.5" />
                    </Link>
                </Button>
                <span className="bg-accent text-accent-foreground rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wider sm:hidden">
                    DOMPETKU
                </span>
            </div>
        </header>
    );
}
