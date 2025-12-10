"use client";

import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  UsersIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", label: "Home", icon: Squares2X2Icon },
  { href: "/projects", label: "Projects", icon: ClipboardDocumentListIcon },
  { href: "/teams", label: "Teams", icon: UsersIcon },
  { href: "/leave", label: "Leave", icon: CalendarDaysIcon },
  { href: "/profile", label: "Profile", icon: UserCircleIcon },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-8 h-16 flex items-center">
        {/* โลโก้ฝั่งซ้าย (ไม่ชิดขอบเพราะมี px-8 + max-w-7xl) */}
        <div className="flex items-center gap-3">
          <Squares2X2Icon className="h-7 w-7 text-blue-600" />
          <span className="text-lg font-semibold text-slate-700">
            WorkFlow
          </span>
        </div>

        {/* พื้นที่รวบเมนู: เริ่มจากกลาง ๆ แล้วไล่ไปทางขวา */}
        <div className="flex-1 flex justify-center">
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
        </div>
      </div>
    </header>
  );
}
