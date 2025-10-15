// ============================================================================
// CONFIGURACIÓN DE TEMA MATERIAL-UI
// ============================================================================
// Sistema de temas personalizado con soporte para modo claro/oscuro
// ============================================================================

import { createTheme, type ThemeOptions } from '@mui/material/styles'
import { type PaletteMode } from '@mui/material'

// ============================================================================
// CONFIGURACIÓN DE COLORES
// ============================================================================

// Colores primarios del sistema
const primaryColors = {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
}

// Colores secundarios (complementarios)
const secondaryColors = {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
}

// Colores de éxito, advertencia, error
const statusColors = {
    success: {
        light: '#81c784',
        main: '#4caf50',
        dark: '#388e3c',
    },
    warning: {
        light: '#ffb74d',
        main: '#ff9800',
        dark: '#f57c00',
    },
    error: {
        light: '#e57373',
        main: '#f44336',
        dark: '#d32f2f',
    },
    info: {
        light: '#64b5f6',
        main: '#2196f3',
        dark: '#1976d2',
    },
}

// ============================================================================
// CONFIGURACIÓN DE TIPOGRAFÍA
// ============================================================================

const typography = {
    fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
    ].join(','),

    h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
    },

    h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
    },

    h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
        lineHeight: 1.3,
    },

    h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4,
    },

    h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.4,
    },

    h6: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.5,
    },

    body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
    },

    body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
    },

    button: {
        fontWeight: 500,
        textTransform: 'none' as const, // Sin mayúsculas automáticas
    },
}

// ============================================================================
// CONFIGURACIÓN DE COMPONENTES
// ============================================================================

const components = {
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                textTransform: 'none' as const,
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                },
            },
        },
    },

    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 12,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
            },
        },
    },

    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 8,
            },
        },
    },

    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                },
            },
        },
    },

    MuiChip: {
        styleOverrides: {
            root: {
                borderRadius: 16,
                fontWeight: 500,
            },
        },
    },

    MuiAppBar: {
        styleOverrides: {
            root: {
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
            },
        },
    },

    MuiDrawer: {
        styleOverrides: {
            paper: {
                borderRadius: 0,
                border: 'none',
            },
        },
    },
}

// ============================================================================
// CREADOR DE TEMA
// ============================================================================

export const createAppTheme = (mode: PaletteMode = 'light') => {
    const isLight = mode === 'light'

    const themeOptions: ThemeOptions = {
        palette: {
            mode,
            primary: {
                ...primaryColors,
                main: primaryColors[600],
            },
            secondary: {
                ...secondaryColors,
                main: secondaryColors[600],
            },
            ...statusColors,
            background: {
                default: isLight ? '#fafafa' : '#121212',
                paper: isLight ? '#ffffff' : '#1e1e1e',
            },
            text: {
                primary: isLight ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
                secondary: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            },
            divider: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
            grey: {
                50: '#fafafa',
                100: '#f5f5f5',
                200: '#eeeeee',
                300: '#e0e0e0',
                400: '#bdbdbd',
                500: '#9e9e9e',
                600: '#757575',
                700: '#616161',
                800: '#424242',
                900: '#212121',
            },
        },
        typography,
        components,
        shape: {
            borderRadius: 8,
        },
        spacing: 8,
    }

    return createTheme(themeOptions)
}

// ============================================================================
// TEMAS PREDEFINIDOS
// ============================================================================

export const lightTheme = createAppTheme('light')
export const darkTheme = createAppTheme('dark')

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export type AppTheme = ReturnType<typeof createAppTheme>
export { type PaletteMode as ThemeMode }