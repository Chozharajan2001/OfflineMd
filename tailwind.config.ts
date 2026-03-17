import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map CSS variables to Tailwind utilities
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        
        // UI States
        'ui-hover': 'var(--ui-hover-bg)',
        'ui-active': 'var(--ui-active-bg)',
        'ui-disabled': 'var(--ui-disabled-bg)',
        'ui-disabled-text': 'var(--ui-disabled-text)',
        
        // Transparency
        overlay: 'var(--overlay-bg)',
        glass: 'var(--glass-bg)',
        
        // Borders
        'border-light': 'var(--border-light)',
        'border-focus': 'var(--border-focus)',
        
        // Header
        'header-bg': 'var(--header-bg)',
        'header-fg': 'var(--header-fg)',
        'header-border': 'var(--header-border)',
        'header-hover': 'var(--header-hover)',
        
        // Sidebar
        'sidebar-bg': 'var(--sidebar-bg)',
        'sidebar-fg': 'var(--sidebar-fg)',
        'sidebar-border': 'var(--sidebar-border)',
        'sidebar-muted': 'var(--sidebar-muted)',
        'sidebar-icon': 'var(--sidebar-icon)',
        'sidebar-input-bg': 'var(--sidebar-input-bg)',
        'sidebar-hover': 'var(--sidebar-hover)',
        
        // Dropdown/Dialog
        'dropdown-bg': 'var(--dropdown-bg)',
        'dropdown-fg': 'var(--dropdown-fg)',
        'dropdown-border': 'var(--dropdown-border)',
        'dropdown-hover': 'var(--dropdown-hover)',
        
        'dialog-bg': 'var(--dialog-bg)',
        'dialog-fg': 'var(--dialog-fg)',
        'dialog-border': 'var(--dialog-border)',
        
        // Inputs
        'input-bg': 'var(--input-bg)',
        'input-fg': 'var(--input-fg)',
        'input-border': 'var(--input-border)',
        
        // Buttons
        'button-primary-bg': 'var(--button-primary-bg)',
        'button-primary-hover': 'var(--button-primary-hover)',
        'button-secondary-bg': 'var(--button-secondary-bg)',
        'button-secondary-hover': 'var(--button-secondary-hover)',
        'button-fg': 'var(--button-fg)',
        
        // Editor
        'editor-bg': 'var(--editor-bg)',
        'preview-bg': 'var(--preview-bg)',
      },
      backgroundColor: {
        glass: 'var(--glass-bg)',
      },
      borderColor: {
        light: 'var(--border-light)',
        focus: 'var(--border-focus)',
      },
    },
  },
  plugins: [],
}
export default config
