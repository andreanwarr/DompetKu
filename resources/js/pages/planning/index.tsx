import { Head, useForm } from '@inertiajs/react';
import { HandCoins, PiggyBank, Plus, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { DetailDialog, DetailHint } from '@/components/finance/detail-dialog';
import { PageHeading, selectClass } from '@/components/finance/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rupiah, shortDate } from '@/lib/format';
import { t } from '@/lib/i18n';

type Source = { id: number; name: string };
type Goal = {
    id: number;
    name: string;
    target_minor: number;
    balance: number;
    target_date?: string;
    color: string;
    status: string;
};
type Debt = {
    id: number;
    counterparty: string;
    principal_minor: number;
    outstanding_minor: number;
    due_date?: string;
    status: string;
};
type Props = {
    fundSources: Source[];
    savingGoals: Goal[];
    receivables: Debt[];
    loans: Debt[];
};

export default function Planning({
    fundSources,
    savingGoals,
    receivables,
    loans,
}: Props) {
    const [tab, setTab] = useState<'savings' | 'receivables' | 'loans'>(
        'savings',
    );
    return (
        <>
            <Head title={t('Tabungan & Kasbon')} />
            <main
                id="main-content"
                className="finance-page flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeading
                    eyebrow={t('Rencana & kewajiban')}
                    title={t('Tabungan, kasbon, dan pinjaman')}
                    description={t(
                        'Perpindahan pokok tidak masuk pemasukan atau pengeluaran. Jadi laporan lo tetap jujur.',
                    )}
                />
                <div
                    className="bg-muted grid w-full grid-cols-3 gap-1 rounded-2xl p-1.5 sm:w-fit"
                    role="tablist"
                >
                    {(
                        [
                            ['savings', t('Tabungan')],
                            ['receivables', t('Kasbon')],
                            ['loans', t('Pinjaman')],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            role="tab"
                            aria-selected={tab === value}
                            onClick={() => setTab(value)}
                            className={`min-h-11 rounded-md px-2 text-xs font-medium min-[380px]:px-4 min-[380px]:text-sm ${tab === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {tab === 'savings' && (
                    <Savings goals={savingGoals} sources={fundSources} />
                )}
                {tab === 'receivables' && (
                    <DebtSection
                        kind="receivable"
                        items={receivables}
                        sources={fundSources}
                    />
                )}
                {tab === 'loans' && (
                    <DebtSection
                        kind="loan"
                        items={loans}
                        sources={fundSources}
                    />
                )}
            </main>
        </>
    );
}

function Savings({ goals, sources }: { goals: Goal[]; sources: Source[] }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        target_minor: '',
        opening_balance_minor: '0',
        target_date: '',
        color: '#7c3aed',
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            target_minor: Number(data.target_minor),
            opening_balance_minor: Number(data.opening_balance_minor),
        }));
        form.post('/savings', {
            preserveScroll: true,
            onSuccess: () => form.reset('name', 'target_minor', 'target_date'),
        });
    };
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="min-h-11"
                >
                    <Plus /> {t('Target baru')}
                </Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('Target baru')}</DialogTitle>
                        <DialogDescription>
                            {t(
                                'Tabungan dipisah dari kas likuid, tapi tetap dihitung di saldo keseluruhan.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <Field label={t('Nama target')}>
                            <Input
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder={t('Dana darurat')}
                                required
                            />
                        </Field>
                        <Field label={t('Target nominal')}>
                            <Input
                                type="number"
                                min="1"
                                value={form.data.target_minor}
                                onChange={(e) =>
                                    form.setData('target_minor', e.target.value)
                                }
                                required
                            />
                        </Field>
                        <Field label={t('Saldo awal')}>
                            <Input
                                type="number"
                                min="0"
                                value={form.data.opening_balance_minor}
                                onChange={(e) =>
                                    form.setData(
                                        'opening_balance_minor',
                                        e.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label={t('Target tanggal')}>
                            <Input
                                type="date"
                                value={form.data.target_date}
                                onChange={(e) =>
                                    form.setData('target_date', e.target.value)
                                }
                            />
                        </Field>
                        <Button className="w-full" disabled={form.processing}>
                            {form.processing
                                ? t('Menyimpan…')
                                : t('Buat target')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                {goals.map((goal) => (
                    <SavingCard key={goal.id} goal={goal} sources={sources} />
                ))}
                {goals.length === 0 && (
                    <Empty text={t('Belum ada target tabungan.')} />
                )}
            </div>
        </div>
    );
}

function SavingCard({ goal, sources }: { goal: Goal; sources: Source[] }) {
    const form = useForm({
        direction: 'deposit',
        fund_source_id: '',
        amount_minor: '',
        effective_date: new Date().toISOString().slice(0, 10),
        description: '',
    });
    const percent = Math.min(
        100,
        Math.round((goal.balance / goal.target_minor) * 100),
    );
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            amount_minor: Number(data.amount_minor),
        }));
        form.post(`/savings/${goal.id}/movements`, {
            preserveScroll: true,
            onSuccess: () => form.reset('amount_minor'),
        });
    };
    return (
        <Card className="gap-0 overflow-hidden">
            <div className="h-1" style={{ backgroundColor: goal.color }} />
            <CardContent className="p-5">
                <DetailDialog
                    title={goal.name}
                    description={t('Target nominal')}
                    icon={PiggyBank}
                    items={[
                        {
                            label: t('Saldo saat ini'),
                            value: rupiah(goal.balance),
                            tone: 'positive',
                        },
                        {
                            label: t('Target nominal'),
                            value: rupiah(goal.target_minor),
                        },
                        {
                            label: t('Persentase target'),
                            value: `${percent}%`,
                        },
                        {
                            label: t('Sisa menuju target'),
                            value: rupiah(
                                Math.max(0, goal.target_minor - goal.balance),
                            ),
                        },
                        {
                            label: t('Tanggal target'),
                            value: goal.target_date
                                ? shortDate(goal.target_date.slice(0, 10))
                                : '—',
                        },
                    ]}
                    trigger={
                        <button
                            type="button"
                            className="group hover:bg-muted/50 focus-visible:ring-ring w-full rounded-2xl p-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <div className="flex items-start justify-between">
                                <div className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900">
                                    <PiggyBank className="size-5" />
                                </div>
                                <Badge variant="secondary">{percent}%</Badge>
                            </div>
                            <h3 className="mt-4 font-semibold">{goal.name}</h3>
                            <p className="mt-1 text-xl font-semibold tabular-nums">
                                {rupiah(goal.balance)}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {t('dari')} {rupiah(goal.target_minor)}
                                {goal.target_date
                                    ? ` · ${shortDate(goal.target_date.slice(0, 10))}`
                                    : ''}
                            </p>
                            <div className="bg-muted mt-4 h-2 overflow-hidden rounded-full">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${percent}%`,
                                        backgroundColor: goal.color,
                                    }}
                                />
                            </div>
                            <DetailHint className="mb-4" />
                        </button>
                    }
                />
                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-3 border-t pt-5 min-[420px]:grid-cols-2"
                >
                    <select
                        aria-label={t('Jenis mutasi')}
                        className={selectClass}
                        value={form.data.direction}
                        onChange={(e) =>
                            form.setData('direction', e.target.value)
                        }
                    >
                        <option value="deposit">{t('Setor')}</option>
                        <option value="withdrawal">{t('Cairkan')}</option>
                    </select>
                    <select
                        aria-label={t('Sumber dana')}
                        className={selectClass}
                        value={form.data.fund_source_id}
                        onChange={(e) =>
                            form.setData('fund_source_id', e.target.value)
                        }
                        required
                    >
                        <option value="">{t('Sumber dana')}</option>
                        {sources.map((source) => (
                            <option key={source.id} value={source.id}>
                                {source.name}
                            </option>
                        ))}
                    </select>
                    <Input
                        className="min-[420px]:col-span-2"
                        type="number"
                        min="1"
                        value={form.data.amount_minor}
                        onChange={(e) =>
                            form.setData('amount_minor', e.target.value)
                        }
                        placeholder={t('Nominal')}
                        required
                    />
                    <Button
                        className="min-h-11 min-[420px]:col-span-2"
                        size="sm"
                    >
                        {t('Catat mutasi')}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function DebtSection({
    kind,
    items,
    sources,
}: {
    kind: 'receivable' | 'loan';
    items: Debt[];
    sources: Source[];
}) {
    const [open, setOpen] = useState(false);
    const isReceivable = kind === 'receivable';
    const endpoint = isReceivable ? '/receivables' : '/loans';
    const dateKey = isReceivable ? 'issued_at' : 'received_at';
    const form = useForm({
        counterparty: '',
        fund_source_id: '',
        principal_minor: '',
        [dateKey]: new Date().toISOString().slice(0, 10),
        due_date: '',
        notes: '',
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            principal_minor: Number(data.principal_minor),
        }));
        form.post(endpoint, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset(
                    'counterparty',
                    'principal_minor',
                    'due_date',
                    'notes',
                );
                setOpen(false);
            },
        });
    };
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="min-h-11"
                >
                    <Plus />
                    {isReceivable
                        ? t('Catat kasbon keluar')
                        : t('Catat pinjaman masuk')}
                </Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {isReceivable
                                ? t('Catat kasbon keluar')
                                : t('Catat pinjaman masuk')}
                        </DialogTitle>
                        <DialogDescription>
                            {isReceivable
                                ? t(
                                      'Kasbon keluar menurunkan saldo likuid dan menaikkan piutang.',
                                  )
                                : t(
                                      'Pinjaman masuk menaikkan kas dan kewajiban, bukan pemasukan.',
                                  )}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <Field
                            label={
                                isReceivable
                                    ? t('Penerima kasbon')
                                    : t('Pemberi pinjaman')
                            }
                        >
                            <Input
                                value={form.data.counterparty}
                                onChange={(e) =>
                                    form.setData('counterparty', e.target.value)
                                }
                                required
                            />
                        </Field>
                        <Field label={t('Sumber dana')}>
                            <select
                                className={selectClass}
                                value={form.data.fund_source_id}
                                onChange={(e) =>
                                    form.setData(
                                        'fund_source_id',
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">{t('Pilih sumber')}</option>
                                {sources.map((source) => (
                                    <option key={source.id} value={source.id}>
                                        {source.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label={t('Pokok')}>
                            <Input
                                type="number"
                                min="1"
                                value={form.data.principal_minor}
                                onChange={(e) =>
                                    form.setData(
                                        'principal_minor',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field label={t('Tanggal')}>
                            <Input
                                type="date"
                                value={String(form.data[dateKey])}
                                onChange={(e) =>
                                    form.setData(dateKey, e.target.value)
                                }
                                required
                            />
                        </Field>
                        <Field label={t('Jatuh tempo')}>
                            <Input
                                type="date"
                                value={form.data.due_date}
                                onChange={(e) =>
                                    form.setData('due_date', e.target.value)
                                }
                            />
                        </Field>
                        <Button className="w-full" disabled={form.processing}>
                            {isReceivable ? <HandCoins /> : <WalletCards />}{' '}
                            {form.processing ? t('Menyimpan…') : t('Simpan')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            <div className="space-y-3">
                {items.map((item) => (
                    <DebtCard
                        key={item.id}
                        item={item}
                        kind={kind}
                        sources={sources}
                    />
                ))}
                {items.length === 0 && (
                    <Empty
                        text={
                            isReceivable
                                ? t('Belum ada kasbon aktif.')
                                : t('Belum ada pinjaman tercatat.')
                        }
                    />
                )}
            </div>
        </div>
    );
}

function DebtCard({
    item,
    kind,
    sources,
}: {
    item: Debt;
    kind: 'receivable' | 'loan';
    sources: Source[];
}) {
    const form = useForm({
        fund_source_id: '',
        principal_minor: '',
        interest_minor: '0',
        penalty_minor: '0',
        paid_at: new Date().toISOString().slice(0, 10),
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            principal_minor: Number(data.principal_minor),
            interest_minor: Number(data.interest_minor),
            penalty_minor: Number(data.penalty_minor),
        }));
        form.post(
            `/${kind === 'receivable' ? 'receivables' : 'loans'}/${item.id}/payments`,
            {
                preserveScroll: true,
                onSuccess: () =>
                    form.reset(
                        'principal_minor',
                        'interest_minor',
                        'penalty_minor',
                    ),
            },
        );
    };
    return (
        <Card>
            <CardContent className="p-5">
                <DetailDialog
                    title={item.counterparty}
                    description={
                        kind === 'receivable'
                            ? t('Kasbon keluar')
                            : t('Pinjaman')
                    }
                    icon={kind === 'receivable' ? HandCoins : WalletCards}
                    items={[
                        {
                            label: t('Pokok'),
                            value: rupiah(item.principal_minor),
                        },
                        {
                            label: t('Sisa pokok'),
                            value: rupiah(item.outstanding_minor),
                            tone: kind === 'loan' ? 'negative' : 'positive',
                        },
                        {
                            label: t('Jatuh tempo'),
                            value: item.due_date
                                ? shortDate(item.due_date.slice(0, 10))
                                : '—',
                        },
                        {
                            label: t('Status'),
                            value: debtStatus(item.status),
                        },
                    ]}
                    trigger={
                        <button
                            type="button"
                            className="group hover:bg-muted/60 focus-visible:ring-ring flex w-full flex-col gap-3 rounded-2xl p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none sm:flex-row sm:items-start sm:justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">
                                        {item.counterparty}
                                    </h3>
                                    <Badge
                                        variant={
                                            item.status === 'paid'
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                    >
                                        {debtStatus(item.status)}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {t('Pokok')} {rupiah(item.principal_minor)}
                                    {item.due_date
                                        ? ` · ${t('jatuh tempo')} ${shortDate(item.due_date.slice(0, 10))}`
                                        : ''}
                                </p>
                                <DetailHint />
                            </div>
                            <div className="sm:text-right">
                                <p className="text-muted-foreground text-xs">
                                    {t('Sisa pokok')}
                                </p>
                                <p className="text-lg font-semibold tabular-nums">
                                    {rupiah(item.outstanding_minor)}
                                </p>
                            </div>
                        </button>
                    }
                />
                {item.outstanding_minor > 0 && (
                    <form
                        onSubmit={submit}
                        className="mt-4 grid gap-2 border-t pt-4 md:grid-cols-2 xl:grid-cols-5"
                    >
                        <select
                            aria-label={t('Sumber dana')}
                            className={selectClass}
                            value={form.data.fund_source_id}
                            onChange={(e) =>
                                form.setData('fund_source_id', e.target.value)
                            }
                            required
                        >
                            <option value="">{t('Sumber dana')}</option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name}
                                </option>
                            ))}
                        </select>
                        <Input
                            aria-label={t('Pokok dibayar')}
                            type="number"
                            min="1"
                            max={item.outstanding_minor}
                            value={form.data.principal_minor}
                            onChange={(e) =>
                                form.setData('principal_minor', e.target.value)
                            }
                            placeholder={t('Pokok')}
                            required
                        />
                        <Input
                            aria-label={t('Bunga')}
                            type="number"
                            min="0"
                            value={form.data.interest_minor}
                            onChange={(e) =>
                                form.setData('interest_minor', e.target.value)
                            }
                            placeholder={t('Bunga')}
                        />
                        <Input
                            aria-label={t('Tanggal bayar')}
                            type="date"
                            value={form.data.paid_at}
                            onChange={(e) =>
                                form.setData('paid_at', e.target.value)
                            }
                            required
                        />
                        <Button className="min-h-11" type="submit">
                            {t('Catat bayar')}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function debtStatus(status: string) {
    return t(
        status === 'paid'
            ? 'lunas'
            : status === 'partial'
              ? 'sebagian'
              : status === 'overdue'
                ? 'terlambat'
                : 'aktif',
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
function Empty({ text }: { text: string }) {
    return <p className="empty-state">{text}</p>;
}
Planning.layout = {
    breadcrumbs: [{ title: t('Tabungan & Kasbon'), href: '/planning' }],
};
