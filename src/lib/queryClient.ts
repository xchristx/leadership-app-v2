// ============================================================================
// CONFIGURACIÓN DE REACT QUERY CLIENT
// ============================================================================
// Cliente singleton de React Query para uso en toda la aplicación
// ============================================================================

import { QueryClient } from '@tanstack/react-query';

// Crear instancia singleton del query client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Tiempo de cache por defecto: 5 minutos
            staleTime: 1000 * 60 * 5,
            // Tiempo para recolección de basura: 10 minutos
            gcTime: 1000 * 60 * 10,
            // Reintentar 3 veces en caso de error
            retry: 3,
            // No refetch automático en focus de ventana para mejor UX
            refetchOnWindowFocus: false,
        },
        mutations: {
            // Reintentar mutaciones 1 vez en caso de error de red
            retry: 1,
        },
    },
});