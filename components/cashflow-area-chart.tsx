"use client";

import { useMemo, useState } from "react";

import { formatNumberToNOK } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChartContainer, type ChartConfig, ChartLegend } from "./ui/chart";

const chartConfig: ChartConfig = {
    income: {
        label: "Inntekt etter skatt",
        color: "hsl(var(--chart-1))",
    },
    expenses: {
        label: "Utgifter",
        color: "hsl(var(--chart-2))",
    },
    balance: {
        label: "Kontantstrøm",
        color: "hsl(var(--chart-3))",
    },
};

type CashflowPoint = {
    month: string;
    income: number;
    expenses: number;
    balance: number;
};

type CashflowAreaChartProps = {
    data: CashflowPoint[];
    title?: string;
};

export function CashflowAreaChart({ data, title }: CashflowAreaChartProps) {
    const months = data.slice(0, 12);
    const [hoverIndex, setHoverIndex] = useState(months.length - 1);

    const { incomePath, expensePath, xPoints, yScale, maxValue } = useMemo(() => {
        const points = months;
        const maxVal = Math.max(
            ...points.flatMap((point) => [point.income, point.expenses, 1])
        );
        const width = 640;
        const height = 320;
        const padding = { top: 10, right: 12, bottom: 36, left: 60 };
        const innerWidth = width - padding.left - padding.right;
        const innerHeight = height - padding.top - padding.bottom;

        const step = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth;
        const xCoords = points.map((_, index) => padding.left + index * step);

        const scaleY = (value: number) =>
            padding.top + innerHeight - (value / maxVal) * innerHeight;

        const buildPath = (values: number[]) => {
            if (!values.length) return "";

            const start = `M ${padding.left} ${padding.top + innerHeight}`;
            const lines = values
                .map((value, index) => `L ${xCoords[index]} ${scaleY(value)}`)
                .join(" ");
            const end = `L ${
                padding.left + innerWidth
            } ${padding.top + innerHeight} Z`;

            return `${start} ${lines} ${end}`;
        };

        return {
            incomePath: buildPath(points.map((p) => p.income)),
            expensePath: buildPath(points.map((p) => p.expenses)),
            xPoints: xCoords,
            yScale: scaleY,
            maxValue: maxVal,
        };
    }, [months]);

    const activePoint = months[hoverIndex] ?? months[months.length - 1];

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>{title ?? "Kontantstrøm fremover"}</CardTitle>
                    <ChartLegend config={chartConfig} order={["income", "expenses", "balance"]} />
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="p-0">
                    <div className="relative h-[320px] w-full">
                        <svg viewBox="0 0 640 320" className="h-full w-full">
                            <defs>
                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>

                            {/* Grid lines */}
                            {Array.from({ length: 5 }).map((_, idx) => {
                                const ratio = idx / 4;
                                const y = 10 + (1 - ratio) * (320 - 10 - 36 - 10);
                                const value = Math.round(maxValue * ratio);
                                return (
                                    <g key={idx}>
                                        <line
                                            x1={60}
                                            x2={640 - 12}
                                            y1={y}
                                            y2={y}
                                            className="stroke-muted"
                                            strokeDasharray="4 4"
                                            strokeWidth={1}
                                        />
                                        <text
                                            x={52}
                                            y={y + 4}
                                            textAnchor="end"
                                            className="fill-muted-foreground text-[10px]"
                                        >
                                            {formatNumberToNOK(value)}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Income and expense areas */}
                            <path
                                d={incomePath}
                                fill="url(#incomeGradient)"
                                stroke="hsl(var(--chart-1))"
                                strokeWidth={2}
                                className="transition-all duration-200"
                            />
                            <path
                                d={expensePath}
                                fill="url(#expenseGradient)"
                                stroke="hsl(var(--chart-2))"
                                strokeWidth={2}
                                className="transition-all duration-200"
                            />

                            {/* Balance line */}
                            <polyline
                                fill="none"
                                stroke="hsl(var(--chart-3))"
                                strokeWidth={2}
                                points={months
                                    .map((point, index) => `${xPoints[index]},${yScale(point.balance)}`)
                                    .join(" ")}
                            />

                            {/* X axis labels */}
                            {months.map((point, index) => (
                                <text
                                    key={point.month}
                                    x={xPoints[index]}
                                    y={320 - 12}
                                    textAnchor="middle"
                                    className="fill-muted-foreground text-[10px]"
                                >
                                    {point.month}
                                </text>
                            ))}

                            {/* Hover indicator */}
                            {hoverIndex >= 0 && (
                                <g>
                                    <line
                                        x1={xPoints[hoverIndex]}
                                        x2={xPoints[hoverIndex]}
                                        y1={10}
                                        y2={320 - 36}
                                        className="stroke-muted"
                                        strokeDasharray="4 4"
                                    />
                                    <circle
                                        cx={xPoints[hoverIndex]}
                                        cy={yScale(months[hoverIndex].balance)}
                                        r={4}
                                        className="fill-background stroke-[3px] stroke-foreground"
                                    />
                                </g>
                            )}
                        </svg>

                        {/* Hover layer */}
                        <div
                            className="absolute inset-0"
                            onMouseLeave={() => setHoverIndex(months.length - 1)}
                            onMouseMove={(event) => {
                                const rect = event.currentTarget.getBoundingClientRect();
                                const x = event.clientX - rect.left - 60;
                                const innerWidth = 640 - 60 - 12;
                                const ratio = Math.max(0, Math.min(1, x / innerWidth));
                                const index = Math.round(ratio * (months.length - 1));
                                setHoverIndex(index);
                            }}
                        />

                        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border bg-popover px-3 py-2 shadow-sm">
                            <p className="text-sm font-medium text-foreground">{activePoint.month}</p>
                            <p className="text-xs text-muted-foreground">{chartConfig.income.label}</p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatNumberToNOK(activePoint.income)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{chartConfig.expenses.label}</p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatNumberToNOK(activePoint.expenses)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{chartConfig.balance.label}</p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatNumberToNOK(activePoint.balance)}
                            </p>
                        </div>
                    </div>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
