import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useCart } from '../lib/CartContext'
import { useAuth } from '../lib/AuthContext'

export default function Layout() {
  const { itemCount } = useCart()
  const { isAuthenticated, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    if (search.trim()) navigate(`/?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-white">
              ص
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold text-[var(--text)]">صيدلية الحازم</div>
              <div className="text-xs text-[var(--text-muted)]">اطلب أدويتك أونلاين</div>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="input pr-9"
              placeholder="دور على دواء أو منتج..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>

          <nav className="flex shrink-0 items-center gap-1">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/orders"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-gray-100"
                >
                  طلباتي
                </NavLink>
                <NavLink
                  to="/account"
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-gray-100"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">{profile?.fullName ?? 'حسابي'}</span>
                </NavLink>
                <button
                  onClick={() => signOut()}
                  title="تسجيل خروج"
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-gray-100"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-gray-100"
              >
                تسجيل الدخول
              </NavLink>
            )}

            <Link
              to="/cart"
              className="relative flex items-center gap-1 rounded-lg bg-[var(--brand)]/10 px-3 py-2 text-sm font-medium text-[var(--brand-dark)] hover:bg-[var(--brand)]/20"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">العربة</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--border)] bg-white py-4 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} صيدلية الحازم
      </footer>
    </div>
  )
}
