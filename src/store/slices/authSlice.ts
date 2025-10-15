// ============================================================================
// SLICE DE AUTENTICACIÓN
// ============================================================================
// Estado y acciones para manejo de autenticación con Supabase
// ============================================================================

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { User, Session } from '@supabase/supabase-js'
import type { User as AppUser, LoginCredentials } from '../../types'
import { authService } from '../../services/authService'
import { supabase } from '../../lib/supabase'

export interface AuthState {
    // Estado de autenticación
    user: User | null
    session: Session | null
    profile: AppUser | null

    // Estados de carga
    isLoading: boolean
    isInitialized: boolean
    isProcessing: boolean // Para evitar múltiples verificaciones concurrentes

    // Errores
    error: string | null
}

// ============================================================================
// ASYNC THUNKS
// ============================================================================

// Login async thunk
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            const userProfile = await authService.login(credentials)

            // Obtener la sesión actual de Supabase
            const { data: { session } } = await supabase.auth.getSession()

            return {
                profile: userProfile,
                user: session?.user || null,
                session: session
            }
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Error de login')
        }
    }
)

// Check auth async thunk
export const checkAuth = createAsyncThunk(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            // Evitar verificaciones concurrentes


            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                return {
                    profile: null,
                    user: null,
                    session: null
                }
            }

            const userProfile = await authService.checkAuth()

            return {
                profile: userProfile,
                user: session.user,
                session: session
            }
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Error al verificar autenticación')
        }
    }
)

// Logout async thunk
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout()
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Error al cerrar sesión')
        }
    }
)

const initialState: AuthState = {
    user: null,
    session: null,
    profile: null,
    isLoading: false,
    isInitialized: false, // Inicializar como false para cargar sesión persistente
    isProcessing: false,
    error: null
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Inicializar sesión
        setSession: (state, action: PayloadAction<{ user: User | null; session: Session | null }>) => {
            const { user, session } = action.payload
            state.user = user
            state.session = session
            state.isInitialized = true
            state.error = null
        },

        // Establecer perfil de usuario
        setProfile: (state, action: PayloadAction<AppUser | null>) => {
            state.profile = action.payload
        },

        // Estado de carga
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },

        // Establecer error
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
            state.isLoading = false
        },

        // Limpiar sesión (logout)
        clearSession: (state) => {
            state.user = null
            state.session = null
            state.profile = null
            state.error = null
            state.isLoading = false
        },

        // Marcar inicialización como completada
        setInitialized: (state, action: PayloadAction<boolean>) => {
            state.isInitialized = action.payload
            if (action.payload) {
                state.isLoading = false
            }
        },

        // Establecer estado de procesamiento
        setProcessing: (state, action: PayloadAction<boolean>) => {
            state.isProcessing = action.payload
        }
    },
    extraReducers: (builder) => {
        // Login cases
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false
                state.profile = action.payload.profile
                state.user = action.payload.user
                state.session = action.payload.session
                state.isInitialized = true
                state.error = null
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
                state.user = null
                state.session = null
                state.profile = null
            })
            // Check auth cases
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true
                state.isProcessing = true
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false
                state.isProcessing = false
                state.profile = action.payload.profile
                state.user = action.payload.user
                state.session = action.payload.session
                state.isInitialized = true
            })
            .addCase(checkAuth.rejected, (state, action) => {
                state.isLoading = false
                state.isProcessing = false
                state.error = action.payload as string
                // No limpiar user/session/profile si fue solo una verificación rechazada por concurrencia
                if (action.payload !== 'Ya se está procesando una verificación') {
                    state.user = null
                    state.session = null
                    state.profile = null
                }
                state.isInitialized = true
            })
            // Logout cases
            .addCase(logout.pending, (state) => {
                state.isLoading = true
            })
            .addCase(logout.fulfilled, (state) => {
                state.isLoading = false
                state.user = null
                state.session = null
                state.profile = null
                state.error = null
            })
            .addCase(logout.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
    }
})

// Acciones exportadas
export const {
    setSession,
    setProfile,
    setLoading,
    setError,
    clearSession,
    setInitialized,
    setProcessing
} = authSlice.actions

// Selectores
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectSession = (state: { auth: AuthState }) => state.auth.session
export const selectProfile = (state: { auth: AuthState }) => state.auth.profile
export const selectIsAuthenticated = (state: { auth: AuthState }) => !!state.auth.session
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectIsProcessing = (state: { auth: AuthState }) => state.auth.isProcessing
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error

// Exportar el slice
export default authSlice.reducer