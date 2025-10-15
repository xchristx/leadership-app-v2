// ============================================================================
// HOOK DE AUTENTICACIÓN
// ============================================================================
// Hook personalizado para gestionar autenticación con Supabase
// ============================================================================

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
    login as loginAction,
    checkAuth as checkAuthAction,
    logout as logoutAction,
    selectAuth,
    selectIsAuthenticated
} from '../store/slices/authSlice'
import type { LoginCredentials } from '../types'

export function useAuth() {
    const dispatch = useAppDispatch()
    const auth = useAppSelector(selectAuth)
    const isAuthenticated = useAppSelector(selectIsAuthenticated)

    // Inicializar auth al cargar la aplicación
    useEffect(() => {
        if (!auth.isInitialized && !auth.isLoading) {
            console.log('Checking authentication state...')
            dispatch(checkAuthAction())
        }
    }, [auth.isInitialized, auth.isLoading, dispatch])



    // Login con Supabase
    const signIn = async (credentials: LoginCredentials) => {
        const result = await dispatch(loginAction(credentials))

        if (loginAction.fulfilled.match(result)) {
            return { success: true, data: result.payload }
        } else {
            const error = result.payload as string || 'Error durante el login'
            return { success: false, error }
        }
    }

    const signUp = async (_credentials: {
        email: string
        password: string
        firstName?: string
        lastName?: string
        organizationName?: string
    }) => {
        console.log(_credentials)
        // El registro se manejará por separado con magic links
        return { success: false, error: 'Registro no implementado. Usa magic links.' }
    }

    const signOut = async () => {
        const result = await dispatch(logoutAction())

        if (logoutAction.fulfilled.match(result)) {
            return { success: true }
        } else {
            const error = result.payload as string || 'Error durante el logout'
            return { success: false, error }
        }
    }

    // const resetPassword = async (_email: string) => {
    //     // TODO: Implementar reset password con Supabase
    //     return { success: false, error: 'Reset password no implementado aún' }
    // }

    // const updatePassword = async (_newPassword: string) => {
    //     // TODO: Implementar update password con Supabase
    //     return { success: false, error: 'Update password no implementado aún' }
    // }

    const refetchProfile = async () => {
        // Re-verificar el perfil actual
        dispatch(checkAuthAction())
    }

    return {
        // Estado
        user: auth.user,
        session: auth.session,
        profile: auth.profile,
        isLoading: auth.isLoading,
        error: auth.error,
        isAuthenticated,
        isInitialized: auth.isInitialized,

        // Acciones
        signIn,
        signUp,
        signOut,
        // resetPassword,
        // updatePassword,
        refetchProfile
    }
}