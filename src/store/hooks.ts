// ============================================================================
// REDUX HOOKS TIPADOS
// ============================================================================
// Hooks personalizados con tipos para usar Redux Toolkit de forma type-safe
// ============================================================================

import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './index'

// Hook tipado para dispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

// Hook tipado para selector
export const useAppSelector = useSelector.withTypes<RootState>()