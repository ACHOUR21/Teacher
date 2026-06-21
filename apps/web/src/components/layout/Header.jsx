'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Menu, X, Settings, LogOut, User, ChevronDown, Check, BookMarked, Moon, Sun, } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import React, { useState } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatRelativeDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
export function Header() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { sidebarOpen, setSidebarOpen, notifications, unreadCount, markAllNotificationsRead, markNotificationRead, } = useUIStore();
    const { signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchOpen(false);
            setSearchQuery('');
        }
    };
    const handleNotifClick = (id, href) => {
        markNotificationRead(id);
        setNotifOpen(false);
        if (href) {
            router.push(href);
        }
    };
    return (<header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4 sticky top-0 z-40">
      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden" aria-label="Toggle menu">
        {sidebarOpen ? (<X className="h-5 w-5"/>) : (<Menu className="h-5 w-5"/>)}
      </button>

      {/* Mobile logo */}
      <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <BookMarked className="h-3.5 w-3.5 text-white"/>
        </div>
        <span className="font-bold text-sm">EduAI</span>
      </Link>

      {/* Search bar */}
      <div className="flex-1 max-w-xl hidden sm:block">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
          <input type="search" placeholder="Search… (⌘K)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"/>
          {searchQuery && (<button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5"/>
            </button>)}
        </form>
      </div>

      {/* Mobile search toggle */}
      <button onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-auto" aria-label="Search">
        <Search className="h-5 w-5"/>
      </button>

      {/* Tenant name */}
      {user && (<div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground border-l border-border pl-4">
          <span className="font-medium text-foreground truncate max-w-32">
            {user.tenantName}
          </span>
        </div>)}

      <div className="ml-auto sm:ml-0 flex items-center gap-1">
        {/* Dark mode toggle */}
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label="Toggle dark mode">
          {theme === 'dark' ? (<Sun className="h-5 w-5"/>) : (<Moon className="h-5 w-5"/>)}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => {
            setNotifOpen(!notifOpen);
            setUserMenuOpen(false);
        }} className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label="Notifications">
            <Bell className="h-5 w-5"/>
            {unreadCount > 0 && (<span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>)}
          </button>

          <AnimatePresence>
            {notifOpen && (<motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (<button onClick={markAllNotificationsRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Check className="h-3 w-3"/>
                      Mark all read
                    </button>)}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (<div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30"/>
                      No notifications yet
                    </div>) : (notifications.map((notif) => (<button key={notif.id} onClick={() => handleNotifClick(notif.id, notif.href)} className={cn('w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-0', !notif.read && 'bg-primary/5')}>
                        <div className="flex items-start gap-3">
                          {!notif.read && (<div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"/>)}
                          <div className={cn(!notif.read ? '' : 'ml-5')}>
                            <p className="text-xs font-semibold text-foreground">
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatRelativeDate(notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>)))}
                </div>
                <div className="px-4 py-2 border-t border-border">
                  <Link href="/dashboard/notifications" className="text-xs text-primary hover:underline" onClick={() => setNotifOpen(false)}>
                    View all notifications
                  </Link>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => {
            setUserMenuOpen(!userMenuOpen);
            setNotifOpen(false);
        }} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors" aria-label="User menu">
            {user && (<Avatar src={user.avatar} name={`${user.firstName} ${user.lastName}`} size="sm"/>)}
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block"/>
          </button>

          <AnimatePresence>
            {userMenuOpen && (<motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                {user && (<div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>)}
                <div className="py-1">
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                    <User className="h-4 w-4"/>
                    Profile
                  </Link>
                  <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                    <Settings className="h-4 w-4"/>
                    Settings
                  </Link>
                </div>
                <div className="py-1 border-t border-border">
                  <button onClick={() => {
                setUserMenuOpen(false);
                signOut();
            }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                    <LogOut className="h-4 w-4"/>
                    Sign out
                  </button>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {searchOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background z-50 flex items-center px-4 sm:hidden">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Search className="h-5 w-5 text-muted-foreground shrink-0 mt-2.5"/>
              <input autoFocus type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 h-10 text-sm bg-transparent border-b border-input focus:outline-none focus:border-primary"/>
            </form>
            <button onClick={() => setSearchOpen(false)} className="p-2 text-muted-foreground">
              <X className="h-5 w-5"/>
            </button>
          </motion.div>)}
      </AnimatePresence>
    </header>);
}
