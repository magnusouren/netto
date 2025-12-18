"use client";

import {
    type ComponentPropsWithoutRef,
    type CSSProperties,
    type ElementRef,
    forwardRef,
    useId,
} from "react";

import { cn } from "@/lib/utils";

export type ChartConfig = {
    [key: string]: {
        label?: string;
        color?: string;
    };
};

type ChartContainerProps = ComponentPropsWithoutRef<"div"> & {
    config: ChartConfig;
};

export const ChartContainer = forwardRef<ElementRef<"div">, ChartContainerProps>(
    ({ className, children, config, ...props }, ref) => {
        const id = useId();
        const style = Object.entries(config).reduce<Record<string, string>>(
            (acc, [key, value], index) => {
                const fallback = `hsl(var(--chart-${index + 1}))`;
                acc[`--chart-${key}`] = value.color ?? fallback;
                return acc;
            },
            {}
        );

        return (
            <div
                ref={ref}
                className={cn(
                    "flex w-full flex-col gap-3 overflow-hidden rounded-xl border bg-background p-4",
                    className
                )}
                style={style as CSSProperties}
                {...props}
            >
                <ChartStyle id={id} config={config} />
                {children}
            </div>
        );
    }
);

ChartContainer.displayName = "ChartContainer";

type ChartStyleProps = {
    id: string;
    config: ChartConfig;
};

function ChartStyle({ id, config }: ChartStyleProps) {
    const colorEntries = Object.entries(config).filter(([, value]) => value?.color);

    if (!colorEntries.length) return null;

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: `
                    :root {
                        ${colorEntries
                            .map(([key, value]) => `--chart-${id}-${key}: ${value?.color};`)
                            .join("\n")}
                    }
                `,
            }}
        />
    );
}

type ChartLegendProps = {
    config: ChartConfig;
    order?: string[];
};

export function ChartLegend({ config, order }: ChartLegendProps) {
    const keys = order ?? Object.keys(config);

    return (
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {keys.map((key) => {
                const entry = config[key];
                if (!entry) return null;
                const color = entry.color ?? `var(--chart-${key})`;

                return (
                    <div key={key} className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                                backgroundColor: color,
                            }}
                        />
                        <span className="font-medium text-foreground">{entry.label ?? key}</span>
                    </div>
                );
            })}
        </div>
    );
}
