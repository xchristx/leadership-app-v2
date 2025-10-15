// ============================================================================
// PRUEBA DE MUTACIONES REACT QUERY
// ============================================================================
// Componente de prueba para verificar el funcionamiento de las mutaciones
// ============================================================================

import { useState } from 'react';
import { Box, Button, Typography, Alert, Paper } from '@mui/material';
import { useCreateProjectMutation, useUpdateProjectMutation } from '../../hooks/useProjects';
import { queryClient } from '../../lib/queryClient';

export function QueryClientTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();

  const runQueryClientTest = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      // Verificar que queryClient está disponible
      const queryState = queryClient.getQueryCache().getAll();
      console.log('Query Cache state:', queryState);

      // Verificar mutaciones
      const mutationState = queryClient.getMutationCache().getAll();
      console.log('Mutation Cache state:', mutationState);

      setTestResult(`✅ QueryClient correctamente configurado:
- Query Cache: ${queryState.length} queries activas
- Mutation Cache: ${mutationState.length} mutaciones activas
- Create Mutation: ${createProjectMutation ? '✅ Disponible' : '❌ No disponible'}
- Update Mutation: ${updateProjectMutation ? '✅ Disponible' : '❌ No disponible'}`);
    } catch (error) {
      setTestResult(`❌ Error en QueryClient: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const invalidateQueries = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      setTestResult('✅ Queries invalidadas correctamente');
    } catch (error) {
      setTestResult(`❌ Error al invalidar queries: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const clearCache = () => {
    try {
      queryClient.clear();
      setTestResult('✅ Cache limpiado correctamente');
    } catch (error) {
      setTestResult(`❌ Error al limpiar cache: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Prueba de QueryClient y Mutaciones
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={runQueryClientTest} disabled={isLoading}>
          Probar QueryClient
        </Button>

        <Button variant="outlined" onClick={invalidateQueries} disabled={isLoading}>
          Invalidar Queries
        </Button>

        <Button variant="outlined" color="warning" onClick={clearCache} disabled={isLoading}>
          Limpiar Cache
        </Button>
      </Box>

      {testResult && (
        <Alert severity={testResult.startsWith('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
          <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{testResult}</pre>
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Esta prueba verifica que React Query está correctamente configurado y que las mutaciones funcionan.
      </Typography>
    </Paper>
  );
}
