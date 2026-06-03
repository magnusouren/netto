import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function LabelMono({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'font-mono uppercase tracking-[0.12em] text-muted-foreground',
                className
            )}
        >
            {children}
        </span>
    );
}
