import { Head, useForm } from '@inertiajs/react';
import { FolderTree, Plus } from 'lucide-react';
import { useState } from 'react';
import { DetailDialog } from '@/components/finance/detail-dialog';
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
import { t } from '@/lib/i18n';

type Category = {
    id: number;
    name: string;
    type: string;
    color: string;
    bucket: string;
    is_archived: boolean;
};
const BUCKETS: Record<string, string> = {
    essential: t('Kebutuhan wajib'),
    lifestyle: t('Gaya hidup'),
    saving: t('Tabungan'),
};
export default function Categories({ categories }: { categories: Category[] }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const form = useForm({ name: '', type: 'expense', color: '#64748b', bucket: 'essential' });
    const editForm = useForm({
        name: '',
        bucket: 'lifestyle',
        color: '#64748b',
        _method: 'put',
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/categories', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('name');
                setOpen(false);
            },
        });
    };
    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.post(`/categories/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };
    const startEdit = (category: Category) => {
        setEditing(category);
        editForm.setData({
            name: category.name,
            bucket: category.bucket === 'income' ? 'lifestyle' : category.bucket,
            color: category.color,
        });
    };
    return (
        <>
            <Head title={t('Kategori')} />
            <main
                id="main-content"
                className="finance-page flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeading
                    eyebrow={t('Personalisasi')}
                    title={t('Kategori transaksi')}
                    description={t(
                        'Bikin setiap pemasukan dan pengeluaran lebih mudah dikenali.',
                    )}
                    action={
                        <Button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="min-h-11"
                        >
                            <Plus /> {t('Kategori baru')}
                        </Button>
                    }
                />
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {categories.map((category) => (
                                <DetailDialog
                                    key={category.id}
                                    title={category.name}
                                    description={t('Kategori transaksi')}
                                    icon={FolderTree}
                                    items={[
                                        {
                                            label: t('Jenis'),
                                            value:
                                                category.type === 'income'
                                                    ? t('Pemasukan')
                                                    : t('Pengeluaran'),
                                        },
                                        {
                                            label: t('Kelompok'),
                                            value: BUCKETS[category.bucket] ?? category.bucket,
                                        },
                                        {
                                            label: t('Warna'),
                                            value: category.color,
                                        },
                                        {
                                            label: t('Status'),
                                            value: category.is_archived
                                                ? t('Nonaktif')
                                                : t('Aktif'),
                                        },
                                    ]}
                                    footer={
                                        category.type === 'expense' ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="mt-4 w-full"
                                                onClick={() => startEdit(category)}
                                            >
                                                {t('Ubah kategori')}
                                            </Button>
                                        ) : undefined
                                    }
                                    trigger={
                                        <button
                                            type="button"
                                            className="record-card group focus-visible:ring-ring flex min-h-20 w-full items-center gap-3 p-4 text-left focus-visible:ring-2 focus-visible:outline-none"
                                        >
                                            <div
                                                className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                                                style={{
                                                    backgroundColor:
                                                        category.color,
                                                }}
                                            >
                                                <FolderTree className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {category.name}
                                                </p>
                                                <Badge
                                                    variant="secondary"
                                                    className="mt-1 text-[10px]"
                                                >
                                                    {category.type === 'income'
                                                        ? t('Pemasukan')
                                                        : t('Pengeluaran')}
                                                </Badge>
                                            </div>
                                            <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                ↗
                                            </span>
                                        </button>
                                    }
                                />
                            ))}
                            {categories.length === 0 && (
                                <p className="text-muted-foreground col-span-full py-10 text-center text-sm">
                                    {t('Belum ada kategori.')}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('Kategori baru')}</DialogTitle>
                            <DialogDescription>
                                {t(
                                    'Kategori dipakai untuk mengelompokkan transaksi pemasukan atau pengeluaran.',
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('Nama')}</Label>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder={t('Contoh: Kopi')}
                                    required
                                />
                                {form.errors.name && (
                                    <p className="text-destructive text-xs">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>{t('Jenis')}</Label>
                                <select
                                    className={selectClass}
                                    value={form.data.type}
                                    onChange={(e) =>
                                        form.setData('type', e.target.value)
                                    }
                                >
                                    <option value="expense">
                                        {t('Pengeluaran')}
                                    </option>
                                    <option value="income">
                                        {t('Pemasukan')}
                                    </option>
                                </select>
                            </div>
                            {form.data.type === 'expense' && (
                                <div className="space-y-2">
                                    <Label>{t('Kelompok (untuk saran otomatis)')}</Label>
                                    <select
                                        className={selectClass}
                                        value={form.data.bucket}
                                        onChange={(e) =>
                                            form.setData('bucket', e.target.value)
                                        }
                                    >
                                        {Object.entries(BUCKETS).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>{t('Warna')}</Label>
                                <Input
                                    type="color"
                                    value={form.data.color}
                                    onChange={(e) =>
                                        form.setData('color', e.target.value)
                                    }
                                />
                            </div>
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
                <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('Ubah kategori')}</DialogTitle>
                            <DialogDescription>
                                {t(
                                    'Kelompok menentukan bagaimana saran otomatis menilai kategori ini.',
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('Nama')}</Label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    required
                                />
                                {editForm.errors.name && (
                                    <p className="text-destructive text-xs">
                                        {editForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>{t('Kelompok')}</Label>
                                <select
                                    className={selectClass}
                                    value={editForm.data.bucket}
                                    onChange={(e) =>
                                        editForm.setData('bucket', e.target.value)
                                    }
                                >
                                    {Object.entries(BUCKETS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('Warna')}</Label>
                                <Input
                                    type="color"
                                    value={editForm.data.color}
                                    onChange={(e) =>
                                        editForm.setData('color', e.target.value)
                                    }
                                />
                            </div>
                            <Button
                                className="w-full"
                                disabled={editForm.processing}
                            >
                                {editForm.processing
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
Categories.layout = {
    breadcrumbs: [{ title: t('Kategori'), href: '/categories' }],
};
