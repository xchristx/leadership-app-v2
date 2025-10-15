// ============================================================================
// ÍNDICE DE COMPONENTES DE GRÁFICOS
// ============================================================================
// Exportación centralizada de todos los componentes de gráficos
// ============================================================================

export { CustomBarChart } from './BarChart'
export { CustomLineChart } from './LineChart'
export { CustomPieChart } from './PieChart'

// Re-export tipos útiles para los gráficos
export interface ChartData {
    name: string
    value: number
    [key: string]: string | number | undefined
}

export interface ChartColors {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    info: string
}