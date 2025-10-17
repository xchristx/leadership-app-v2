# Configuración de Gráficos Excel con Infragistics

## Instalación de Dependencias

Para habilitar la generación automática de gráficos en Excel, instalar las siguientes dependencias:

```bash
# Biblioteca principal de Infragistics Excel
npm install @infragistics/ignite-ui-angular-excel

# Biblioteca de gráficos (si es necesaria)
npm install @infragistics/ignite-ui-charts

# Dependencias adicionales que podrían ser necesarias
npm install @infragistics/ignite-ui-core
```

## Configuración del Proyecto

1. **Importaciones**: Una vez instaladas las dependencias, descomentar las importaciones en `exportToExcel.ts`:

```typescript
// Cambiar de:
// import { Workbook, Worksheet, ChartType } from '@infragistics/ignite-ui-angular-excel';

// A:
import { Workbook, Worksheet, ChartType } from '@infragistics/ignite-ui-angular-excel';
```

2. **Función de Exportación**: Descomentar la función `exportToExcelWithCharts` completa.

3. **Tipos de Gráficos Soportados**: 
   - Line (Líneas)
   - ColumnClustered (Columnas agrupadas) 
   - LineMarkersStacked (Líneas con marcadores apiladas)
   - Area, Pie, Bar, etc. (más de 70 tipos)

## Funcionalidades Implementadas

### 📊 Gráficos Automáticos por Hoja

#### Hoja "Resumen"
- **Tipo**: Gráfico de barras agrupadas (ColumnClustered)
- **Datos**: Comparación AUTO vs OTROS por categoría
- **Posición**: Columnas E-K, filas 1-16

#### Hojas por Categoría Individual
- **Gráfico 1**: Líneas de tendencia (Line)
  - Datos: AUTO vs OBSERVADORES por pregunta
  - Posición: Debajo de la tabla de datos

- **Gráfico 2**: Barras comparativas (ColumnClustered)  
  - Datos: Mismo conjunto, vista diferente
  - Posición: Al lado del gráfico de líneas

#### Hoja "Dashboard"
- **Tipo**: Líneas con marcadores apiladas (LineMarkersStacked)
- **Datos**: Vista consolidada de todas las categorías
- **Características**: Leyenda en la parte inferior

### 🎨 Formato y Estilos

- **Encabezados**: Negrita, fondo azul claro (#E3F2FD)
- **Títulos de Gráficos**: Automáticos y descriptivos
- **Leyendas**: Posicionadas automáticamente
- **Rangos de Datos**: Calculados dinámicamente

### 📏 Dimensiones y Posicionamiento

```typescript
// Ejemplo de configuración de gráfico
const chart = worksheet.shapes().addChart(
  ChartType.ColumnClustered,
  worksheet.rows(startRow).cells(startCol), { x: 0, y: 0 },
  worksheet.rows(endRow).cells(endCol), { x: 100, y: 100 }
);
```

## Beneficios de la Implementación

### ✅ Automática
- Sin intervención manual del usuario
- Gráficos generados al exportar
- Datos y visualizaciones sincronizados

### ✅ Profesional  
- Formato consistente con el diseño web
- Títulos y leyendas automáticos
- Posicionamiento optimizado

### ✅ Interactiva
- Gráficos editables en Excel
- Datos vinculados a las tablas
- Actualización automática si se modifican datos

## Fallback sin Infragistics

Si las librerías no están instaladas:
- La función detecta automáticamente la ausencia
- Usa la exportación estándar sin gráficos  
- Incluye datos preparados para crear gráficos manualmente
- Mantiene instrucciones detalladas en la hoja "Instrucciones"

## Testing y Validación

Para probar la funcionalidad:

1. Instalar dependencias
2. Descomentar código en `exportToExcel.ts`
3. Ejecutar exportación desde la aplicación
4. Verificar que el Excel contenga gráficos automáticos
5. Confirmar que datos y gráficos estén sincronizados

## Consideraciones Técnicas

- **Licencia**: Verificar licenciamiento de Infragistics
- **Bundle Size**: Las librerías pueden aumentar el tamaño del build
- **Compatibilidad**: Probar en diferentes versiones de Excel
- **Performance**: Evaluar tiempo de generación con datasets grandes

---

**Estado Actual**: Preparado para implementación. Código comentado y listo para activar con la instalación de dependencias.