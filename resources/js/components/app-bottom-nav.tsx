import { Link } from '@inertiajs/react';
import {
    ChartNoAxesCombined,
    LayoutDashboard,
    Plus,
    ReceiptText,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { t } from '@/lib/i18n';

export function AppBottomNav() {
    const { isCurrentUrl } = useCurrentUrl();
    const items = [
        { title: t('Dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { title: t('Transaksi'), href: '/transactions', icon: ReceiptText },
        { title: t('Laporan'), href: '/reports', icon: ChartNoAxesCombined },
    ];
    const renderLink = (item: (typeof items)[number]) => (
        <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrentUrl(item.href) ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors ${isCurrentUrl(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
            <item.icon className="size-5" />
            <span>{item.title}</span>
        </Link>
    );
    return (
        <nav
            aria-label={t('Navigasi utama')}
            className="bottom-nav border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg md:hidden"
        >
            <div className="mx-auto grid max-w-md grid-cols-4 items-center gap-1 px-3 py-2">
                {items.slice(0, 2).map(renderLink)}
                <Link
                    href="/transactions?new=1"
                    aria-label={t('Catat transaksi')}
                    className="lime-button mx-auto grid size-12 place-items-center rounded-2xl"
                >
                    <Plus className="size-6" />
                </Link>
                {items.slice(2).map(renderLink)}
            </div>
        </nav>
    );
}
