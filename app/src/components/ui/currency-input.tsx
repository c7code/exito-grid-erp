import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    prefix?: string;
}

/**
 * CurrencyInput — right-to-left currency input (like a POS terminal).
 * Typing 4500 → "45,00", typing 100 → "1,00"
 * Stores raw cents internally, displays formatted value.
 */
export function CurrencyInput({
    value,
    onChange,
    className,
    placeholder = '0,00',
    disabled,
    prefix = 'R$',
}: CurrencyInputProps) {
    // Convert initial value to cents for display
    const formatFromValue = (val: string | number): string => {
        const num = typeof val === 'string' ? parseFloat(val) || 0 : val;
        if (num === 0) return '';
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const [displayValue, setDisplayValue] = useState(() => formatFromValue(value));

    // Update display when value prop changes externally
    React.useEffect(() => {
        const formatted = formatFromValue(value);
        setDisplayValue(formatted);
    }, [value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, ''); // Only digits
        if (raw === '' || raw === '0') {
            setDisplayValue('');
            onChange('0');
            return;
        }

        const cents = parseInt(raw, 10);
        const reais = cents / 100;

        const formatted = reais.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        setDisplayValue(formatted);
        onChange(String(reais));
    }, [onChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        // Select all on focus for easy replacement
        setTimeout(() => e.target.select(), 0);
    }, []);

    return (
        <div className="relative">
            {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    {prefix}
                </span>
            )}
            <Input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(prefix ? 'pl-10' : '', className)}
            />
        </div>
    );
}

interface NumericInputProps {
    value: string | number;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    min?: string;
    max?: string;
    step?: string;
    prefix?: string;
    suffix?: string;
    integer?: boolean;
}

/**
 * NumericInput — clears leading zeros on focus.
 * For integers: just type the number.
 * For decimals: allows comma or dot as separator.
 */
export function NumericInput({
    value,
    onChange,
    className,
    placeholder = '0',
    disabled,
    min,
    max,
    step,
    prefix,
    suffix,
    integer,
}: NumericInputProps) {
    const displayValue = String(value);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        // If value is 0, clear it so user can type fresh
        if (displayValue === '0' || displayValue === '0.00' || displayValue === '0,00') {
            onChange('');
        }
        setTimeout(() => e.target.select(), 0);
    }, [displayValue, onChange]);

    const handleBlur = useCallback(() => {
        // Restore 0 if empty
        const current = String(value);
        if (current === '' || current === undefined || current === null) {
            onChange('0');
        }
    }, [value, onChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        // Allow comma as decimal separator (convert to dot for storage)
        val = val.replace(',', '.');

        // Remove leading zeros except "0." or empty
        if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
            val = val.replace(/^0+/, '') || '0';
        }

        if (integer) {
            val = val.replace(/[^0-9-]/g, '');
        }

        onChange(val);
    }, [integer, onChange]);

    return (
        <div className="relative">
            {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    {prefix}
                </span>
            )}
            <Input
                type="text"
                inputMode={integer ? 'numeric' : 'decimal'}
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(prefix ? 'pl-10' : '', suffix ? 'pr-10' : '', className)}
                min={min}
                max={max}
                step={step}
            />
            {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    {suffix}
                </span>
            )}
        </div>
    );
}
