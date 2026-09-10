import { Head, useForm } from '@inertiajs/react';
import { Landmark, Plus } from 'lucide-react';
import { useState } from 'react';
import {
    DetailDialog,
    DetailHint,
    interactiveCardClass,
} from '@/components/finance/detail-dialog';
import { PageHeading, selectClass } from '@/components/finance/page-heading';
import { Button } from '@/components/ui/button';
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

type Source = {
    id: number;
    name: string;
    type: string;
    opening_balance_minor: number;
    current_balance_minor: number;
    opening_date: string;
    color: string;
    is_active: boolean;
};
export default function FundSources({
    fundSources,
}: {
    fundSources: Source[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        type: 'bank',
        opening_balance_minor: '',
        opening_date: new Date().toISOString().slice(0, 10),
        color: '#0f766e',
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            opening_balance_minor: Number(data.opening_balance_minor),
        }));
        form.post('/fund-sources', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('name', 'opening_balance_minor');
                setOpen(false);
            },
        });
    };
    return (
        <>
            <Head title={t('Sumber Dana')} />
            <main
                id="main-content"
                className="finance-page flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeading
                    eyebrow={t('Dompet & rekening')}
                    title={t('Sumber dana')}
                    description={t(
                        'Semua dompet dan rekening lo, dalam satu tempat.',
                    )}
                    action={
                        <Button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="min-h-11"
                        >
                            <Plus /> {t('Tambah sumber dana')}
                        </Button>
                    }
                />
                <div className="grid auto-rows-min gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {fundSources.map((source) => (
                        <DetailDialog
                            key={source.id}
                            title={source.name}
                            description={t('Saldo berjalan')}
                            icon={Landmark}
                            items={[
                                {
                                    label: t('Jenis'),
                                    value: source.type,
                                },
                                {
                                    label: t('Saldo saat ini'),
                                    value: rupiah(source.current_balance_minor),
                                },
                                {
                                    label: t('Saldo awal'),
                                    value: rupiah(source.opening_balance_minor),
                                },
                                {
                                    label: t('Tanggal saldo awal'),
                                    value: shortDate(
                                        source.opening_date.slice(0, 10),
                                    ),
                                },
                                {
                                    label: t('Status'),
                                    value: source.is_active
                                        ? t('Aktif')
                                        : t('Nonaktif'),
                                },
                            ]}
                            trigger={
                                <button
                                    type="button"
                                    className={interactiveCardClass}
                                >
                                    <div
                                        className="h-1"
                                        style={{
                                            backgroundColor: source.color,
                                        }}
                                    />
                                    <div className="p-6">
                                        <div className="mb-5 flex items-center justify-between">
                                            <div className="bg-muted ring-border/70 grid size-10 place-items-center rounded-xl ring-1">
                                                <Landmark className="size-5" />
                                            </div>
                                            <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs capitalize">
                                                {source.type}
                                            </span>
                                        </div>
                                        <p className="font-semibold">
                                            {source.name}
                                        </p>
                                        <p className="mt-2 text-xl font-semibold tabular-nums">
                                            {rupiah(
                                                source.current_balance_minor,
                                            )}
                                        </p>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {t('Saldo awal')}{' '}
                                            {rupiah(
                                                source.opening_balance_minor,
                                            )}{' '}
                                            ·{' '}
                                            {shortDate(
                                                source.opening_date.slice(
                                                    0,
                                                    10,
                                                ),
                                            )}
                                        </p>
                                        <DetailHint />
                                    </div>
                                </button>
                            }
                        />
                    ))}
                    {fundSources.length === 0 && (
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="text-muted-foreground hover:border-primary/40 hover:text-foreground flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center text-sm transition-colors"
                        >
                            <Plus className="size-6" />
                            {t(
                                'Belum ada sumber dana. Klik untuk menambahkan.',
                            )}
                        </button>
                    )}
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('Tambah sumber dana')}</DialogTitle>
                            <DialogDescription>
                                {t(
                                    'Saldo berjalan akan dihitung dari sini beserta seluruh transaksi.',
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <Field label={t('Nama')}>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder="BCA Utama"
                                    required
                                />
                            </Field>
                            <Field label={t('Jenis')}>
                                <select
                                    className={selectClass}
                                    value={form.data.type}
                                    onChange={(e) =>
                                        form.setData('type', e.target.value)
                                    }
                                >
                                    <option value="cash">{t('Kas')}</option>
                                    <option value="bank">{t('Bank')}</option>
                                    <option value="ewallet">E-wallet</option>
                                    <option value="prepaid">
                                        {t('Kartu prabayar')}
                                    </option>
                                    <option value="other">
                                        {t('Lainnya')}
                                    </option>
                                </select>
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
                                    required
                                />
                            </Field>
                            <Field label={t('Per tanggal')}>
                                <Input
                                    type="date"
                                    value={form.data.opening_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'opening_date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </Field>
                            <Field label={t('Warna')}>
                                <Input
                                    type="color"
                                    value={form.data.color}
                                    onChange={(e) =>
                                        form.setData('color', e.target.value)
                                    }
                                />
                            </Field>
                            <Button
                                className="w-full"
                                disabled={form.processing}
                            >
                                {form.processing
                                    ? t('Menyimpan…')
                                    : t('Tambahkan')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </>
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
FundSources.layout = {
    breadcrumbs: [{ title: t('Sumber Dana'), href: '/fund-sources' }],
};
