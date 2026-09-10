import type { ReactNode } from 'react';

export function PageHeading({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow: string;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <header className="page-heading">
            <div className="min-w-0">
                <p className="eyebrow mb-3 flex items-center gap-2">
                    <span className="bg-primary size-1.5 rounded-full" />
                    {eyebrow}
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.055em] md:text-[2.25rem]">
                    {title}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
                    {description}
                </p>
            </div>
            {action && (
                <div className="w-full shrink-0 sm:w-auto [&>*]:w-full">
                    {action}
                </div>
            )}
        </header>
    );
}
export const selectClass =
    'flex h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';
export const textareaClass =
    'flex min-h-24 w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30';
