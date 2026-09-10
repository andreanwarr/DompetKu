import { AppBottomNav } from '@/components/app-bottom-nav';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { t } from '@/lib/i18n';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <a
                href="#main-content"
                className="bg-background text-foreground focus:ring-ring sr-only z-50 rounded-md px-4 py-3 shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2"
            >
                {t('Lewati ke konten')}
            </a>
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
                <AppBottomNav />
            </AppContent>
        </AppShell>
    );
}
