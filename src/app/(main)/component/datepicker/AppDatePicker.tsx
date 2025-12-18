"use client";

import DatePicker from "react-datepicker";
import { th } from "date-fns/locale";
import styles from "./AppDatePicker.module.css";

type Props = {
  label?: string;
  value?: Date | null;
  placeholder?: string;
  selected?: Date | null;
  placeholderText?: string;
  onChange: (d: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
};

export default function AppDatePicker({
  label,
  value,
  selected,
  onChange,
  minDate,
  maxDate,
  placeholder = "วัน/เดือน/ปี",
  placeholderText,
  disabled,
  className = "",
}: Props) {
  const picked = selected ?? value ?? null;

  const ph = placeholderText ?? placeholder ?? "วัน/เดือน/ปี";

  const inputClass =
    [
      "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm",
      "bg-white text-slate-900 placeholder:text-slate-400",
      "outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
      disabled ? "opacity-60 cursor-not-allowed" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="space-y-1">
      {label ? (
        <label className="text-xs font-medium text-slate-700">{label}</label>
      ) : null}

      <DatePicker
        selected={picked}
        onChange={(d) => onChange(d)}
        dateFormat="dd/MM/yyyy"
        locale={th}
        placeholderText={ph}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        wrapperClassName="w-full"
        className={inputClass}
        calendarClassName={styles.calendar}
        popperClassName={styles.popper}
        popperPlacement="bottom-start"
      />
    </div>
  );
}
