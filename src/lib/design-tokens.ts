/**
 * OCAIS Unified Design System Tokens
 * Adheres strictly to WCAG AA/AAA, minimum 16px body, 48px touch targets,
 * and a calming medical color palette.
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6', // Base teal
      600: '#0d9488',
      700: '#0f766e', // Primary brand
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    state: {
      BOOKED: {
        bg: '#eff6ff',
        text: '#1e40af',
        border: '#bfdbfe',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Booked',
      },
      CHECKED_IN: {
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        label: 'Checked In',
      },
      IN_CONSULT: {
        bg: '#ecfdf5',
        text: '#065f46',
        border: '#a7f3d0',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 animate-pulse',
        label: 'In Consultation',
      },
      COMPLETED: {
        bg: '#f1f5f9',
        text: '#334155',
        border: '#cbd5e1',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        label: 'Completed',
      },
      CANCELLED: {
        bg: '#fef2f2',
        text: '#991b1b',
        border: '#fecaca',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        label: 'Cancelled',
      },
      NO_SHOW: {
        bg: '#fdf4ff',
        text: '#86198f',
        border: '#f5d0fe',
        badge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
        label: 'No Show',
      },
      SKIPPED: {
        bg: '#fff7ed',
        text: '#9a3412',
        border: '#fed7aa',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        label: 'Skipped',
      },
    },
  },
  typography: {
    // Ensuring body copy never falls below 16px (1rem) for elderly clarity
    fontSizes: {
      bodySm: '1rem', // 16px minimum
      bodyBase: '1.125rem', // 18px
      titleLg: '1.25rem', // 20px
      titleXl: '1.5rem', // 24px
      displayToken: '2.5rem', // 40px
      displayHero: '3.5rem', // 56px
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  touchTarget: {
    minSize: '48px', // Minimum interactive touch target
    padding: '0.75rem 1.25rem',
  },
  radii: {
    button: '0.75rem',
    card: '1rem',
    badge: '9999px',
  },
} as const;

export type AppointmentStateKey = keyof typeof DESIGN_TOKENS.colors.state;

