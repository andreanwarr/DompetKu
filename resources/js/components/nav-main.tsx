import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import { t } from '@/lib/i18n';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { setOpenMobile } = useSidebar();

    return (
        <SidebarGroup className="px-4 py-2 group-data-[collapsible=icon]:px-1">
            <SidebarGroupLabel>{t('Menu')}</SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="data-[active=false]:hover:bg-muted data-[active=false]:hover:text-foreground min-h-11 rounded-xl px-3 text-[13px]"
                        >
                            <Link
                                href={item.href}
                                onClick={() => setOpenMobile(false)}
                                prefetch
                                aria-current={
                                    isCurrentUrl(item.href) ? 'page' : undefined
                                }
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
