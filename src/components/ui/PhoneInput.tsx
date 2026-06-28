"use client";
import dynamic from "next/dynamic";
import { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

const ReactPhoneInput = dynamic(() => import("react-phone-number-input"), {
  ssr: false,
  loading: () => (
    <input
      type="tel"
      placeholder="..."
      disabled
      className="flex h-11 w-full rounded-lg border border-border bg-elevated px-4 py-1 text-sm text-text"
    />
  ),
});

interface PhoneInputProps {
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: boolean;
}

export function PhoneInput({ value, onChange, placeholder, disabled, required, className, error }: PhoneInputProps) {
  return (
    <ReactPhoneInput
      international
      defaultCountry="RU"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      numberInputProps={{
        required,
        className: cn(
          "flex-1 min-w-0 bg-transparent outline-none text-sm text-text placeholder:text-text-dim",
          className
        ),
      }}
      className={cn(
        "flex h-11 w-full rounded-lg border bg-elevated px-4 py-1 text-sm transition-colors focus-within:ring-2 gap-2",
        "[&_.PhoneInputCountry]:relative [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:shrink-0",
        "[&_.PhoneInputCountrySelect]:!absolute [&_.PhoneInputCountrySelect]:!inset-0 [&_.PhoneInputCountrySelect]:!opacity-0 [&_.PhoneInputCountrySelect]:!cursor-pointer [&_.PhoneInputCountrySelect]:!z-[1]",
        "[&_.PhoneInputCountrySelectArrow]:opacity-50 [&_.PhoneInputCountrySelectArrow]:ml-1",
        "[&_input::placeholder]:!text-text-dim [&_input::placeholder]:!opacity-100",
        error
          ? "border-error focus-within:ring-error/20"
          : "border-border focus-within:border-primary focus-within:ring-primary/20"
      )}
    />
  );
}
