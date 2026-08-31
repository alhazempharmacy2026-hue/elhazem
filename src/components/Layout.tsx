import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Table2, RefreshCcw, Package, Handshake, AlertTriangle } from 'lucide-react'
import { useAppData } from '../lib/storage'

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/data', label: 'البيانات اليومية', icon: Table2, end: false },
  { to: '/inventory', label: 'المخزون والأصناف', icon: Package, end: false },
  { to: '/suppliers', label: 'الموردين والديون', icon: Handshake, end: false },
  { to: '/emergency-purchases', label: 'الشراء الاضطراري', icon: AlertTriangle, end: false },
]

export default function Layout() {
  const { resetDemoData } = useAppData()

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-[var(--border)] bg-white p-5">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-white text-lg font-bold">
            ص
          </div>
          <div>
            <div className="text-base font-bold text-[var(--text)]">صيدلية الحازم</div>
            <div className="text-xs text-[var(--text-muted)]">نظام إدارة وتحليل البيانات</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
          <button
            onClick={() => {
              if (confirm('هل تريد إعادة تعيين البيانات التجريبية؟ سيتم فقد كل التعديلات الحالية.')) resetDemoData()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-gray-50"
          >
            <RefreshCcw size={14} />
            إعادة تعيين البيانات التجريبية
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
        </header>

        <nav className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] bg-white px-3 py-2 md:hidden">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
