'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'

type NumericInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
    value?: number | string
}

function NumericInput({
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
}: NumericInputProps) {
    const toDisplay = (v: number | string | undefined) =>
        v !== undefined && v !== '' && v !== null ? String(v) : '0'

    const [displayValue, setDisplayValue] = React.useState<string>(
        toDisplay(value)
    )
    const focused = React.useRef(false)

    React.useEffect(() => {
        if (!focused.current) {
            setDisplayValue(toDisplay(value))
        }
    }, [value])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = true
        if (Number(displayValue) === 0) {
            setDisplayValue('')
        }
        onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = false
        if (displayValue === '') {
            setDisplayValue('0')
        }
        onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value)
        onChange?.(e)
    }

    return (
        <Input
            type='number'
            inputMode='decimal'
            value={displayValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
        />
    )
}

export { NumericInput }
