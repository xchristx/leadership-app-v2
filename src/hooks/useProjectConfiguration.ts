// ============================================================================
// HOOK DE CONFIGURACIONES DE PROYECTO
// ============================================================================
// Hook para gestionar configuraciones que afectan las evaluaciones
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import * as configService from '../services/projectConfigurationService';
import type { ProjectConfiguration } from '../types';

interface UseProjectConfigurationResult {
    configuration: ProjectConfiguration | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
    updateConfiguration: (updates: Partial<ProjectConfiguration>) => Promise<boolean>;
    validateAccess: (evaluatorEmail?: string) => Promise<{
        canEvaluate: boolean;
        reason?: string;
    }>;
}

export function useProjectConfiguration(projectId: string): UseProjectConfigurationResult {
    const [configuration, setConfiguration] = useState<ProjectConfiguration | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadConfiguration = useCallback(async () => {
        if (!projectId) {
            setConfiguration(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const config = await configService.getProjectConfiguration(projectId);
            setConfiguration(config);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setConfiguration(null);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    const updateConfiguration = useCallback(async (
        updates: Partial<ProjectConfiguration>
    ): Promise<boolean> => {
        if (!projectId) return false;

        try {
            const updatedConfig = await configService.updateProjectConfiguration(projectId, updates);
            setConfiguration(updatedConfig);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar');
            return false;
        }
    }, [projectId]);

    const validateAccess = useCallback(async (evaluatorEmail?: string) => {
        if (!projectId) {
            return { canEvaluate: false, reason: 'ID de proyecto no válido' };
        }

        try {
            const result = await configService.validateEvaluationAccess(projectId, evaluatorEmail);
            return {
                canEvaluate: result.canEvaluate,
                reason: result.reason
            };
        } catch {
            return {
                canEvaluate: false,
                reason: 'Error al validar acceso'
            };
        }
    }, [projectId]);

    useEffect(() => {
        loadConfiguration();
    }, [loadConfiguration]);

    return {
        configuration,
        isLoading,
        error,
        refetch: loadConfiguration,
        updateConfiguration,
        validateAccess
    };
}

// ============================================================================
// HOOK PARA VALIDACIÓN DE EVALUACIONES
// ============================================================================

interface UseEvaluationValidationResult {
    canEvaluate: boolean;
    reason?: string;
    isValidating: boolean;
    requiresInfo: boolean;
    reminderConfig: {
        enabled: boolean;
        days: number[];
        emailNotifications: boolean;
    };
}

export function useEvaluationValidation(
    projectId: string,
    evaluatorEmail?: string
): UseEvaluationValidationResult {
    const [state, setState] = useState<UseEvaluationValidationResult>({
        canEvaluate: true,
        isValidating: true,
        requiresInfo: true,
        reminderConfig: {
            enabled: false,
            days: [],
            emailNotifications: false
        }
    });

    useEffect(() => {
        if (!projectId) {
            setState({
                canEvaluate: false,
                reason: 'ID de proyecto no válido',
                isValidating: false,
                requiresInfo: true,
                reminderConfig: {
                    enabled: false,
                    days: [],
                    emailNotifications: false
                }
            });
            return;
        }

        const validateAccess = async () => {
            try {
                setState(prev => ({ ...prev, isValidating: true }));

                // Ejecutar validaciones en paralelo
                const [
                    accessResult,
                    requiresInfo,
                    reminderConfig
                ] = await Promise.all([
                    configService.validateEvaluationAccess(projectId, evaluatorEmail),
                    configService.requiresEvaluatorInfo(projectId),
                    configService.getReminderConfig(projectId)
                ]);

                setState({
                    canEvaluate: accessResult.canEvaluate,
                    reason: accessResult.reason,
                    isValidating: false,
                    requiresInfo,
                    reminderConfig
                });
            } catch {
                setState({
                    canEvaluate: false,
                    reason: 'Error al validar acceso',
                    isValidating: false,
                    requiresInfo: true,
                    reminderConfig: {
                        enabled: false,
                        days: [],
                        emailNotifications: false
                    }
                });
            }
        };

        validateAccess();
    }, [projectId, evaluatorEmail]);

    return state;
}

// ============================================================================
// HOOK PARA CREAR/ACTUALIZAR CONFIGURACIONES
// ============================================================================

export function useProjectConfigurationManager(projectId: string) {
    const { configuration, isLoading, error, refetch } = useProjectConfiguration(projectId);
    const [isSaving, setIsSaving] = useState(false);

    const createConfiguration = useCallback(async (
        config?: Partial<ProjectConfiguration>
    ): Promise<{ success: boolean; error?: string }> => {
        if (!projectId) {
            return { success: false, error: 'ID de proyecto no válido' };
        }

        try {
            setIsSaving(true);

            if (config) {
                await configService.createProjectConfiguration(projectId, {
                    ...configService.DEFAULT_PROJECT_CONFIGURATION,
                    ...config
                });
            } else {
                await configService.createDefaultConfiguration(projectId);
            }

            refetch();
            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Error al crear configuración'
            };
        } finally {
            setIsSaving(false);
        }
    }, [projectId, refetch]);

    const updateConfiguration = useCallback(async (
        updates: Partial<ProjectConfiguration>
    ): Promise<{ success: boolean; error?: string }> => {
        if (!projectId) {
            return { success: false, error: 'ID de proyecto no válido' };
        }

        try {
            setIsSaving(true);
            await configService.updateProjectConfiguration(projectId, updates);
            refetch();
            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Error al actualizar configuración'
            };
        } finally {
            setIsSaving(false);
        }
    }, [projectId, refetch]);

    return {
        configuration,
        isLoading,
        error,
        isSaving,
        createConfiguration,
        updateConfiguration,
        refetch
    };
}