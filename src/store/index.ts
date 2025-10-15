// ============================================================================
// CONFIGURACIÓN DE REDUX STORE CON RTK QUERY
// ============================================================================
// Store principal con Redux Toolkit y RTK Query para caché y gestión de estado
// Incluye slices para autenticación, UI y evaluación pública
// ============================================================================

import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { authSlice } from './slices/authSlice'
import { uiSlice } from './slices/uiSlice'
import { evaluationSlice } from './slices/evaluationSlice'
import { supabaseApi } from './api/supabaseApi'

// Configuración del store principal
export const store = configureStore({
    reducer: {
        // API con RTK Query
        [supabaseApi.reducerPath]: supabaseApi.reducer,

        // Slices de estado
        auth: authSlice.reducer,
        ui: uiSlice.reducer,
        evaluation: evaluationSlice.reducer
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignorar acciones no serializables de RTK Query
                ignoredActions: [
                    'persist/PERSIST',
                    'persist/REHYDRATE',
                    'persist/REGISTER'
                ],
                ignoredPaths: ['api']
            }
        }).concat(supabaseApi.middleware),

    // Habilitar Redux DevTools solo en desarrollo
    devTools: import.meta.env.MODE !== 'production'
})

// Configurar listeners para refetch automático
setupListeners(store.dispatch)

// Tipos TypeScript para el store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Hooks tipados para usar en componentes
export { useAppDispatch, useAppSelector } from './hooks'