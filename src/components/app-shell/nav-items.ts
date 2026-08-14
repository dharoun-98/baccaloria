import {
  BookOpen,
  ClipboardCheck,
  House,
  Target,
  User,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  labelKey: 'home' | 'subjects' | 'tests' | 'exams' | 'profile'
  icon: LucideIcon
}

/**
 * Five items, in the order a student actually moves through them: where am I,
 * what do I learn, how do I practise, can I do the real thing, how am I doing.
 * Five is also the practical ceiling for a thumb-reachable tab bar.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/accueil', labelKey: 'home', icon: House },
  { href: '/matieres', labelKey: 'subjects', icon: BookOpen },
  { href: '/tests', labelKey: 'tests', icon: Target },
  { href: '/examens', labelKey: 'exams', icon: ClipboardCheck },
  { href: '/profil', labelKey: 'profile', icon: User },
]
