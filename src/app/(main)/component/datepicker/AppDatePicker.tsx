"use client";

import { useEffect } from "react";
import DatePicker from "react-datepicker";
import { th } from "date-fns/locale";
import styles from "./AppDatePicker.module.css";

type Props = {
  label?: string;
  value: Date | null;
  onChange: (d: Date | null) => void;

  minDate?: Date;
  placeholder?: string;
  disabled?: boolean;

  className?: string; // เผื่ออยากเติม class เพิ่ม
};

const PORTAL_ID = "datepicker-portal";

function ensurePortal() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PORTAL_ID)) return;
  const el = document.createElement("div");
  el.id = PORTAL_ID;
  document.body.appendChild(el);
}

export default function AppDatePicker({
  label,
  value,
  onChange,
  minDate,
  placeholder = "วัน/เดือน/ปี",
  disabled,
  className = "",
}: Props) {
  useEffect(() => {
    ensurePortal();
  }, []);

  const inputClass =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none " +
    "focus:border-blue-500 focus:ring-1 focus:ring-blue-500 " +
    (disabled ? "opacity-60 cursor-not-allowed " : "") +
    className;

  return (
    <div className="space-y-1">
      {label ? <label className="text-xs font-medium text-slate-700">{label}</label> : null}

      <DatePicker
        selected={value}
        onChange={(d) => onChange(d)}
        dateFormat="dd/MM/yyyy"         // ✅ วัน/เดือน/ปี
        locale={th}                     // ✅ ภาษาไทย (เดือน/วัน)
        placeholderText={placeholder}
        showMonthDropdown
        showYearDropdown                // ✅ เลือกปีได้
        dropdownMode="select"
        minDate={minDate}
        disabled={disabled}
        wrapperClassName="w-full"
        className={inputClass}
        calendarClassName="app-dp"
        popperClassName={styles.popper}
        popperPlacement="bottom-start"
        withPortal
        portalId={PORTAL_ID}
      />
    </div>
  );
}
