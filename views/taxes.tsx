'use client';

import { Glance } from '@/components/ledger/Glance';
import useStore, { StoreState } from '@/lib/store';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import { formatNumberToNOK } from '@/lib/utils';

export default function Taxes() {
    const data = useStore((s: StoreState) => s.data);
    const tax = calculateAnnualTaxes(data);

    return (
        <Glance
            density='compact'
            title='Skatteberegning'
            subtitle='Årlige beløp basert på dine inntekter og fradrag'
            indexLabel={`${tax.effectiveTaxRate.toFixed(1)}% effektiv`}
            footnote={
                <>
                    <span>Netto årsinntekt</span>
                    <span className='font-mono tabular-nums'>
                        {formatNumberToNOK(tax.netAnnualIncome)}
                    </span>
                </>
            }
        >
            <Glance.Section>Inntekter</Glance.Section>
            {(data.incomes || []).map((inc, i) => (
                <Glance.Row
                    key={`inc-${i}`}
                    label={
                        <>
                            {inc.source}
                            {inc.taxFree && (
                                <span className='text-muted-foreground'>
                                    {' '}
                                    (skattefritt)
                                </span>
                            )}
                        </>
                    }
                    value={'+ ' + formatNumberToNOK(inc.amount)}
                />
            ))}
            <Glance.Row
                label={<span className='font-medium'>Total brutto inntekt</span>}
                value={
                    <span className='font-medium'>
                        {formatNumberToNOK(tax.totalIncome)}
                    </span>
                }
            />

            <Glance.Section>Renter</Glance.Section>
            {tax.allLoansInterestDetails.map((loan, i) => (
                <Glance.Row
                    key={`loan-${i}`}
                    label={loan.description}
                    value={formatNumberToNOK(loan.annualInterest)}
                />
            ))}
            <Glance.Row
                label={<span className='font-medium'>Totale renter</span>}
                value={
                    <span className='font-medium'>
                        {formatNumberToNOK(tax.totalPaidInterest)}
                    </span>
                }
            />

            <Glance.Section>Fradrag</Glance.Section>
            <Glance.Row
                label='Minstefradrag'
                value={'− ' + formatNumberToNOK(tax.minstefradrag)}
            />
            <Glance.Row
                label='Rentefradrag'
                value={'− ' + formatNumberToNOK(tax.totalInterestDeduction)}
            />
            <Glance.Row
                label={<span className='font-medium'>Totale fradrag</span>}
                value={
                    <span className='font-medium'>
                        {'− ' + formatNumberToNOK(tax.totalDeductions)}
                    </span>
                }
            />

            <Glance.Section>Skatt</Glance.Section>
            <Glance.Row
                label='Skattegrunnlag (alminnelig inntekt)'
                value={formatNumberToNOK(tax.alminnelig)}
            />
            <Glance.Row
                label='Alminnelig skatt (17,72%)'
                value={'− ' + formatNumberToNOK(tax.skatt_alminnelig)}
            />
            <Glance.Row
                label='Trygdeavgift (7,7%)'
                value={'− ' + formatNumberToNOK(tax.trygdeavgift)}
            />
            <Glance.Row
                label='Trinnskatt'
                value={'− ' + formatNumberToNOK(tax.trinnskatt)}
            />
            <Glance.Row
                label='Effektiv skattesats'
                value={`${tax.effectiveTaxRate.toFixed(1)} %`}
            />
            <Glance.Row
                label={<span className='font-medium'>Totale skatter</span>}
                value={
                    <span className='font-medium'>
                        {'− ' + formatNumberToNOK(tax.totalTaxes)}
                    </span>
                }
            />

            <Glance.Total
                label='Netto månedsinntekt'
                value={formatNumberToNOK(tax.netMonthlyIncome)}
            />
        </Glance>
    );
}
