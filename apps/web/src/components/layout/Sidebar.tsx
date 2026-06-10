'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Bot,
  Users,
  GraduationCap,
  UserCircle,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  BookMarked,
  Bell,
  MessageSquare,
  Award,
  Trophy,
  Puzzle,
  ShoppingBag,
  Building2,
  University,
  Sparkles,
  ClipboardList,
  FileText,
  Palette,
  Key,
  FileQuestion,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React from 'react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';


type NavItemKey = {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
};

type NavSectionDef = {
  titleKey: string;
  items: NavItemKey[];
};

const navSections: NavSectionDef[] = [
  {
    titleKey: 'overview',
    items: [
      { labelKey: 'dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    titleKey: 'learning',
    items: [
      { labelKey: 'myLearning', href: '/my-learning', icon: BookMarked, roles: ['STUDENT'] },
      { labelKey: 'courses', href: '/courses', icon: BookOpen },
      { labelKey: 'assignments', href: '/assignments', icon: ClipboardList },
      { labelKey: 'liveClasses', href: '/live', icon: Video },
      { labelKey: 'aiTutor', href: '/ai-tutor', icon: Bot, badge: 'AI' },
      { labelKey: 'aiTools', href: '/ai-tools', icon: Zap, badge: 'AI' },
      { labelKey: 'aiAgents', href: '/ai-agents', icon: Sparkles, badge: 'NEW' },
      { labelKey: 'exams', href: '/exams', icon: FileQuestion },
      { labelKey: 'flashcards', href: '/flashcards', icon: Layers },
      { labelKey: 'certificates', href: '/certificates', icon: Award },
    ],
  },
  {
    titleKey: 'community',
    items: [
      { labelKey: 'messages', href: '/messages', icon: MessageSquare },
      { labelKey: 'notifications', href: '/notifications', icon: Bell },
      { labelKey: 'gamification', href: '/gamification', icon: Trophy },
      { labelKey: 'marketplace', href: '/marketplace', icon: ShoppingBag },
    ],
  },
  {
    titleKey: 'management',
    items: [
      { labelKey: 'students', href: '/students', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      { labelKey: 'teachers', href: '/teachers', icon: UserCircle, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
      { labelKey: 'parents', href: '/parents', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      { labelKey: 'schoolErp', href: '/school-erp', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
      { labelKey: 'universityErp', href: '/university-erp', icon: University, roles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN'] },
      { labelKey: 'plugins', href: '/plugins', icon: Puzzle, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'UNIVERSITY_ADMIN'] },
    ],
  },
  {
    titleKey: 'admin',
    items: [
      { labelKey: 'superAdmin', href: '/super-admin', icon: Shield, roles: ['SUPER_ADMIN'], badge: 'SA' },
      { labelKey: 'analytics', href: '/analytics', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      { labelKey: 'auditLogs', href: '/audit-logs', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
      { labelKey: 'whiteLabel', href: '/white-label', icon: Palette, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'UNIVERSITY_ADMIN'] },
      { labelKey: 'apiKeys', href: '/api-keys', icon: Key, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { labelKey: 'billing', href: '/billing', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'UNIVERSITY_ADMIN'] },
      { labelKey: 'settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'UNIVERSITY_ADMIN'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen } =
    useUIStore();
  const user = useAuthStore((s) => s.user);
  const tSections = useTranslations('nav.sections');
  const tItems = useTranslations('nav.items');

  const isActive = (href: string) => {
    if (href === '/dashboard') {return pathname === '/dashboard';}
    return pathname.startsWith(href);
  };

  const canSeeItem = (item: NavItemKey) => {
    if (!item.roles) {return true;}
    if (!user) {return false;}
    return item.roles.includes(user.role);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-border shrink-0',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!sidebarCollapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              <BookMarked className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-none">
                EduAI
              </span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">
                Ultimate
              </span>
            </div>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link href="/dashboard">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <BookMarked className="h-4 w-4 text-white" />
            </div>
          </Link>
        )}
        <button
          onClick={toggleSidebarCollapsed}
          className={cn(
            'p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors hidden lg:flex',
            sidebarCollapsed && 'hidden'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Collapsed expand button */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebarCollapsed}
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm hidden lg:flex"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(canSeeItem);
          if (visibleItems.length === 0) {return null;}

          return (
            <div key={section.titleKey} className="mb-6">
              {!sidebarCollapsed && (
                <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {tSections(section.titleKey as any)}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  const label = tItems(item.labelKey as any);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors relative group',
                          sidebarCollapsed
                            ? 'justify-center'
                            : 'justify-start gap-3',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        title={sidebarCollapsed ? label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <AnimatePresence>
                          {!sidebarCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden whitespace-nowrap"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {!sidebarCollapsed && item.badge && (
                          <span className="ml-auto text-[10px] font-semibold bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {sidebarCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-popover-foreground text-xs rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                            {label}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Tenant info / upgrade section */}
      {!sidebarCollapsed && user && (
        <div className="p-3 border-t border-border">
          <div className="rounded-md bg-gradient-to-br from-primary/10 to-secondary/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {user.tenantName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by EduAI Ultimate
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
