import { Head, useForm } from '@inertiajs/react';
import { PiggyBank, Plus } from 'lucide-react';
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
type Movement = {
    type: string;
    amount: number;
    date: string;
    person: string;
    source: string;
    description?: string;
};
type Goal = {
    id: number;
    name: string;
    target_minor: number;
    balance: number;
    target_date?: string;
    color: string;
    status: string;
    history: Movement[];
};

export default function Tabungan({
    fundSources,
    savingGoals,
}: {
    fundSources: Source[];
    savingGoals: Goal[];
}) {
    const totalSavings = savingGoals.reduce((sum, g) => sum + g.balance, 0);
    return (
        <>
            <Head title={t('Tabungan')} />
            <main
                id="main-content"
                className="finance-page flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeading
                    eyebrow={t('Aset non-likuid')}
                    title={t('Tabungan')}
                    description={t(
                        'Sisihkan sekarang, wujudkan rencana lo pelan-pelan.',
                    )}
                />
                <Card className="summary-banner bg-[var(--lime)] text-[var(--lime-ink)]">
                    <CardContent className="p-5">
                        <p className="text-muted-foreground text-sm">
                            {t('Total tabungan')}
                        </p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] tabular-nums sm:text-4xl">
                            {rupiah(totalSavings)}
                        </p>
                    </CardContent>
                </Card>
                <Savings goals={savingGoals} sources={fundSources} />
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
            onSuccess: () => {
                form.reset('name', 'target_minor', 'target_date');
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
                    <Plus /> {t('Target baru')}
                </Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('Target baru')}</DialogTitle>
                        <DialogDescription>
                            {t(
                                'Saldo awal langsung dihitung sebagai tabungan, bukan dari kas likuid.',
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
                                placeholder={t('Saham')}
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
                    <Empty text={t('Belum ada tabungan.')} />
                )}
            </div>
        </div>
    );
}

function SavingCard({ goal, sources }: { goal: Goal; sources: Source[] }) {
    const form = useForm({
        direction: 'deposit',
        fund_source_id: '',
        external: false,
        counterparty: '',
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
                    footer={
                        goal.history.length > 0 ? (
                            <div className="mt-4">
                                <p className="text-muted-foreground mb-2 text-xs font-medium">
                                    {t('Riwayat mutasi')}
                                </p>
                                <ul className="space-y-2">
                                    {goal.history.slice(0, 8).map((mov, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between gap-3 border-t pt-2 text-xs"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium">
                                                    {shortDate(mov.date)} ·{' '}
                                                    {mov.person}
                                                </p>
                                                <p className="text-muted-foreground truncate">
                                                    {mov.type ===
                                                    'savings_deposit'
                                                        ? t('Setoran')
                                                        : t('Penarikan')}
                                                    {' · '}
                                                    {mov.source}
                                                    {mov.description
                                                        ? ` · ${mov.description}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <span
                                                className={`shrink-0 font-semibold tabular-nums ${
                                                    mov.type ===
                                                    'savings_deposit'
                                                        ? 'text-[var(--success)]'
                                                        : 'text-[var(--danger)]'
                                                }`}
                                            >
                                                {mov.type ===
                                                'savings_deposit'
                                                    ? '+'
                                                    : '−'}
                                                {rupiah(mov.amount)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : undefined
                    }
                    trigger={
                        <button
                            type="button"
                            className="group hover:bg-muted/50 focus-visible:ring-ring w-full rounded-2xl p-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <div className="flex items-start justify-between">
                                <div
                                    className="grid size-10 place-items-center rounded-xl text-white"
                                    style={{ backgroundColor: goal.color }}
                                >
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
                    <label className="flex items-center gap-2 text-sm min-[420px]:col-span-2">
                        <input
                            type="checkbox"
                            checked={form.data.external}
                            onChange={(e) =>
                                form.setData('external', e.target.checked)
                            }
                        />
                        {t('Dari luar (bukan saldo Dompet Utama)')}
                    </label>
                    {!form.data.external && (
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
                    )}
                    <Input
                        aria-label={t('Siapa yang menabung')}
                        value={form.data.counterparty}
                        onChange={(e) =>
                            form.setData('counterparty', e.target.value)
                        }
                        placeholder={t('Yang menabung, mis. Istri')}
                    />
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
Tabungan.layout = {
    breadcrumbs: [{ title: t('Tabungan'), href: '/tabungan' }],
};
