"use client";

import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", label: "Home", icon: Squares2X2Icon },
  { href: "/task", label: "Task", icon: ClipboardDocumentListIcon },
  { href: "/leave", label: "Leave", icon: CalendarDaysIcon },
];

export default function Navbar() {
  const pathname = usePathname();
  const isProfileActive = pathname === "/profile";

  return (
    <header className="sticky top-0 z-30 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
      <div className="h-16 flex items-center px-8">
        {/* ซ้าย: โลโก้ */}
        <div className="flex items-center gap-3">
          <Squares2X2Icon className="h-7 w-7 text-blue-600" />
          <span className="text-lg font-semibold text-slate-700">WorkFlow</span>
        </div>

        {/* ขวา: เมนู + โปรไฟล์ (ชิดขวาสุด) */}
        <div className="flex-1 flex items-center justify-end gap-8">
          {/* เมนูหลัก */}
          <nav className="flex items-center gap-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-2 group"
                >
                  <Icon
                    className={`h-5 w-5 transition ${
                      isActive
                        ? "text-blue-600"
                        : "text-slate-500 group-hover:text-blue-600"
                    }`}
                  />

                  <span
                    className={`text-sm transition ${
                      isActive
                        ? "text-blue-600 font-medium"
                        : "text-slate-600 group-hover:text-blue-600"
                    }`}
                  >
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="absolute -bottom-2 left-0 right-0 mx-auto h-[2px] w-full bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ปุ่มโปรไฟล์ */}
          <Link
            href="/profile"
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition
              ${
                isProfileActive
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
              }`}
          >
            <UserCircleIcon className="h-5 w-5 text-slate-500" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
