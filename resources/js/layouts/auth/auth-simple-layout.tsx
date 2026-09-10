import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { BrandPreview } from '@/components/finance/brand-preview';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { t } from '@/lib/i18n';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="bg-background grid min-h-dvh lg:grid-cols-2">
            <aside className="auth-art relative hidden flex-col justify-between gap-10 overflow-hidden p-12 lg:flex xl:p-16">
                <Link href={home()} className="flex w-fit items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-[#293c1e] text-[#d5f59a]">
                        <AppLogoIcon className="size-6" />
                    </span>
                    <span className="text-2xl font-semibold tracking-[-0.05em]">
                        DompetKu.
                    </span>
                </Link>
                <div className="mx-auto w-full max-w-md">
                    <p className="mb-4 text-xs font-semibold tracking-[.16em] uppercase">
                        {t('Ruang keuangan lo')}
                    </p>
                    <h2 className="mb-10 text-5xl leading-[1.08] font-semibold tracking-[-0.06em]">
                        {t('Uang lo,')}
                        <br />
                        {t('kebaca jelas.')}
                    </h2>
                    <BrandPreview />
                </div>
                <p className="text-xs text-[#50603e]">
                    {t('Lebih sadar uang. Lebih tenang jalanin hari.')}
                </p>
            </aside>
            <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-10 lg:px-12">
                <Link
                    href={home()}
                    className="text-muted-foreground hover:text-foreground inline-flex min-h-11 w-fit items-center gap-2 text-xs"
                >
                    <ArrowLeft className="size-4" />
                    {t('Kembali ke beranda')}
                </Link>
                <main
                    id="main-content"
                    className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10"
                >
                    <Link
                        href={home()}
                        className="mb-9 flex w-fit items-center gap-2.5 lg:hidden"
                    >
                        <span className="lime-button grid size-10 place-items-center rounded-2xl">
                            <AppLogoIcon className="size-6" />
                        </span>
                        <span className="text-xl font-semibold tracking-tight">
                            DompetKu.
                        </span>
                    </Link>
                    <div className="mb-8">
                        <h1 className="text-3xl leading-tight font-semibold tracking-[-0.045em]">
                            {title}
                        </h1>
                        <p className="text-muted-foreground mt-3 text-sm leading-6">
                            {description}
                        </p>
                    </div>
                    {children}
                </main>
                <p className="text-muted-foreground py-3 text-center text-xs">
                    {t('Keuangan pribadi, lebih tertata.')}
                </p>
            </div>
        </div>
    );
}
