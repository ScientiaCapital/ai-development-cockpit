declare module 'next-themes' {
  export interface ThemeProviderProps {
    /** List of all available theme names */
    themes?: string[]
    /** Forced theme name for the current page */
    forcedTheme?: string
    /** Whether to switch between dark and light themes based on prefers-color-scheme */
    enableSystem?: boolean
    /** Disable all CSS transitions when switching themes */
    disableTransitionOnChange?: boolean
    /** Whether to indicate to browsers which color scheme is used (dark or light) for built-in UI like inputs and buttons */
    enableColorScheme?: boolean
    /** Key used to store theme setting in localStorage */
    storageKey?: string
    /** Default theme name (for v0.0.12 and lower the default was light) */
    defaultTheme?: string
    /** HTML attribute modified based on the active theme. Accepts `class` and `data-*` (meaning any data attribute, `data-mode`, `data-color`, etc.) */
    attribute?: string | 'class'
    /** The value used when setting the theme via the attribute. Object mapping the theme name to attribute value */
    value?: ValueObject
    /** Nonce string to pass to the inline script for CSP headers */
    nonce?: string
    children?: React.ReactNode
  }

  export interface ValueObject {
    [themeName: string]: string
  }

  export interface UseThemeProps {
    /** Active theme name */
    theme: string | undefined
    /** All available theme names */
    themes: string[]
    /** Forced theme name for the current page */
    forcedTheme?: string
    /** Update the theme */
    setTheme: (theme: string) => void
    /** Active theme name, for SSR. */
    resolvedTheme?: string
    /** If `enableSystem` is true and the active theme is "system", this returns whether the system preference resolved to "dark" or "light". Otherwise, identical to `theme` */
    systemTheme?: 'dark' | 'light'
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element
  export function useTheme(): UseThemeProps
}