import { Head, useForm } from '@inertiajs/react';
import { HandCoins, Plus, Search } from 'lucide-react';
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
type Debt = {
    id: number;
    counterparty: string;
    principal_minor: number;
    outstanding_minor: number;
    issued_at: string;
    due_date?: string;
    status: string;
};

export default function Kasbon({
    fundSources,
    receivables,
}: {
    fundSources: Source[];
    receivables: Debt[];
}) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'all' | 'active' | 'paid'>('all');
    const [open, setOpen] = useState(false);

    const filtered = receivables.filter(
        (r) =>
            r.counterparty.toLowerCase().includes(search.toLowerCase()) &&
            (status === 'all' ||
                (status === 'paid'
                    ? r.status === 'paid'
                    : r.status !== 'paid')),
    );
    const totalOutstanding = receivables
        .filter((r) => r.status !== 'paid')
        .reduce((sum, r) => sum + r.outstanding_minor, 0);

    const form = useForm({
        counterparty: '',
        fund_source_id: '',
        principal_minor: '',
        issued_at: new Date().toISOString().slice(0, 10),
        due_date: '',
        notes: '',
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            principal_minor: Number(data.principal_minor),
        }));
        form.post('/receivables', {
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
        <>
            <Head title={t('Kasbon')} />
            <main
                id="main-content"
                className="finance-page flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeading
                    eyebrow={t('Piutang')}
                    title={t('Kasbon')}
                    description={t(
                        'Uang yang lo pinjamkan ke orang lain. Kasbon keluar menurunkan saldo likuid, bukan pengeluaran.',
                    )}
                    action={
                        <Button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="min-h-11"
                        >
                            <Plus /> {t('Catat kasbon keluar')}
                        </Button>
                    }
                />

                <Card className="summary-banner bg-[var(--lime)] text-[var(--lime-ink)]">
                    <CardContent className="p-5">
                        <p className="text-muted-foreground text-sm">
                            {t('Total belum tertagih')}
                        </p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] tabular-nums sm:text-4xl">
                            {rupiah(totalOutstanding)}
                        </p>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            aria-label={t('Cari nama...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('Cari nama...')}
                            className="pl-9"
                        />
                    </div>
                    <select
                        className={selectClass + ' sm:w-40'}
                        aria-label={t('Status')}
                        value={status}
                        onChange={(e) =>
                            setStatus(
                                e.target.value as 'all' | 'active' | 'paid',
                            )
                        }
                    >
                        <option value="all">{t('Semua status')}</option>
                        <option value="active">{t('Belum lunas')}</option>
                        <option value="paid">{t('Lunas')}</option>
                    </select>
                </div>

                <div className="space-y-3">
                    {filtered.map((item) => (
                        <KasbonCard
                            key={item.id}
                            item={item}
                            sources={fundSources}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
                            {t('Belum ada kasbon yang cocok.')}
                        </p>
                    )}
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Catat kasbon keluar')}
                            </DialogTitle>
                            <DialogDescription>
                                {t(
                                    'Kasbon keluar menurunkan saldo likuid dan menaikkan piutang.',
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <Field label={t('Penerima kasbon')}>
                                <Input
                                    value={form.data.counterparty}
                                    onChange={(e) =>
                                        form.setData(
                                            'counterparty',
                                            e.target.value,
                                        )
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
                                    <option value="">
                                        {t('Pilih sumber')}
                                    </option>
                                    {fundSources.map((source) => (
                                        <option
                                            key={source.id}
                                            value={source.id}
                                        >
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
                                    value={form.data.issued_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'issued_at',
                                            e.target.value,
                                        )
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
                            <Button
                                className="w-full"
                                disabled={form.processing}
                            >
                                <HandCoins />
                                {form.processing
                                    ? t('Menyimpan…')
                                    : t('Simpan')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </>
    );
}

function KasbonCard({ item, sources }: { item: Debt; sources: Source[] }) {
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
        form.post(`/receivables/${item.id}/payments`, {
            preserveScroll: true,
            onSuccess: () =>
                form.reset(
                    'principal_minor',
                    'interest_minor',
                    'penalty_minor',
                ),
        });
    };
    return (
        <Card>
            <CardContent className="p-5">
                <DetailDialog
                    title={item.counterparty}
                    description={t('Kasbon keluar')}
                    icon={HandCoins}
                    items={[
                        {
                            label: t('Pokok'),
                            value: rupiah(item.principal_minor),
                        },
                        {
                            label: t('Sisa pokok'),
                            value: rupiah(item.outstanding_minor),
                            tone: 'positive',
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
Kasbon.layout = {
    breadcrumbs: [{ title: t('Kasbon'), href: '/kasbon' }],
};
