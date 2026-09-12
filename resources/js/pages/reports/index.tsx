import { Head, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Download, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    DetailDialog,
    DetailHint,
    interactiveCardClass,
} from '@/components/finance/detail-dialog';
import { PageHeading } from '@/components/finance/page-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rupiah, shortDate } from '@/lib/format';
import { t } from '@/lib/i18n';

type Month = { month: string; income: number; expense: number };
type CategoryExpense = {
    id: number;
    name: string;
    color: string;
    total: number;
};
type CategoryTx = { type?: string; title: string; amount: number; date: string };
export default function Reports({
    filters,
    summary,
    monthly,
    expenseByCategory,
    incomeByCategory,
    insights,
    categoryTransactions,
}: {
    filters: { from: string; to: string };
    summary: { income: number; expense: number; recurringIncome: number; bonusIncome: number };
    monthly: Month[];
    expenseByCategory: CategoryExpense[];
    incomeByCategory: CategoryExpense[];
    insights: { type: 'positive' | 'warning'; text: string }[];
    categoryTransactions: Record<string, CategoryTx[]>;
}) {
    const totalExpense = expenseByCategory.reduce(
        (total, cat) => total + Number(cat.total),
        0,
    );
    // persentase selalu dari pemasukan, bukan dari total pengeluaran — biar proporsinya jujur
    const income = Number(summary.income) || 0;
    const leftover = income - totalExpense;
    const expenseAlloc = [
        ...expenseByCategory,
        ...(leftover > 0 && income > 0
            ? [
                  {
                      id: -1,
                      name: t('Sisa uang'),
                      color: 'var(--muted-foreground)',
                      total: leftover,
                  },
              ]
            : []),
    ];
    const apply = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const from = form.get('from');
        const to = form.get('to');
        router.get(
            '/reports',
            {
                from: typeof from === 'string' ? from : '',
                to: typeof to === 'string' ? to : '',
            },
            { preserveState: true },
        );
    };
    const max = Math.max(
        ...monthly.flatMap((item) => [
            Number(item.income),
            Number(item.expense),
        ]),
        1,
    );
    return (
        <>
            <Head title={t('Laporan')} />
            <main
                id="main-content"
                className="finance-page flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeading
                    eyebrow={t('Analisis')}
                    title={t('Laporan keuangan')}
                    description={t(
                        'Kenali pola keuangan lo. Bandingkan arus kas dan unduh laporan lengkap.',
                    )}
                    action={
                        <Button asChild>
                            <a
                                href={`/exports/finance.xlsx?from=${filters.from}&to=${filters.to}`}
                            >
                                <Download /> {t('Export Excel')}
                            </a>
                        </Button>
                    }
                />
                <Card className="border-border/70">
                    <CardContent className="p-4 sm:p-5">
                        <form
                            onSubmit={apply}
                            className="grid items-end gap-4 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_auto]"
                        >
                            <DateField label={t('Dari')} name="from" value={filters.from} />
                            <DateField label={t('Sampai')} name="to" value={filters.to} />
                            <Button
                                className="min-h-11 w-full sm:w-auto"
                                variant="outline"
                            >
                                {t('Terapkan filter')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <section className="grid gap-4 md:grid-cols-3">
                    <Metric
                        title={t('Pemasukan')}
                        value={summary.income}
                        icon={TrendingUp}
                        tone="emerald"
                        details={categoryDetails(incomeByCategory, summary.income)}
                        categoryData={incomeByCategory}
                        categoryTransactions={categoryTransactions}
                    />
                    <Metric
                        title={t('Pengeluaran')}
                        value={summary.expense}
                        icon={TrendingDown}
                        tone="rose"
                        details={categoryDetails(expenseByCategory, summary.expense)}
                        categoryData={expenseByCategory}
                        categoryTransactions={categoryTransactions}
                    />
                    <Metric
                        title={t('Arus bersih')}
                        value={summary.income - summary.expense}
                        icon={
                            summary.income >= summary.expense
                                ? TrendingUp
                                : TrendingDown
                        }
                        tone="teal"
                        details={[
                            { label: t('Gaji rutin'), value: rupiah(summary.recurringIncome), tone: 'positive' },
                            ...(summary.bonusIncome > 0
                                ? [{ label: t('Bonus (di luar patokan)'), value: rupiah(summary.bonusIncome) }]
                                : []),
                            { label: t('Pengeluaran'), value: rupiah(summary.expense), tone: 'negative' },
                            { label: t('Sisa berdasarkan gaji'), value: rupiah(summary.recurringIncome - summary.expense) },
                            { label: t('Arus kas aktual'), value: rupiah(summary.income - summary.expense) },
                        ]}
                    />
                </section>
                {insights.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Saran otomatis')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {insights.map((ins, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 rounded-xl p-4 text-sm ${
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
                            <p className="text-muted-foreground text-xs">
                                {t(
                                    'Patokan: aturan 50/30/20 — Warren & Tyagi, All Your Worth (2005): tabungan ≥20% pemasukan; satu kategori idealnya <50% pemasukan; dana darurat ideal 3–6× pengeluaran bulanan.',
                                )}
                            </p>
                        </CardContent>
                    </Card>
                )}
                <section className="grid gap-4 md:grid-cols-2">
                    <DonutCard
                        title={t('Alokasi pemasukan')}
                        subtitle={
                            income > 0
                                ? `${t('Pengeluaran')} ${rupiah(totalExpense)} (${Math.round((totalExpense / income) * 100)}% ${t('pemasukan')}) · ${t('sisa')} ${rupiah(leftover)}`
                                : undefined
                        }
                        data={expenseAlloc}
                        total={income}
                        emptyText={t('Belum ada pengeluaran di rentang ini.')}
                    />
                    <DonutCard
                        title={t('Komposisi pemasukan')}
                        data={incomeByCategory}
                        total={incomeByCategory.reduce(
                            (s, c) => s + Number(c.total),
                            0,
                        )}
                        emptyText={t('Belum ada pemasukan di rentang ini.')}
                    />
                </section>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Pengeluaran per kategori')}</CardTitle>
                        {totalExpense > 0 && (
                            <div className="mt-3 flex h-3 gap-1 overflow-hidden rounded-full" aria-hidden="true">
                                {expenseByCategory.map((cat) => (
                                    <div
                                        key={cat.name}
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${(Number(cat.total) / totalExpense) * 100}%`,
                                            backgroundColor: cat.color,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {expenseByCategory.length === 0 ? (
                            <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
                                {t('Belum ada pengeluaran di rentang ini.')}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {expenseByCategory.map((cat, index) => {
                                            const percentage =
                                                income > 0
                                                    ? Math.round(
                                                          (Number(cat.total) / income) * 100,
                                                      )
                                                    : 0;
                                            const shareOfExpense = totalExpense > 0 ? Math.round((Number(cat.total) / totalExpense) * 100) : 0;
                                            return (
                                                <DetailDialog
                                                    key={cat.name}
                                                    title={cat.name}
                                                    description={t('Pengeluaran kategori di rentang ini.')}
                                                    icon={ReceiptText}
                                                    items={[
                                                        {
                                                            label: t('Total pengeluaran'),
                                                            value: rupiah(Number(cat.total)),
                                                            tone: 'negative',
                                                        },
                                                        { label: t('% dari pemasukan'), value: `${percentage}%` },
                                                        { label: t('% dari total pengeluaran'), value: `${shareOfExpense}%` },
                                                        { label: t('Peringkat'), value: `#${index + 1}` },
                                                    ]}
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="hover:bg-muted/60 focus-visible:ring-ring grid w-full gap-2 rounded-xl p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                                                            {rupiah(Number(cat.total))}
                                                        </span>
                                                        <span className="text-muted-foreground w-9 text-right tabular-nums">
                                                            {percentage}%
                                                        </span>
                                                    </div>
                                                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: cat.color,
                                                            }}
                                                        />
                                                    </div>
                                                </button>
                                            }
                                        >
                                            <div className="border-border mt-4 max-h-64 divide-y overflow-y-auto rounded-2xl border">
                                                {(categoryTransactions[String(cat.id)] ?? []).map(
                                                    (tx, i) => (
                                                        <div
                                                            key={`${tx.date}-${i}`}
                                                            className="flex items-center gap-3 px-4 py-3 text-sm"
                                                        >
                                                            <span className="min-w-0 flex-1 truncate">
                                                                {tx.title}
                                                            </span>
                                                            <span className="text-muted-foreground shrink-0 text-xs">
                                                                {tx.date}
                                                            </span>
                                                            <span className="shrink-0 font-semibold tabular-nums">
                                                                {rupiah(tx.amount)}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </DetailDialog>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Tren bulanan')}</CardTitle>
                        <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-xs">
                            <span className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                {t('Pemasukan')}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-rose-500" />
                                {t('Pengeluaran')}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {monthly.length === 0 ? (
                            <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
                                {t('Belum ada data di rentang ini.')}
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {monthly.map((item) => (
                                    <DetailDialog
                                        key={item.month}
                                        title={item.month}
                                        description={t('Tren bulanan')}
                                        icon={
                                            item.income >= item.expense
                                                ? TrendingUp
                                                : TrendingDown
                                        }
                                        items={[
                                            {
                                                label: t('Pemasukan'),
                                                value: rupiah(
                                                    Number(item.income),
                                                ),
                                                tone: 'positive',
                                            },
                                            {
                                                label: t('Pengeluaran'),
                                                value: rupiah(
                                                    Number(item.expense),
                                                ),
                                                tone: 'negative',
                                            },
                                            {
                                                label: t('Arus bersih'),
                                                value: rupiah(
                                                    Number(item.income) -
                                                        Number(item.expense),
                                                ),
                                                tone:
                                                    item.income >= item.expense
                                                        ? 'positive'
                                                        : 'negative',
                                            },
                                        ]}
                                        trigger={
                                            <button
                                                type="button"
                                                className="hover:bg-muted/60 focus-visible:ring-ring grid w-full gap-2 rounded-xl p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none sm:grid-cols-[90px_1fr_130px]"
                                            >
                                                <span className="text-sm font-medium">
                                                    {item.month}
                                                </span>
                                                <div className="space-y-1.5">
                                                    <div className="h-3 rounded-full bg-emerald-100 dark:bg-emerald-950">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500"
                                                            style={{
                                                                width: `${(Number(item.income) / max) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="h-3 rounded-full bg-rose-100 dark:bg-rose-950">
                                                        <div
                                                            className="h-full rounded-full bg-rose-500"
                                                            style={{
                                                                width: `${(Number(item.expense) / max) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-left text-xs tabular-nums sm:text-right">
                                                    <p className="text-emerald-700 dark:text-emerald-400">
                                                        +
                                                        {rupiah(
                                                            Number(item.income),
                                                        )}
                                                    </p>
                                                    <p className="text-rose-700 dark:text-rose-400">
                                                        −
                                                        {rupiah(
                                                            Number(
                                                                item.expense,
                                                            ),
                                                        )}
                                                    </p>
                                                </div>
                                            </button>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
function DonutCard({
    title,
    subtitle,
    data,
    total,
    emptyText,
}: {
    title: string;
    subtitle?: string;
    data: CategoryExpense[];
    total: number;
    emptyText: string;
}) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {subtitle && <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>}
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">{emptyText}</p>
                ) : (
                    <div className="flex items-center gap-5">
                        <div className="relative size-36 shrink-0">
                            <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={title}>
                                <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="16" className="text-muted/40" />
                                {data.map((item) => {
                                    const length = (Number(item.total) / total) * circumference;
                                    const circle = <circle key={item.id} cx="50" cy="50" r={radius} fill="none" stroke={item.color} strokeWidth="16" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />;
                                    offset += length;
                                    return circle;
                                })}
                            </svg>
                            <div className="absolute inset-0 grid place-items-center text-center"><strong className="text-sm tabular-nums">{rupiah(total)}</strong></div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                            {data.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-2 text-xs"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="min-w-0 flex-1 truncate">{item.name}</span><span className="font-semibold tabular-nums">{Math.round(Number(item.total) / total * 100)}%</span></div>)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DateField({
    label,
    name,
    value,
}: {
    label: string;
    name: string;
    value: string;
}) {
    const [open, setOpen] = useState(false);
    const [picked, setPicked] = useState(value);
    const initial = value ? new Date(`${value}T12:00:00`) : new Date();
    const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);
    const selected = picked ? new Date(`${picked}T12:00:00`) : null;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    const monthLabel = month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const choose = (day: number) => {
        const next = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setPicked(next);
        const input = ref.current?.querySelector('input');
        if (input) {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
            setter?.call(input, next);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        setOpen(false);
    };
    return (
        <div ref={ref} className="relative space-y-2">
            <Label>{label}</Label>
            <input type="hidden" name={name} defaultValue={value} />
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="border-input bg-background hover:bg-muted flex h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left text-sm"
            >
                <CalendarDays className="text-muted-foreground size-4" />
                <span>{selected?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) ?? t('Pilih tanggal')}</span>
            </button>
            {open && (
                <div className="bg-popover border-border absolute z-20 mt-2 w-[336px] max-w-[calc(100vw-2.5rem)] rounded-2xl border p-3 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <button type="button" className="grid size-10 place-items-center rounded-xl hover:bg-muted" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></button>
                        <strong className="capitalize text-sm">{monthLabel}</strong>
                        <button type="button" className="grid size-10 place-items-center rounded-xl hover:bg-muted" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">{['Sn', 'Sl', 'Rb', 'Kam', 'Jum', 'Sab', 'Mg'].map((day) => <span key={day} className="py-1">{day}</span>)}{Array.from({ length: offset }, (_, i) => <span key={`empty-${i}`} />)}{Array.from({ length: days }, (_, i) => { const day = i + 1; const active = selected?.getDate() === day && selected?.getMonth() === month.getMonth() && selected?.getFullYear() === month.getFullYear(); return <button type="button" key={day} onClick={() => choose(day)} className={`grid aspect-square min-h-10 place-items-center rounded-xl text-xs ${active ? 'bg-[var(--lime)] font-semibold text-[var(--lime-ink)]' : 'hover:bg-muted'}`}>{day}</button>; })}</div>
                    <div className="mt-3 flex justify-end gap-2 border-t pt-3"><button type="button" className="text-muted-foreground min-h-10 px-3 text-xs" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); choose(now.getDate()); }}>{t('Hari ini')}</button><button type="button" className="min-h-10 px-3 text-xs font-medium" onClick={() => setOpen(false)}>{t('Tutup')}</button></div>
                </div>
            )}
        </div>
    );
}

function categoryDetails(
    data: CategoryExpense[],
    total: number,
): { label: string; value: string; tone?: 'positive' | 'negative' }[] {
    return data.map((item) => ({
        label: item.name,
        value:
            total > 0
                ? `${rupiah(item.total)} · ${Math.round((Number(item.total) / total) * 100)}%`
                : rupiah(item.total),
    }));
}

function Metric({
    title,
    value,
    icon: Icon,
    tone,
    details = [],
    categoryData,
    categoryTransactions,
}: {
    title: string;
    value: number;
    icon: typeof TrendingUp;
    tone: string;
    details?: { label: string; value: string; tone?: 'positive' | 'negative' }[];
    categoryData?: CategoryExpense[];
    categoryTransactions?: Record<string, CategoryTx[]>;
}) {
    const colors: Record<string, string> = {
        emerald:
            'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950',
        rose: 'text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-950',
        teal: 'text-[var(--lime-ink)] bg-[var(--lime)]',
    };
    return (
        <DetailDialog
            title={title}
            description={t('Laporan keuangan')}
            icon={Icon}
            items={details.length > 0 ? details : [{ label: t('Nilai'), value: rupiah(value) }]}
            footer={
                categoryData && categoryData.length > 0 ? (
                    <div className="mt-4 space-y-2">
                        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                            {t('Klik kategori untuk rincian transaksi')}
                        </p>
                        {categoryData.map((cat) => (
                            <DetailDialog
                                key={cat.id}
                                title={cat.name}
                                description={t('Transaksi dalam kategori ini.')}
                                icon={ReceiptText}
                                items={[
                                    { label: t('Total'), value: rupiah(cat.total) },
                                ]}
                                trigger={
                                    <button
                                        type="button"
                                        className="hover:bg-muted/60 flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors"
                                    >
                                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                                        <span className="shrink-0 font-semibold tabular-nums">{rupiah(cat.total)}</span>
                                    </button>
                                }
                            >
                                <div className="border-border mt-4 max-h-64 divide-y overflow-y-auto rounded-2xl border">
                                    {(categoryTransactions?.[String(cat.id)] ?? [])
                                        .filter((tx) => !tx.type || tx.type === (title === t('Pemasukan') ? 'income' : 'expense'))
                                        .map((tx, i) => (
                                            <div key={`${tx.date}-${i}`} className="flex items-center gap-3 px-4 py-3 text-sm">
                                                <span className="min-w-0 flex-1 truncate">{tx.title}</span>
                                                <span className="text-muted-foreground shrink-0 text-xs">{shortDate(tx.date)}</span>
                                                <span className="shrink-0 font-semibold tabular-nums">{rupiah(tx.amount)}</span>
                                            </div>
                                        ))}
                                    {(categoryTransactions?.[String(cat.id)] ?? []).filter((tx) => !tx.type || tx.type === (title === t('Pemasukan') ? 'income' : 'expense')).length === 0 && (
                                        <p className="text-muted-foreground px-4 py-3 text-sm">{t('Belum ada transaksi.')}</p>
                                    )}
                                </div>
                            </DetailDialog>
                        ))}
                    </div>
                ) : null
            }
            trigger={
                <button
                    type="button"
                    className={
                        interactiveCardClass +
                        (tone === 'teal'
                            ? ' summary-banner bg-[var(--lime)] text-[var(--lime-ink)]'
                            : '')
                    }
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 p-6">
                        <div>
                            <p className="text-muted-foreground text-sm">
                                {title}
                            </p>
                            <p className="mt-2 text-xl font-semibold tabular-nums">
                                {rupiah(value)}
                            </p>
                            <DetailHint />
                        </div>
                        <div
                            className={`grid size-10 place-items-center rounded-xl ring-1 ring-current/10 ${colors[tone]}`}
                        >
                            <Icon className="size-5" />
                        </div>
                    </div>
                </button>
            }
        />
    );
}
Reports.layout = { breadcrumbs: [{ title: t('Laporan'), href: '/reports' }] };
