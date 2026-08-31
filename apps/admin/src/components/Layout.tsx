import { NavLink, Outlet } from 'react-router-dom'
import { ClipboardList, LogOut, Pill, Tags, Truck } from 'lucide-react'
import { roleLabels } from '@elhazem/shared'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/orders', label: 'الطلبات', icon: ClipboardList },
  { to: '/catalog', label: 'الأدوية', icon: Pill },
  { to: '/categories', label: 'الفئات', icon: Tags },
  { to: '/couriers', label: 'مناديب التوصيل', icon: Truck },
]

export default function Layout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-[var(--border)] bg-white p-5">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-white text-lg font-bold">
            ص
          </div>
          <div>
            <div className="text-base font-bold text-[var(--text)]">صيدلية الحازم</div>
            <div className="text-xs text-[var(--text-muted)]">لوحة تحكم الموظفين</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--brand)]/10 text-[var(--brand-dark)]'
                    : 'text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text)]'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          {profile && (
            <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2">
              <div className="truncate text-sm font-medium text-[var(--text)]">{profile.fullName ?? 'بدون اسم'}</div>
              <div className="text-xs text-[var(--text-muted)]">{roleLabels[profile.role]}</div>
            </div>
          )}
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-gray-50"
          >
            <LogOut size={14} />
            تسجيل خروج
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-white text-sm font-bold">
              ص
            </div>
            <span className="font-bold">صيدلية الحازم</span>
          </div>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)]"
          >
            <LogOut size={14} />
            خروج
          </button>
        </header>

        <nav className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] bg-white px-3 py-2 md:hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-[var(--brand)]/10 text-[var(--brand-dark)]' : 'text-[var(--text-muted)]'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
