'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'

type NumericInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
    value?: number | string
}

const THOUSAND_SEP = ' '

const sanitize = (raw: string) => {
    const cleaned = raw.replace(/,/g, '.').replace(/[^\d.-]/g, '')
    const negative = cleaned.startsWith('-')
    const unsigned = cleaned.replace(/-/g, '')
    const firstDot = unsigned.indexOf('.')
    const normalized =
        firstDot === -1
            ? unsigned
            : unsigned.slice(0, firstDot + 1) +
              unsigned.slice(firstDot + 1).replace(/\./g, '')
    return negative ? `-${normalized}` : normalized
}

const formatNumber = (clean: string) => {
    if (clean === '' || clean === '-') return clean
    const negative = clean.startsWith('-')
    const unsigned = negative ? clean.slice(1) : clean
    const [intPart, decPart] = unsigned.split('.')
    const formattedInt = (intPart || '0').replace(
        /\B(?=(\d{3})+(?!\d))/g,
        THOUSAND_SEP
    )
    const result =
        decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
    return negative ? `-${result}` : result
}

const toClean = (v: number | string | undefined) => {
    if (v === undefined || v === null || v === '') return '0'
    return sanitize(String(v))
}

function NumericInput({
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
}: NumericInputProps) {
    const [displayValue, setDisplayValue] = React.useState<string>(() =>
        formatNumber(toClean(value))
    )
    const focused = React.useRef(false)
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const caretRef = React.useRef<number | null>(null)

    React.useEffect(() => {
        if (!focused.current) {
            setDisplayValue(formatNumber(toClean(value)))
        }
    }, [value])

    React.useLayoutEffect(() => {
        if (caretRef.current !== null && inputRef.current) {
            const pos = caretRef.current
            inputRef.current.setSelectionRange(pos, pos)
            caretRef.current = null
        }
    }, [displayValue])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = true
        if (Number(sanitize(displayValue)) === 0) {
            setDisplayValue('')
        }
        onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = false
        if (displayValue === '' || displayValue === '-') {
            setDisplayValue('0')
        } else {
            setDisplayValue(formatNumber(sanitize(displayValue)))
        }
        onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target
        const rawValue = input.value
        const selectionStart = input.selectionStart ?? rawValue.length

        const digitsBeforeCaret = rawValue
            .slice(0, selectionStart)
            .replace(/[^\d.-]/g, '').length

        const clean = sanitize(rawValue)
        const formatted = formatNumber(clean)

        let pos = 0
        let seen = 0
        while (pos < formatted.length && seen < digitsBeforeCaret) {
            if (/[\d.-]/.test(formatted[pos])) seen++
            pos++
        }
        caretRef.current = pos

        setDisplayValue(formatted)

        input.value = clean
        onChange?.(e)
    }

    return (
        <Input
            type='text'
            inputMode='decimal'
            ref={(node) => {
                inputRef.current = node
            }}
            value={displayValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
        />
    )
}

export { NumericInput }
