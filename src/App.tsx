// ============================================================================
// APLICACIÓN PRINCIPAL
// ============================================================================
// Componente raíz con proveedores y configuración global
// ============================================================================

import { ReduxProvider } from './store/provider';
import { AppThemeProvider } from './theme';
import { AppRouter } from './router';
import './App.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <ReduxProvider>
      <AppThemeProvider defaultMode="light">
        <QueryClientProvider client={queryClient}>
          <AppRouter />
        </QueryClientProvider>
      </AppThemeProvider>
    </ReduxProvider>
  );
}

export default App;
