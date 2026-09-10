import {
    ArrowDownLeft,
    ArrowUpRight,
    Check,
    PiggyBank,
    Wallet,
} from 'lucide-react';
import { t } from '@/lib/i18n';

export function BrandPreview() {
    return (
        <div className="relative mx-auto w-full max-w-md">
            <div
                className="absolute -inset-5 rotate-[-6deg] rounded-[2rem] border border-[#293c1e]/15"
                aria-hidden="true"
            />
            <div className="relative rounded-[1.75rem] bg-[#fcfdf8] p-5 text-[#293c1e] shadow-[0_24px_70px_-40px_#293c1e70] sm:p-7">
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                        DompetKu<span className="text-[#8eaa64]">.</span>
                    </span>
                    <span className="rounded-full bg-[#eef2e5] px-2.5 py-1 text-[10px]">
                        {t('Contoh tampilan')}
                    </span>
                </div>
                <div className="rounded-2xl bg-[#d5f59a] p-5">
                    <div className="flex items-center justify-between text-xs">
                        <span>{t('Saldo bulan ini')}</span>
                        <Wallet className="size-4" />
                    </div>
                    <p className="mt-5 text-3xl font-semibold tracking-[-0.055em] tabular-nums">
                        Rp 4.850.000
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-[10px]">
                        <span className="grid size-4 place-items-center rounded-full bg-[#293c1e] text-[#d5f59a]">
                            <Check className="size-2.5" />
                        </span>
                        {t('Semua tercatat. Semua terlihat.')}
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#e4e7de] p-3">
                        <ArrowDownLeft className="mb-3 size-4 text-emerald-700" />
                        <p className="text-[10px] text-[#697061]">
                            {t('Pemasukan')}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                            Rp 7.500.000
                        </p>
                    </div>
                    <div className="rounded-2xl border border-[#e4e7de] p-3">
                        <ArrowUpRight className="mb-3 size-4 text-orange-800" />
                        <p className="text-[10px] text-[#697061]">
                            {t('Pengeluaran')}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                            Rp 2.650.000
                        </p>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#eee9f8] p-4">
                    <PiggyBank className="size-6 text-[#6a538d]" />
                    <div className="flex-1">
                        <div className="flex justify-between text-[11px] font-medium">
                            <span>{t('Dana darurat')}</span>
                            <span>65%</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#dcd3ed]">
                            <div className="h-full w-[65%] rounded-full bg-[#8a74ae]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
