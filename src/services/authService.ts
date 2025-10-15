// ============================================================================
// SERVICIO DE AUTENTICACIÓN
// ============================================================================
// Servicio para manejar autenticación con Supabase
// ============================================================================

import { supabase } from '../lib/supabase'
import type { User, LoginCredentials } from '../types'

export const authService = {
    // Login solo para admin (con password)
    async login(credentials: LoginCredentials): Promise<User> {
        try {
            console.log('Attempting login for:', credentials.email)

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            })

            if (authError) {
                console.error('Auth error:', authError)
                throw new Error(authError.message)
            }

            if (!authData.user) {
                throw new Error('No se pudo autenticar el usuario')
            }

            console.log('Auth successful, user ID:', authData.user.id)
            console.log('User email:', authData.user.email)
            console.log('User metadata:', authData.user.user_metadata)

            // Intentar obtener perfil existente
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single()

            // Si el usuario no existe en la tabla users, mostrar error claro
            if (userError && userError.code === 'PGRST116') {
                console.log('User profile not found in database')
                throw new Error(
                    'Tu usuario no tiene un perfil creado en la base de datos. ' +
                    'Por favor, contacta al administrador del sistema para que configure tu cuenta.'
                )
            } else if (userError) {
                console.error('Profile fetch error:', userError)
                throw new Error(`Error al obtener perfil: ${userError.message}`)
            }

            if (!userData) {
                throw new Error('No se pudo obtener o crear el perfil de usuario')
            }

            console.log('User profile found:', userData)

            // Verificar que el rol es válido y es admin o super_admin
            if (!userData.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
                throw new Error('Solo los administradores pueden iniciar sesión con contraseña. Tu rol es: ' + (userData.role || 'sin asignar'))
            }

            // Hacer casting seguro al tipo User
            return userData as User
        } catch (error) {
            console.error('Login process error:', error)
            throw error
        }
    },



    // Logout
    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    // Obtener usuario actual
    async getCurrentUser(): Promise<User | null> {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) return null

        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

        if (error) return null

        return userData as User
    },

    // Verificar sesión
    async checkAuth(): Promise<User | null> {
        return await this.getCurrentUser()
    },

    // Actualizar perfil de usuario
    async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error
        return data as User
    },

    // Obtener todos los usuarios (solo admin)
    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as User[]
    },


}