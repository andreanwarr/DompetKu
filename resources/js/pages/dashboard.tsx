import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowRight,
    ArrowRightLeft,
    ArrowUpRight,
    CircleAlert,
    CircleCheck,
    HandCoins,
    Info,
    Landmark,
    PiggyBank,
    Plus,
    ReceiptText,
    Wallet,
} from 'lucide-react';
import { DetailDialog } from '@/components/finance/detail-dialog';
import { PageHeading } from '@/components/finance/page-heading';
import { Button } from '@/components/ui/button';
import { rupiah, shortDate } from '@/lib/format';
import { t } from '@/lib/i18n';

type Summary = {
    netWorth: number;
    periodBalance: number;
    availableBalance: number;
    income: number;
    recurringIncome: number;
    bonusIncome: number;
    expense: number;
    savingDeposits: number;
    savingWithdrawals: number;
    savings: number;
    receivables: number;
    loans: number;
};
type SourceBalance = {
    id: number;
    name: string;
    type: string;
    color: string;
    balance: number;
};
type CategoryExpense = {
    id: number;
    name: string;
    color: string;
    total: number;
};
type CategoryTx = {
    title: string;
    amount: number;
    date: string;
};
type Recent = {
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
};
type Insight = { type: 'positive' | 'warning'; text: string };

export default function Dashboard({
    summary,
    sourceBalances,
    expenseByCategory,
    categoryTransactions,
    recentTransactions,
    insights,
}: {
    summary: Summary;
    sourceBalances: SourceBalance[];
    expenseByCategory: CategoryExpense[];
    categoryTransactions: Record<string, CategoryTx[]>;
    recentTransactions: Recent[];
    insights: Insight[];
}) {
    const totalExpense = expenseByCategory.reduce(
        (total, cat) => total + Number(cat.total),
        0,
    );
    const breakdown = [
        {
            label: t('Saldo likuid'),
            value: summary.availableBalance,
            icon: Wallet,
            href: '/fund-sources',
        },
        {
            label: t('Tabungan'),
            value: summary.savings,
            icon: PiggyBank,
            href: '/tabungan',
        },
        {
            label: t('Kasbon aktif'),
            value: summary.receivables,
            icon: HandCoins,
            href: '/kasbon',
        },
        {
            label: t('Total aset'),
            value:
                summary.availableBalance +
                summary.savings +
                summary.receivables,
            icon: Landmark,
            href: '/tabungan',
        },
    ];
    return (
        <>
            <Head title={t('Dashboard')} />
            <main
                id="main-content"
                className="finance-page flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeading
                    eyebrow={t('Ruang keuangan lo')}
                    title={t('Dashboard')}
                    description={t(
                        'Langkah kecil hari ini, keuangan lebih tertata besok.',
                    )}
                    action={
                        <Button asChild>
                            <Link href="/transactions?new=1">
                                <Plus className="size-4" />
                                {t('Catat transaksi')}
                            </Link>
                        </Button>
                    }
                />
                <section
                    aria-label={t('Ringkasan')}
                    className="grid gap-4 xl:grid-cols-[1.15fr_1fr]"
                >
                    <div className="balance-hero flex min-h-60 flex-col justify-between gap-6">
                        <div className="relative z-10 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <Wallet className="size-4" />
                                {t('Saldo Bulan Ini')}
                            </span>
                            <DetailDialog
                                title={t('Saldo Bulan Ini')}
                                description={t(
                                    'Selisih pemasukan dan pengeluaran bulan berjalan. Reset otomatis tiap tanggal 1.',
                                )}
                                items={[
                                    {
                                        label: t('Gaji rutin'),
                                        value: rupiah(summary.recurringIncome),
                                    },
                                    ...(summary.bonusIncome > 0
                                        ? [
                                              {
                                                  label: t('Bonus (di luar patokan)'),
                                                  value: rupiah(summary.bonusIncome),
                                              },
                                          ]
                                        : []),
                                    {
                                        label: t('Pengeluaran'),
                                        value: rupiah(summary.expense),
                                    },
                                    ...(summary.savingDeposits - summary.savingWithdrawals !== 0
                                        ? [
                                              {
                                                  label: t('Setoran tabungan'),
                                                  value: rupiah(summary.savingDeposits - summary.savingWithdrawals),
                                              },
                                          ]
                                        : []),
                                    {
                                        label: t('Sisa kas'),
                                        value: rupiah(summary.periodBalance),
                                    },
                                ]}
                                trigger={
                                    <button
                                        aria-label={t('Info saldo bulan ini')}
                                        className="grid size-11 place-items-center rounded-full border border-black/10 hover:bg-white/30"
                                    >
                                        <Info className="size-4" />
                                    </button>
                                }
                            />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[clamp(1.8rem,3.4vw,3.1rem)] leading-tight font-semibold tracking-[-0.06em] tabular-nums">
                                {rupiah(summary.periodBalance)}
                            </p>
                            <p className="mt-2 text-xs text-[#50603e]">
                                {t('Sisa kas: pemasukan dikurangi pengeluaran & setoran tabungan bulan ini')}
                            </p>
                        </div>
                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-4 text-xs">
                            <span>
                                {t('Saldo Keseluruhan')}
                                <span className="ml-2 font-semibold tabular-nums">
                                    {rupiah(summary.netWorth)}
                                </span>
                            </span>
                            <DetailDialog
                                title={t('Saldo Keseluruhan')}
                                description={t(
                                    'Uang yang bisa dipakai ditambah kasbon yang belum kembali. Tabungan dihitung terpisah.',
                                )}
                                items={[
                                    {
                                        label: t('Saldo likuid'),
                                        value: rupiah(summary.availableBalance),
                                    },
                                    {
                                        label: t('Kasbon aktif'),
                                        value: rupiah(summary.receivables),
                                    },
                                ]}
                                trigger={
                                    <button className="inline-flex min-h-8 items-center gap-1 font-semibold">
                                        {t('Rincian')}
                                        <ArrowUpRight className="size-3.5" />
                                    </button>
                                }
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {[
                            {
                                title: t('Pemasukan'),
                                value: summary.income,
                                icon: ArrowDownLeft,
                                tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                                label: t('Uang masuk'),
                                detail: summary.bonusIncome > 0
                                    ? `${t('Gaji')} ${rupiah(summary.recurringIncome)} · ${t('Bonus')} ${rupiah(summary.bonusIncome)}`
                                    : undefined,
                            },
                            {
                                title: t('Pengeluaran'),
                                value: summary.expense,
                                icon: ArrowUpRight,
                                tone: 'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
                                label: t('Uang keluar'),
                            },
                        ].map((metric) => (
                            <div
                                key={metric.title}
                                className="surface [container-type:inline-size] flex flex-col justify-between gap-4 p-4 sm:gap-6 sm:p-6"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium sm:text-sm">
                                        {metric.title}
                                    </span>
                                    <span
                                        className={`grid size-8 shrink-0 place-items-center rounded-full sm:size-10 ${metric.tone}`}
                                    >
                                        <metric.icon className="size-5" />
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[clamp(1rem,11cqi,1.75rem)] leading-tight font-semibold tracking-[-0.05em] tabular-nums">
                                        {rupiah(metric.value)}
                                    </p>
                                    <p className="text-muted-foreground mt-2 text-xs">
                                        {t('Bulan berjalan')}
                                    </p>
                                </div>
                                <div className="text-muted-foreground border-t pt-3 text-xs">
                                    {metric.label}
                                    {metric.detail && (
                                        <p className="text-foreground/70 mt-1 truncate">{metric.detail}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                <section
                    aria-label={t('Posisi aset & kewajiban')}
                    className="grid grid-cols-2 gap-3 xl:grid-cols-4"
                >
                    {breakdown.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="record-card group relative flex flex-col items-start gap-2 p-4 sm:flex-row sm:items-center sm:gap-3"
                        >
                            <span className="icon-tile">
                                <item.icon className="text-muted-foreground size-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-muted-foreground text-xs">
                                    {item.label}
                                </p>
                                <p className="mt-1 text-sm font-semibold tabular-nums">
                                    {rupiah(item.value)}
                                </p>
                            </div>
                            <ArrowUpRight className="text-muted-foreground size-4 shrink-0" />
                        </Link>
                    ))}
                </section>
                {insights.length > 0 && (
                    <section className="surface" aria-label={t('Saran otomatis')}>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="eyebrow mb-2">{t('Patokan 50/30/20')}</p>
                                <h2 className="panel-title">{t('Saran otomatis')}</h2>
                            </div>
                            <Link
                                href="/reports"
                                className="text-primary inline-flex min-h-11 items-center gap-1 text-xs font-semibold"
                            >
                                {t('Laporan lengkap')}
                                <ArrowUpRight className="size-4" />
                            </Link>
                        </div>
                        <div className="space-y-2.5">
                            {insights.map((ins, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 rounded-xl p-3.5 text-sm ${
                                        ins.type === 'positive'
                                            ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                                            : 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                                    }`}
                                >
                                    {ins.type === 'positive' ? (
                                        <CircleCheck className="mt-0.5 size-4 shrink-0" />
                                    ) : (
                                        <CircleAlert className="mt-0.5 size-4 shrink-0" />
                                    )}
                                    <span>{ins.text}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-muted-foreground mt-3 text-xs">
                            {t(
                                'Patokan umum 50/30/20 (Warren & Tyagi, 2005): tabungan ≥20% pemasukan, kebutuhan wajib ±50%, gaya hidup ±30%. Kategori wajib tidak disarankan dipangkas — sasarannya efisiensi atau menambah pemasukan.',
                            )}
                        </p>
                    </section>
                )}
                <div className="grid items-start gap-5 xl:grid-cols-[1.15fr_1fr]">
                    <section className="surface">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="eyebrow mb-2">{t('Aktivitas')}</p>
                                <h2 className="panel-title">
                                    {t('Transaksi terbaru')}
                                </h2>
                            </div>
                            <Link
                                href="/transactions"
                                className="text-primary inline-flex min-h-11 items-center gap-1 text-xs font-semibold"
                            >
                                {t('Lihat semua')}
                                <ArrowUpRight className="size-4" />
                            </Link>
                        </div>
                        <div className="divide-border divide-y">
                            {recentTransactions.map((tx) => {
                                const income = tx.type === 'income';
                                const expense = tx.type === 'expense';
                                const Icon = income
                                    ? ArrowDownLeft
                                    : expense
                                      ? ArrowUpRight
                                      : ArrowRightLeft;
                                return (
                                    <Link
                                        href="/transactions"
                                        key={tx.id}
                                        className="hover:bg-muted/60 flex flex-wrap items-center gap-3 rounded-xl py-4 transition-colors"
                                    >
                                        <span
                                            className={`grid size-10 shrink-0 place-items-center rounded-2xl ${income ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : expense ? 'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300' : 'bg-[var(--lavender)] text-[var(--lavender-ink)]'}`}
                                        >
                                            <Icon className="size-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {tx.description ||
                                                    t(
                                                        income
                                                            ? 'Pemasukan'
                                                            : expense
                                                              ? 'Pengeluaran'
                                                              : 'Transfer',
                                                    )}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {shortDate(tx.date)}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-sm font-semibold tabular-nums ${income ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                                        >
                                            {income ? '+' : expense ? '−' : ''}
                                            {rupiah(tx.amount)}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                        {recentTransactions.length === 0 && (
                            <div className="empty-state">
                                <ReceiptText className="size-7" />
                                <p>
                                    {t(
                                        'Belum ada transaksi. Mulai dari pemasukan pertama lo.',
                                    )}
                                </p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/transactions?new=1">
                                        {t('Catat transaksi')}
                                        <Plus />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </section>
                    <div className="grid gap-5">
                        <section className="surface">
                            <div className="mb-5 flex items-start justify-between gap-2">
                                <div>
                                    <p className="eyebrow mb-2">
                                        {t('Dompet & rekening')}
                                    </p>
                                    <h2 className="panel-title">
                                        {t('Saldo per sumber dana')}
                                    </h2>
                                </div>
                                <Link
                                    aria-label={t('Sumber dana')}
                                    href="/fund-sources"
                                    className="hover:bg-muted grid size-8 shrink-0 place-items-center rounded-full border sm:size-10"
                                >
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {sourceBalances.map((source) => (
                                    <div
                                        key={source.id}
                                        className="flex flex-wrap items-center gap-3"
                                    >
                                        <span className="icon-tile relative">
                                            <Landmark className="size-4" />
                                            <span
                                                className="absolute right-1.5 bottom-1.5 size-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        source.color,
                                                }}
                                            />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium sm:text-sm">
                                                {source.name}
                                            </p>
                                            <p className="text-muted-foreground text-[11px] capitalize">
                                                {source.type}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold tabular-nums">
                                            {rupiah(source.balance)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {sourceBalances.length === 0 && (
                                <Link
                                    href="/fund-sources"
                                    className="empty-state"
                                >
                                    <Wallet className="size-6" />
                                    {t('Tambahkan sumber dana untuk mulai.')}
                                    <ArrowRight className="size-4" />
                                </Link>
                            )}
                        </section>
                        <section className="surface">
                            <div className="mb-5">
                                <p className="eyebrow mb-2">{t('Bulan ini')}</p>
                                <h2 className="panel-title">
                                    {t('Pengeluaran per kategori')}
                                </h2>
                            </div>
                            {totalExpense > 0 && (
                                <div
                                    className="mb-5 flex h-3 gap-1 overflow-hidden rounded-full"
                                    aria-hidden="true"
                                >
                                    {expenseByCategory.map((cat) => (
                                        <div
                                            key={cat.name}
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(cat.total / totalExpense) * 100}%`,
                                                backgroundColor: cat.color,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="space-y-3">
                                {expenseByCategory.map((cat, index) => {
                                    const percentage = totalExpense > 0
                                        ? Math.round((cat.total / totalExpense) * 100)
                                        : 0;
                                    return (
                                        <DetailDialog
                                            key={cat.name}
                                            title={cat.name}
                                            description={t('Rincian pengeluaran kategori bulan ini.')}
                                            icon={ReceiptText}
                                            items={[
                                                {
                                                    label: t('Total pengeluaran'),
                                                    value: rupiah(cat.total),
                                                    tone: 'negative',
                                                },
                                                {
                                                    label: t('Persentase'),
                                                    value: `${percentage}%`,
                                                },
                                                {
                                                    label: t('Peringkat kategori'),
                                                    value: `#${index + 1}`,
                                                },
                                            ]}
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="record-card hover:border-ring flex w-full flex-col gap-2 p-3 text-left transition-colors"
                                                >
                                                    <div className="flex w-full items-center gap-2 text-xs">
                                                        <span
                                                            className="size-2.5 shrink-0 rounded-full"
                                                            style={{ backgroundColor: cat.color }}
                                                        />
                                                        <span className="min-w-0 flex-1 font-medium">
                                                            {cat.name}
                                                        </span>
                                                        <span className="font-semibold tabular-nums">
                                                            {rupiah(cat.total)}
                                                        </span>
                                                        <span className="text-muted-foreground w-9 text-right tabular-nums">
                                                            {percentage}%
                                                        </span>
                                                    </div>
                                                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                        <div
                                                            className="h-full rounded-full transition-[width]"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: cat.color,
                                                            }}
                                                        />
                                                    </div>
                                                </button>
                                            }
                                        >
                                            <p className="text-muted-foreground mt-4 mb-2 text-xs font-semibold tracking-wide uppercase">
                                                {t('Transaksi di kategori ini')}
                                            </p>
                                            <div className="border-border max-h-64 divide-y overflow-y-auto rounded-2xl border">
                                                {(categoryTransactions[String(cat.id)] ?? []).map((tx, i) => (
                                                    <div
                                                        key={`${tx.date}-${i}`}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm"
                                                    >
                                                        <span className="min-w-0 flex-1 truncate">
                                                            {tx.title}
                                                        </span>
                                                        <span className="text-muted-foreground shrink-0 text-xs">
                                                            {shortDate(tx.date)}
                                                        </span>
                                                        <span className="shrink-0 font-semibold tabular-nums">
                                                            {rupiah(tx.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {(categoryTransactions[String(cat.id)] ?? []).length === 0 && (
                                                    <p className="text-muted-foreground px-4 py-3 text-sm">
                                                        {t('Belum ada transaksi.')}
                                                    </p>
                                                )}
                                            </div>
                                        </DetailDialog>
                                    );
                                })}
                            </div>
                            {expenseByCategory.length === 0 && (
                                <p className="empty-state">
                                    {t('Belum ada pengeluaran bulan ini.')}
                                </p>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}
Dashboard.layout = {
    breadcrumbs: [{ title: t('Dashboard'), href: '/dashboard' }],
};
