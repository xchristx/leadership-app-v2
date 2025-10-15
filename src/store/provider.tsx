// ============================================================================
// PROVIDER DE REDUX STORE
// ============================================================================
// Componente wrapper que proporciona el store Redux a toda la aplicación
// ============================================================================

import { Provider } from 'react-redux';
import { store } from './index';

interface ReduxProviderProps {
  children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
