import { Head, useForm } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowRightLeft,
    ArrowUpRight,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Send,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DetailDialog } from '@/components/finance/detail-dialog';
import {
    PageHeading,
    selectClass,
    textareaClass,
} from '@/components/finance/page-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rupiah, shortDate } from '@/lib/format';
import { t } from '@/lib/i18n';

type Source = { id: number; name: string };
type Category = { id: number; name: string; type: 'income' | 'expense' };
type Entry = {
    id: string;
    type: string;
    amount: number;
    date: string;
    description?: string;
    counterparty?: string;
    fund_source_id?: number;
    category_id?: number;
    is_recurring?: boolean;
};
type Props = {
    transactions: { data: Entry[] };
    fundSources: Source[];
    categories: Category[];
};

// crypto.randomUUID cuma ada di secure context (https/localhost); .test tidak
const newIdempotencyKey = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });

export default function Transactions({
    transactions,
    fundSources,
    categories,
}: Props) {
    const localDate = () => {
        const date = new Date();
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 10);
    };
    // tampil "10.000" di input, simpan digit mentah "10000" di state
    const digitsToRupiah = (digits: string) =>
        digits.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
            ? Number(digits.replace(/\D/g, '').replace(/^0+(?=\d)/, '')).toLocaleString('id-ID')
            : '';
    const [mode, setMode] = useState<'expense' | 'income'>('expense');
    const [openCreate, setOpenCreate] = useState(
        () => new URLSearchParams(window.location.search).get('new') === '1',
    );
    const [editing, setEditing] = useState<Entry | null>(null);
    const [openEdit, setOpenEdit] = useState(false);
    const form = useForm({
        type: 'expense',
        amount_minor: '',
        fund_source_id: fundSources[0]?.id ?? '',
        category_id: categories.find((c) => c.type === 'expense')?.id ?? '',
        effective_date: localDate(),
        description: '',
        counterparty: '',
        is_recurring: true,
        idempotency_key: newIdempotencyKey(),
        from_fund_source_id: '',
        to_fund_source_id: '',
    });
    // default kategori mengikuti mode expense/income
    const setMode2 = (next: 'expense' | 'income') => {
        setMode(next);
        const first = categories.find((c) => c.type === next);
        if (first) form.setData('category_id', String(first.id));
        form.clearErrors();
    };
    const visibleCategories = useMemo(
        () => categories.filter((category) => category.type === mode),
        [categories, mode],
    );
    const todayStr = localDate();
    const [calOpen, setCalOpen] = useState(false);
    const [calMonth, setCalMonth] = useState(() => {
        const d = new Date();
        return d.getFullYear() * 12 + d.getMonth();
    });
    const monthLabel = new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
    }).format(new Date(Math.floor(calMonth / 12), calMonth % 12, 1));
    const calendarDays = useMemo(() => {
        const year = Math.floor(calMonth / 12);
        const month = calMonth % 12;
        const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Senin dulu
        const total = new Date(year, month + 1, 0).getDate();
        const pad = (n: number) => String(n).padStart(2, '0');
        return [
            ...Array.from({ length: offset }, () => null),
            ...Array.from({ length: total }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`),
        ];
    }, [calMonth]);
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            type: mode,
            amount_minor: Number(data.amount_minor),
        }));
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('amount_minor', 'description', 'counterparty');
                form.setData('idempotency_key', newIdempotencyKey());
                setOpenCreate(false);
            },
        };
        form.post('/transactions', options);
    };

    // ── Edit transaksi ──
    const openEditModal = (item: Entry) => {
        setEditing(item);
        setMode(item.type === 'income' ? 'income' : 'expense');
        form.setData({
            ...form.data,
            type: item.type,
            amount_minor: String(item.amount),
            fund_source_id: item.fund_source_id ?? fundSources[0]?.id ?? '',
            category_id: item.category_id ?? categories.find((c) => c.type === item.type)?.id ?? '',
            effective_date: item.date,
            description: item.description ?? '',
            counterparty: item.counterparty ?? '',
            is_recurring: item.is_recurring ?? true,
        });
        setOpenEdit(true);
    };
    const submitEdit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!editing) return;
        form.transform((data) => ({ ...data, type: mode, amount_minor: Number(data.amount_minor) }));
        form.put(`/transactions/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('amount_minor', 'description', 'counterparty');
                form.setData('idempotency_key', newIdempotencyKey());
                setEditing(null);
                setOpenEdit(false);
            },
        });
    };

    return (
        <>
            <Head title={t('Transaksi')} />
            <main
                id="main-content"
                className="finance-page flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeading
                    eyebrow={t('Arus kas')}
                    title={t('Catat transaksi')}
                    description={t(
                        'Pemasukan dan pengeluaran memengaruhi laporan. Transfer hanya memindahkan saldo antar sumber dana.',
                    )}
                    action={
                        <Button
                            type="button"
                            onClick={() => setOpenCreate(true)}
                        >
                            <Send className="size-4" />
                            {t('Catat transaksi')}
                        </Button>
                    }
                />
                <div className="flex flex-col gap-4">
                    <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                        <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-md">
                            <DialogHeader className="border-b px-6 py-4 text-left">
                                <DialogTitle>
                                    {t('Catat transaksi')}
                                </DialogTitle>
                                <DialogDescription>
                                    {t(
                                        'Masukkan transaksi baru untuk memperbarui arus kas.',
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="px-6 pt-4">
                                <div className="bg-muted grid grid-cols-2 gap-1 rounded-2xl p-1.5">
                                    {(['expense', 'income'] as const).map(
                                        (item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => setMode2(item)}
                                                aria-pressed={mode === item}
                                                className={`min-h-11 rounded-xl px-1 text-sm font-semibold transition-colors ${mode === item ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                            >
                                                {item === 'expense'
                                                    ? t('Pengeluaran')
                                                    : t('Pemasukan')}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                            <form
                                onSubmit={submit}
                                className="space-y-5 px-6 py-4"
                            >
                                <Field
                                    label={t('Nominal')}
                                    error={form.errors.amount_minor}
                                >
                                    <div className="space-y-2">
                                        <Input
                                            inputMode="numeric"
                                            type="text"
                                            min="1"
                                            className="bg-muted/40 h-14 rounded-2xl text-2xl font-semibold tracking-tight tabular-nums"
                                            value={digitsToRupiah(form.data.amount_minor)}
                                            onChange={(e) =>
                                                form.setData(
                                                    'amount_minor',
                                                    e.target.value.replace(/\D/g, ''),
                                                )
                                            }
                                            placeholder="0"
                                            required
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                10000, 20000, 30000, 50000,
                                                100000,
                                            ].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() =>
                                                        form.setData(
                                                            'amount_minor',
                                                            String(value),
                                                        )
                                                    }
                                                    className={`min-h-9 rounded-lg border px-3 text-xs font-semibold transition-colors ${Number(form.data.amount_minor) === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                                >
                                                    Rp{value / 1000}rb
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </Field>
                                <Field
                                    label={t('Judul transaksi')}
                                    error={form.errors.description}
                                >
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder={t('Judul transaksi')}
                                        className="h-12 rounded-2xl"
                                        required
                                    />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label={t('Sumber dana')}
                                        error={form.errors.fund_source_id}
                                    >
                                        <select
                                            className={selectClass}
                                            value={form.data.fund_source_id}
                                            onChange={(e) =>
                                                form.setData(
                                                    'fund_source_id',
                                                    Number(e.target.value),
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
                                    <Field
                                        label={t('Kategori')}
                                        error={form.errors.category_id}
                                    >
                                        <select
                                            className={selectClass}
                                            value={form.data.category_id}
                                            onChange={(e) =>
                                                form.setData(
                                                    'category_id',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                {t('Pilih kategori')}
                                            </option>
                                            {visibleCategories.map(
                                                (category) => (
                                                    <option
                                                        key={category.id}
                                                        value={category.id}
                                                    >
                                                        {category.name}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </Field>
                                </div>
                                <Field
                                    label={t('Tanggal transaksi')}
                                    error={form.errors.effective_date}
                                >
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setCalOpen(!calOpen)}
                                            aria-expanded={calOpen}
                                            className={`border-input bg-muted/30 flex h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors hover:bg-muted/60 ${calOpen ? 'border-ring' : ''}`}
                                        >
                                            <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                                            <span className="flex-1 text-base">
                                                {new Intl.DateTimeFormat(
                                                    'id-ID',
                                                    {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        timeZone: 'UTC',
                                                    },
                                                ).format(
                                                    new Date(
                                                        `${form.data.effective_date}T00:00:00Z`,
                                                    ),
                                                )}
                                            </span>
                                            <ChevronDown
                                                className={`text-muted-foreground size-4 shrink-0 transition-transform ${calOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {calOpen && (
                                            <div className="border-border bg-card rounded-2xl border p-3">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCalMonth((m) => m - 1)}
                                                        aria-label={t('Bulan sebelumnya')}
                                                        className="hover:bg-accent text-muted-foreground grid size-10 place-items-center rounded-xl transition-colors"
                                                    >
                                                        <ChevronLeft className="size-4" />
                                                    </button>
                                                    <span className="text-sm font-semibold">
                                                        {monthLabel}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCalMonth((m) => m + 1)}
                                                        aria-label={t('Bulan berikutnya')}
                                                        className="hover:bg-accent text-muted-foreground grid size-10 place-items-center rounded-xl transition-colors"
                                                    >
                                                        <ChevronRight className="size-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-7 gap-1 text-center">
                                                    {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((d) => (
                                                        <span
                                                            key={d}
                                                            className="text-muted-foreground py-1.5 text-[11px] font-semibold"
                                                        >
                                                            {d}
                                                        </span>
                                                    ))}
                                                    {calendarDays.map((day, i) =>
                                                        day === null ? (
                                                            <span key={`empty-${i}`} />
                                                        ) : (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={() => {
                                                                    form.setData('effective_date', day);
                                                                    setCalOpen(false);
                                                                }}
                                                                className={
                                                                    day === form.data.effective_date
                                                                        ? 'lime-button min-h-10 rounded-xl text-sm font-semibold'
                                                                        : day === todayStr
                                                                          ? 'border-ring text-foreground min-h-10 rounded-xl border-2 text-sm font-semibold'
                                                                          : 'hover:bg-accent min-h-10 rounded-xl text-sm'
                                                                }
                                                            >
                                                                {Number(day.slice(8))}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            form.setData('effective_date', todayStr);
                                                            setCalOpen(false);
                                                        }}
                                                        className="lime-button min-h-10 flex-1 rounded-xl text-sm font-semibold"
                                                    >
                                                        {t('Hari ini')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCalOpen(false)}
                                                        className="hover:bg-accent text-muted-foreground min-h-10 flex-1 rounded-xl text-sm font-medium"
                                                    >
                                                        {t('Tutup')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Field>
                                {mode === 'income' && (
                                    <label className="border-border flex items-center gap-3 rounded-2xl border p-3 text-sm">
                                        <input type="checkbox" className="size-4" checked={form.data.is_recurring} onChange={(e) => form.setData('is_recurring', e.target.checked)} />
                                        <span className="flex-1">{t('Pemasukan rutin')}<span className="text-muted-foreground block text-xs">{t('Nonaktifkan untuk bonus/THR — tidak dihitung dalam patokan bulanan.')}</span></span>
                                    </label>
                                )}
                                <Field
                                    label={t('Catatan')}
                                    error={form.errors.counterparty}
                                >
                                    <textarea
                                        className={textareaClass}
                                        value={form.data.counterparty}
                                        onChange={(e) =>
                                            form.setData(
                                                'counterparty',
                                                e.target.value,
                                            )
                                        }
                                        placeholder={t('Opsional')}
                                        rows={2}
                                    />
                                </Field>
                                <div className="bg-background sticky bottom-0 -mx-6 border-t px-6 pt-4 pb-6">
                                    <Button
                                        className="bg-primary hover:bg-primary/90 min-h-11 w-full"
                                        disabled={
                                            form.processing ||
                                            fundSources.length === 0
                                        }
                                    >
                                        {form.processing ? (
                                            t('Menyimpan…')
                                        ) : (
                                            <>
                                                <Send /> {t('Simpan transaksi')}
                                            </>
                                        )}
                                    </Button>
                                    {fundSources.length === 0 && (
                                        <p className="mt-2 text-center text-xs text-amber-700 dark:text-amber-400">
                                            {t(
                                                'Tambahkan sumber dana terlebih dahulu.',
                                            )}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                        <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-md">
                            <DialogHeader className="border-b px-6 py-4 text-left">
                                <DialogTitle>{t('Ubah transaksi')}</DialogTitle>
                                <DialogDescription>
                                    {editing?.description}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="px-6 pt-4">
                                <div className="bg-muted grid grid-cols-2 gap-1 rounded-2xl p-1.5">
                                    {(['expense', 'income'] as const).map(
                                        (item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => setMode2(item)}
                                                aria-pressed={mode === item}
                                                className={`min-h-11 rounded-xl px-1 text-sm font-semibold transition-colors ${mode === item ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                            >
                                                {item === 'expense'
                                                    ? t('Pengeluaran')
                                                    : t('Pemasukan')}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                            <form
                                onSubmit={submitEdit}
                                className="space-y-5 px-6 py-4"
                            >
                                <Field
                                    label={t('Nominal')}
                                    error={form.errors.amount_minor}
                                >
                                    <div className="space-y-2">
                                        <Input
                                            inputMode="numeric"
                                            type="text"
                                            className="bg-muted/40 h-14 rounded-2xl text-2xl font-semibold tracking-tight tabular-nums"
                                            value={digitsToRupiah(form.data.amount_minor)}
                                            onChange={(e) =>
                                                form.setData(
                                                    'amount_minor',
                                                    e.target.value.replace(/\D/g, ''),
                                                )
                                            }
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                </Field>
                                <Field
                                    label={t('Judul transaksi')}
                                    error={form.errors.description}
                                >
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        className="h-12 rounded-2xl"
                                        required
                                    />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label={t('Sumber dana')}
                                        error={form.errors.fund_source_id}
                                    >
                                        <select
                                            className={selectClass}
                                            value={form.data.fund_source_id}
                                            onChange={(e) =>
                                                form.setData('fund_source_id', Number(e.target.value))
                                            }
                                            required
                                        >
                                            {fundSources.map((source) => (
                                                <option key={source.id} value={source.id}>
                                                    {source.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field
                                        label={t('Kategori')}
                                        error={form.errors.category_id}
                                    >
                                        <select
                                            className={selectClass}
                                            value={form.data.category_id}
                                            onChange={(e) =>
                                                form.setData('category_id', e.target.value)
                                            }
                                            required
                                        >
                                            {visibleCategories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                                <Field
                                    label={t('Tanggal transaksi')}
                                    error={form.errors.effective_date}
                                >
                                    <Input
                                        type="date"
                                        value={form.data.effective_date}
                                        onChange={(e) =>
                                            form.setData('effective_date', e.target.value)
                                        }
                                        required
                                    />
                                </Field>
                                {mode === 'income' && (
                                    <label className="border-border flex items-center gap-3 rounded-2xl border p-3 text-sm">
                                        <input type="checkbox" className="size-4" checked={form.data.is_recurring} onChange={(e) => form.setData('is_recurring', e.target.checked)} />
                                        <span className="flex-1">{t('Pemasukan rutin')}<span className="text-muted-foreground block text-xs">{t('Nonaktifkan untuk bonus/THR — tidak dihitung dalam patokan bulanan.')}</span></span>
                                    </label>
                                )}
                                <Field
                                    label={t('Catatan')}
                                    error={form.errors.counterparty}
                                >
                                    <textarea
                                        className={textareaClass}
                                        value={form.data.counterparty}
                                        onChange={(e) =>
                                            form.setData('counterparty', e.target.value)
                                        }
                                        rows={2}
                                    />
                                </Field>
                                <div className="bg-background sticky bottom-0 -mx-6 border-t px-6 pt-4 pb-6">
                                    <Button
                                        className="bg-primary hover:bg-primary/90 min-h-11 w-full"
                                        disabled={form.processing}
                                    >
                                        {form.processing ? t('Menyimpan…') : t('Simpan perubahan')}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Card className="border-border shadow-none">
                        <CardHeader className="flex-row items-center justify-between border-b pb-5">
                            <CardTitle>{t('Riwayat transaksi')}</CardTitle>
                            <span className="bg-muted rounded-full px-3 py-1 text-xs font-medium tabular-nums">
                                {transactions.data.length} {t('transaksi')}
                            </span>
                        </CardHeader>
                        <CardContent>
                            {transactions.data.length === 0 ? (
                                <p className="empty-state">
                                    {t('Belum ada transaksi tercatat.')}
                                </p>
                            ) : (
                                <div className="divide-y">
                                    {transactions.data.map((item) => {
                                        const income = item.type === 'income';
                                        const transfer =
                                            item.type === 'transfer';
                                        const title =
                                            item.description ||
                                            item.counterparty ||
                                            (transfer
                                                ? t('Transfer dana')
                                                : income
                                                  ? t('Pemasukan')
                                                  : t('Pengeluaran'));
                                        const typeLabel = income
                                            ? t('Pemasukan')
                                            : item.type === 'expense'
                                              ? t('Pengeluaran')
                                              : t('Transfer');
                                        return (
                                            <DetailDialog
                                                key={item.id}
                                                title={title}
                                                description={shortDate(
                                                    item.date,
                                                )}
                                                icon={
                                                    income
                                                        ? ArrowDownLeft
                                                        : transfer
                                                          ? ArrowRightLeft
                                                          : ArrowUpRight
                                                }
                                                items={[
                                                    {
                                                        label: t('Jenis'),
                                                        value: typeLabel,
                                                    },
                                                    {
                                                        label: t('Tanggal'),
                                                        value: shortDate(
                                                            item.date,
                                                        ),
                                                    },
                                                    {
                                                        label: t('Nominal'),
                                                        value: `${income ? '+' : item.type === 'expense' ? '−' : ''}${rupiah(item.amount)}`,
                                                        tone: income
                                                            ? 'positive'
                                                            : item.type ===
                                                                'expense'
                                                              ? 'negative'
                                                              : 'default',
                                                    },
                                                    ...(item.counterparty
                                                        ? [
                                                              {
                                                                  label: t(
                                                                      'Pihak / merchant',
                                                                  ),
                                                                  value: item.counterparty,
                                                              },
                                                          ]
                                                        : []),
                                                ]}
                                                footer={
                                                    !transfer ? (
                                                        <Button
                                                            variant="outline"
                                                            className="mt-4 w-full"
                                                            onClick={() => openEditModal(item)}
                                                        >
                                                            <Pencil /> {t('Ubah transaksi')}
                                                        </Button>
                                                    ) : undefined
                                                }
                                                trigger={
                                                    <button
                                                        type="button"
                                                        className="group hover:bg-muted/60 focus-visible:ring-ring flex min-h-16 w-full items-center gap-3 rounded-xl px-2 py-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                                    >
                                                        <div
                                                            className={`grid size-10 shrink-0 place-items-center rounded-xl ${income ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : transfer ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}
                                                        >
                                                            {income ? (
                                                                <ArrowDownLeft className="size-5" />
                                                            ) : transfer ? (
                                                                <ArrowRightLeft className="size-5" />
                                                            ) : (
                                                                <ArrowUpRight className="size-5" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">
                                                                {title}
                                                            </p>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <span className="text-muted-foreground text-xs">
                                                                    {shortDate(
                                                                        item.date,
                                                                    )}
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[10px]"
                                                                >
                                                                    {typeLabel}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`shrink-0 text-xs font-semibold tabular-nums min-[380px]:text-sm ${income ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                                                        >
                                                            {income
                                                                ? '+'
                                                                : item.type ===
                                                                    'expense'
                                                                  ? '−'
                                                                  : ''}
                                                            {rupiah(
                                                                item.amount,
                                                            )}
                                                        </span>
                                                        <span className="text-primary hidden opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
                                                            ↗
                                                        </span>
                                                    </button>
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
            {error && (
                <p role="alert" className="text-destructive text-xs">
                    {error}
                </p>
            )}
        </div>
    );
}
Transactions.layout = {
    breadcrumbs: [{ title: t('Transaksi'), href: '/transactions' }],
};
