import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    PiggyBank,
    ReceiptText,
    TrendingUp,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { BrandPreview } from '@/components/finance/brand-preview';
import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';
import { t } from '@/lib/i18n';

export default function Welcome() {
    const { auth } = usePage().props;
    const features = [
        {
            icon: ReceiptText,
            title: t('Catat harian'),
            description: t(
                'Pemasukan dan pengeluaran tercatat rapi per kategori, tanpa ribet.',
            ),
            color: 'bg-accent text-accent-foreground',
        },
        {
            icon: TrendingUp,
            title: t('Kelihatan arus kas'),
            description: t(
                'Ringkasan bulanan bikin kebiasaan belanja lo langsung kebaca.',
            ),
            color: 'bg-[var(--lavender)] text-[var(--lavender-ink)]',
        },
        {
            icon: PiggyBank,
            title: t('Tabungan & kasbon'),
            description: t(
                'Pisahkan dana tabungan dan pantau kasbon yang jalan.',
            ),
            color: 'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
        },
    ];
    return (
        <>
            <Head title="DompetKu" />
            <div className="bg-background text-foreground flex min-h-dvh flex-col">
                <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-6 lg:px-10">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="lime-button grid size-10 place-items-center rounded-2xl">
                            <AppLogoIcon className="size-6" />
                        </span>
                        <span className="text-xl font-semibold tracking-[-0.055em]">
                            DompetKu.
                        </span>
                    </Link>
                    <nav
                        aria-label={t('Navigasi utama')}
                        className="flex items-center gap-2"
                    >
                        {auth.user ? (
                            <Button asChild>
                                <Link href={dashboard()}>
                                    {t('Dashboard')}
                                    <ArrowUpRight />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href={login()}>{t('Masuk')}</Link>
                                </Button>
                                <Button asChild>
                                    <Link href={register()}>
                                        {t('Daftar')}
                                        <ArrowUpRight />
                                    </Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </header>
                <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-12 lg:px-10">
                    <section className="grid items-center gap-14 pt-10 pb-16 md:grid-cols-2 lg:gap-20 lg:pt-16 lg:pb-24">
                        <div>
                            <p className="eyebrow mb-6 flex items-center gap-2">
                                <span className="bg-primary size-2 rounded-full" />
                                {t('Catatan keuangan pribadi')}
                            </p>
                            <h1 className="text-[clamp(3rem,6.5vw,6rem)] leading-[1.06] font-semibold tracking-[-0.075em]">
                                {t('Uang lo,')}
                                <br />
                                <span className="relative inline-block">
                                    <span
                                        className="absolute inset-x-0 bottom-1 h-[28%] -rotate-2 rounded-sm bg-[var(--lime)] dark:bg-[#526c35]"
                                        aria-hidden="true"
                                    />
                                    <span className="relative">
                                        {t('kebaca jelas.')}
                                    </span>
                                </span>
                            </h1>
                            <p className="text-muted-foreground mt-7 max-w-md text-base leading-7">
                                {t(
                                    'Catat transaksi, pantau saldo, dan lihat ke mana uang lo mengalir — tanpa ribet, tanpa jargon.',
                                )}
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <Button size="lg" asChild>
                                    <Link
                                        href={
                                            auth.user ? dashboard() : register()
                                        }
                                    >
                                        {auth.user
                                            ? t('Buka dashboard')
                                            : t('Mulai sekarang')}
                                        <ArrowRight />
                                    </Link>
                                </Button>
                                {!auth.user && (
                                    <Link
                                        href={login()}
                                        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"
                                    >
                                        {t('Sudah punya akun')}
                                        <ArrowUpRight className="size-4" />
                                    </Link>
                                )}
                            </div>
                            <div className="text-muted-foreground mt-8 flex items-center gap-3 text-xs">
                                <span className="bg-border h-px w-8" />
                                {t(
                                    'Lebih sadar uang. Lebih tenang jalanin hari.',
                                )}
                            </div>
                        </div>
                        <div className="rounded-[2.5rem] bg-[#e9eedf] px-7 py-12 sm:px-10 dark:bg-[#2b3525]">
                            <BrandPreview />
                        </div>
                    </section>
                    <section className="border-border grid gap-5 border-t pt-8 md:grid-cols-3">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className="rounded-3xl p-4 sm:p-5"
                            >
                                <div className="mb-5 flex items-center justify-between">
                                    <span
                                        className={
                                            'grid size-12 place-items-center rounded-2xl ' +
                                            feature.color
                                        }
                                    >
                                        <feature.icon className="size-5" />
                                    </span>
                                    <span className="text-muted-foreground text-xs tabular-nums">
                                        0{index + 1}
                                    </span>
                                </div>
                                <h2 className="text-lg font-semibold tracking-tight">
                                    {feature.title}
                                </h2>
                                <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-6">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </section>
                </main>
                <footer className="border-border text-muted-foreground mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 border-t px-5 py-6 text-xs lg:px-10">
                    <span>DompetKu.</span>
                    <span>{t('Keuangan pribadi, lebih tertata.')}</span>
                </footer>
            </div>
        </>
    );
}
