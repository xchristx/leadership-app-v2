// ============================================================================
// SLICE DE UI (INTERFAZ DE USUARIO) - CORREGIDO
// ============================================================================
// Estado global para elementos de UI como modales, notificaciones, tema, etc.
// ============================================================================

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

export interface ModalState {
    isOpen: boolean;
    type: string | null;
    data: Record<string, unknown> | null;
}

export interface UIState {
    // Tema
    theme: 'light' | 'dark' | 'system';

    // Sidebar
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;

    // Modales
    modal: ModalState;

    // Notificaciones
    notifications: Notification[];

    // Estados de carga globales
    globalLoading: boolean;
    pageLoading: boolean;

    // Configuración de vista
    density: 'comfortable' | 'compact';
    language: 'es' | 'en';
}

const initialState: UIState = {
    theme: 'light', // Cambiado de 'system' a 'light' por simplicidad
    sidebarOpen: true,
    sidebarCollapsed: false,
    modal: {
        isOpen: false,
        type: null,
        data: null,
    },
    notifications: [],
    globalLoading: false,
    pageLoading: false,
    density: 'comfortable',
    language: 'es',
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // Tema
        setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
            state.theme = action.payload;
        },

        // Sidebar
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },

        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload;
        },

        toggleSidebarCollapse: (state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },

        setSidebarCollapsed: (state, action: PayloadAction<boolean>) => { // Nuevo action
            state.sidebarCollapsed = action.payload;
        },

        // Modales
        openModal: (state, action: PayloadAction<{ type: string; data?: Record<string, unknown> }>) => {
            state.modal = {
                isOpen: true,
                type: action.payload.type,
                data: action.payload.data || null,
            };
        },

        closeModal: (state) => {
            state.modal = {
                isOpen: false,
                type: null,
                data: null,
            };
        },

        // Notificaciones
        addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
            const notification: Notification = {
                ...action.payload,
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // substr -> substring
            };
            state.notifications.push(notification);
        },

        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter((n) => n.id !== action.payload);
        },

        clearNotifications: (state) => {
            state.notifications = [];
        },

        // Estados de carga
        setGlobalLoading: (state, action: PayloadAction<boolean>) => {
            state.globalLoading = action.payload;
        },

        setPageLoading: (state, action: PayloadAction<boolean>) => {
            state.pageLoading = action.payload;
        },

        // Configuración
        setDensity: (state, action: PayloadAction<'comfortable' | 'compact'>) => {
            state.density = action.payload;
        },

        setLanguage: (state, action: PayloadAction<'es' | 'en'>) => {
            state.language = action.payload;
        },
    },
});

// Acciones exportadas
export const {
    setTheme,
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarCollapse,
    setSidebarCollapsed, // Exportado
    openModal,
    closeModal,
    addNotification,
    removeNotification,
    clearNotifications,
    setGlobalLoading,
    setPageLoading,
    setDensity,
    setLanguage,
} = uiSlice.actions;

// Selectores
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectSidebar = (state: { ui: UIState }) => ({
    isOpen: state.ui.sidebarOpen,
    isCollapsed: state.ui.sidebarCollapsed,
});
export const selectModal = (state: { ui: UIState }) => state.ui.modal;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectPageLoading = (state: { ui: UIState }) => state.ui.pageLoading;

export default uiSlice.reducer;