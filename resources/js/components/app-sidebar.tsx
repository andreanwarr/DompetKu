import { Link } from '@inertiajs/react';
import {
    ChartNoAxesCombined,
    FolderTree,
    HandCoins,
    Landmark,
    LayoutDashboard,
    PiggyBank,
    ReceiptText,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import { t } from '@/lib/i18n';

const mainNavItems: NavItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: t('Transaksi'),
        href: '/transactions',
        icon: ReceiptText,
    },
    {
        title: t('Tabungan'),
        href: '/tabungan',
        icon: PiggyBank,
    },
    {
        title: t('Kasbon'),
        href: '/kasbon',
        icon: HandCoins,
    },
    {
        title: t('Laporan'),
        href: '/reports',
        icon: ChartNoAxesCombined,
    },
    {
        title: t('Sumber Dana'),
        href: '/fund-sources',
        icon: Landmark,
    },
    {
        title: t('Kategori'),
        href: '/categories',
        icon: FolderTree,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-1">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="gap-3 border-t p-3">
                <LocaleSwitcher />
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
