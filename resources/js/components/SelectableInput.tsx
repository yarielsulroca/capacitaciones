import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';
import { cn } from '@/lib/utils';

interface Option {
    id: number | string;
    label: string;
}

interface SelectableInputProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export function SelectableInput({ value, onChange, options, placeholder, className }: SelectableInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const displayValue = options.find(o => o.id.toString() === value)?.label || value;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o =>
        o.label.toLowerCase().includes(displayValue.toLowerCase())
    );

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <Input
                value={displayValue}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className="w-full"
            />
            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.map((option) => (
                        <div
                            key={option.id}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                            onClick={() => {
                                onChange(option.id.toString());
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
