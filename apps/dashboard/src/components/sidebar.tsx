"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/overview", label: "Overview", icon: "◈" },
  { href: "/tools", label: "Tools", icon: "⚙" },
  { href: "/audit", label: "Audit Log", icon: "☰" },
  { href: "/settlements", label: "Settlements", icon: "⟐" },
  { href: "/analytics", label: "Analytics", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⊛" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-violet-400">Flume</h1>
        <p className="text-xs text-zinc-500 mt-1">Payment Infrastructure</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-violet-500/10 text-violet-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">Relay: relay.flume.xyz</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-zinc-400">Connected</span>
        </div>
      </div>
    </aside>
  );
}
