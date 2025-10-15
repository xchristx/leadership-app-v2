# API DESIGN PATTERNS CON SUPABASE

Este documento muestra cómo implementar las operaciones principales usando Supabase JavaScript Client desde React TypeScript.

## CONFIGURACIÓN INICIAL

### 1. Instalación de dependencias

```bash
npm install @supabase/supabase-js
npm install -D @types/uuid uuid
```

### 2. Configuración del cliente Supabase

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos TypeScript generados (opcional)
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          subdomain: string
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          settings?: Record<string, any>
        }
        Update: {
          name?: string
          subdomain?: string
          settings?: Record<string, any>
        }
      }
      // ... más tipos aquí
    }
  }
}
```

## OPERACIONES DE PLANTILLAS Y PROYECTOS

### 1. Gestión de Plantillas de Cuestionarios

```typescript
// hooks/useQuestionTemplates.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface QuestionTemplate {
  id: string
  title: string
  description: string
  version_type: 'leader' | 'collaborator' | 'both'
  is_active: boolean
  created_at: string
}

export const useQuestionTemplates = (organizationId: string) => {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([])
  const [loading, setLoading] = useState(false)

  // Obtener todas las plantillas
  const fetchTemplates = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('question_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    setTemplates(data || [])
    setLoading(false)
  }

  // Crear nueva plantilla
  const createTemplate = async (templateData: {
    title: string
    description: string
    version_type: 'leader' | 'collaborator' | 'both'
  }) => {
    const { data, error } = await supabase
      .from('question_templates')
      .insert({
        ...templateData,
        organization_id: organizationId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener plantilla con preguntas
  const getTemplateWithQuestions = async (templateId: string) => {
    const { data, error } = await supabase
      .from('question_templates')
      .select(`
        *,
        questions:questions(
          id,
          text_leader,
          text_collaborator,
          category,
          order_index,
          question_type,
          response_config
        )
      `)
      .eq('id', templateId)
      .single()

    if (error) throw error
    return data
  }

  useEffect(() => {
    fetchTemplates()
  }, [organizationId])

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    getTemplateWithQuestions
  }
}
```

### 2. Gestión de Proyectos

```typescript
// hooks/useProjects.ts
import { supabase } from '../lib/supabase'

interface Project {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  hierarchy_levels: number
  start_date: string
  end_date: string
  template: {
    id: string
    title: string
  }
}

export const useProjects = (organizationId: string) => {
  // Crear proyecto con configuración
  const createProject = async (projectData: {
    templateId: string
    name: string
    description?: string
    hierarchyLevels?: number
    allowReEvaluation?: boolean
    evaluationDeadline?: string
  }) => {
    // Usar función SQL personalizada para crear proyecto completo
    const { data, error } = await supabase.rpc('create_project_with_config', {
      p_organization_id: organizationId,
      p_template_id: projectData.templateId,
      p_name: projectData.name,
      p_description: projectData.description,
      p_hierarchy_levels: projectData.hierarchyLevels || 2,
      p_allow_re_evaluation: projectData.allowReEvaluation || false,
      p_evaluation_deadline: projectData.evaluationDeadline
    })

    if (error) throw error
    return data
  }

  // Obtener proyectos con estadísticas
  const getProjectsWithStats = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        hierarchy_levels,
        start_date,
        end_date,
        question_templates:template_id(title),
        teams:teams(count),
        evaluations:teams(evaluations(count))
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Activar proyecto
  const activateProject = async (projectId: string) => {
    const { data, error } = await supabase.rpc('activate_project', {
      project_uuid: projectId
    })

    if (error) throw error
    return data
  }

  return {
    createProject,
    getProjectsWithStats,
    activateProject
  }
}
```

### 3. Gestión de Equipos e Invitaciones

```typescript
// hooks/useTeams.ts
import { supabase } from '../lib/supabase'

interface Team {
  id: string
  name: string
  leader_name: string
  leader_email: string
  department?: string
  team_size?: number
  invitations: TeamInvitation[]
}

interface TeamInvitation {
  id: string
  role_type: 'leader' | 'collaborator'
  unique_token: string
  is_active: boolean
  expires_at?: string
  current_uses: number
}

export const useTeams = (projectId: string) => {
  // Crear equipo con invitaciones
  const createTeam = async (teamData: {
    name: string
    leaderName: string
    leaderEmail: string
    department?: string
    teamSize?: number
  }) => {
    const { data, error } = await supabase.rpc('create_team_with_invitations', {
      p_project_id: projectId,
      p_team_name: teamData.name,
      p_leader_name: teamData.leaderName,
      p_leader_email: teamData.leaderEmail,
      p_department: teamData.department,
      p_team_size: teamData.teamSize
    })

    if (error) throw error
    return data
  }

  // Obtener equipos con invitaciones
  const getTeamsWithInvitations = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        invitations:team_invitations(
          id,
          role_type,
          unique_token,
          is_active,
          expires_at,
          current_uses,
          max_uses
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Regenerar token de invitación
  const regenerateToken = async (invitationId: string) => {
    const { data, error } = await supabase.rpc('regenerate_invitation_token', {
      invitation_uuid: invitationId
    })

    if (error) throw error
    return data
  }

  // Generar URLs de invitación
  const generateInvitationUrls = (team: Team) => {
    const baseUrl = window.location.origin
    return team.invitations.reduce((urls, invitation) => {
      urls[invitation.role_type] = `${baseUrl}/evaluate/${invitation.unique_token}`
      return urls
    }, {} as Record<string, string>)
  }

  return {
    createTeam,
    getTeamsWithInvitations,
    regenerateToken,
    generateInvitationUrls
  }
}
```

## FLUJO DE EVALUACIÓN PÚBLICA (SIN AUTENTICACIÓN)

### 1. Acceso por Token de Invitación

```typescript
// hooks/useEvaluation.ts
import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface EvaluationSession {
  evaluation_id: string
  session_id: string
  team_name: string
  role_type: 'leader' | 'collaborator'
}

interface Question {
  id: string
  text_leader: string
  text_collaborator: string
  category: string
  order_index: number
  question_type: 'likert' | 'text' | 'multiple_choice'
  response_config: Record<string, any>
}

export const useEvaluation = () => {
  const [session, setSession] = useState<EvaluationSession | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentResponses, setCurrentResponses] = useState<Record<string, any>>({})

  // Iniciar sesión de evaluación
  const startEvaluationSession = async (
    token: string,
    evaluatorName: string,
    evaluatorEmail: string
  ) => {
    const { data, error } = await supabase.rpc('start_evaluation_session', {
      p_invitation_token: token,
      p_evaluator_name: evaluatorName,
      p_evaluator_email: evaluatorEmail
    })

    if (error) throw error
    
    const sessionData = data[0] as EvaluationSession
    setSession(sessionData)
    
    // Obtener preguntas para esta evaluación
    await loadQuestions(sessionData.evaluation_id, sessionData.role_type)
    
    return sessionData
  }

  // Cargar preguntas adaptadas al rol
  const loadQuestions = async (evaluationId: string, roleType: string) => {
    // Obtener template_id desde la evaluación
    const { data: evalData } = await supabase
      .from('evaluations')
      .select(`
        teams:team_id(
          projects:project_id(template_id)
        )
      `)
      .eq('id', evaluationId)
      .single()

    const templateId = evalData?.teams?.projects?.template_id

    // Obtener preguntas
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('template_id', templateId)
      .eq('is_active', true)
      .order('order_index')

    if (error) throw error
    setQuestions(data || [])
  }

  // Guardar respuesta individual
  const saveResponse = async (questionId: string, response: any) => {
    if (!session) throw new Error('No active session')

    const responseData = {
      evaluation_id: session.evaluation_id,
      question_id: questionId,
      response_value: typeof response === 'number' ? response : null,
      response_text: typeof response === 'string' ? response : null,
      response_data: typeof response === 'object' ? response : null
    }

    const { error } = await supabase
      .from('evaluation_responses')
      .upsert(responseData, {
        onConflict: 'evaluation_id,question_id'
      })

    if (error) throw error

    // Actualizar respuestas locales
    setCurrentResponses(prev => ({
      ...prev,
      [questionId]: response
    }))
  }

  // Finalizar evaluación
  const completeEvaluation = async () => {
    if (!session) throw new Error('No active session')

    const { data, error } = await supabase.rpc('complete_evaluation', {
      p_evaluation_id: session.evaluation_id
    })

    if (error) throw error
    return data
  }

  // Obtener progreso de evaluación
  const getEvaluationProgress = async () => {
    if (!session) return { answered: 0, total: 0, percentage: 0 }

    const { data, error } = await supabase
      .from('evaluation_responses')
      .select('id')
      .eq('evaluation_id', session.evaluation_id)

    if (error) throw error

    const answered = data?.length || 0
    const total = questions.length
    const percentage = total > 0 ? (answered / total) * 100 : 0

    return { answered, total, percentage }
  }

  return {
    session,
    questions,
    currentResponses,
    startEvaluationSession,
    saveResponse,
    completeEvaluation,
    getEvaluationProgress
  }
}
```

### 2. Componente de Evaluación

```typescript
// components/EvaluationForm.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEvaluation } from '../hooks/useEvaluation'

export const EvaluationForm: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const {
    session,
    questions,
    currentResponses,
    startEvaluationSession,
    saveResponse,
    completeEvaluation,
    getEvaluationProgress
  } = useEvaluation()

  const [evaluatorInfo, setEvaluatorInfo] = useState({
    name: '',
    email: ''
  })
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [progress, setProgress] = useState({ answered: 0, total: 0, percentage: 0 })

  // Inicializar sesión
  const handleStartEvaluation = async () => {
    if (!token || !evaluatorInfo.name || !evaluatorInfo.email) return

    try {
      await startEvaluationSession(token, evaluatorInfo.name, evaluatorInfo.email)
    } catch (error) {
      console.error('Error starting evaluation:', error)
      // Manejar error (token inválido, etc.)
    }
  }

  // Manejar respuesta
  const handleResponse = async (questionId: string, value: any) => {
    try {
      await saveResponse(questionId, value)
      updateProgress()
    } catch (error) {
      console.error('Error saving response:', error)
    }
  }

  // Actualizar progreso
  const updateProgress = async () => {
    const progressData = await getEvaluationProgress()
    setProgress(progressData)
  }

  // Finalizar evaluación
  const handleComplete = async () => {
    try {
      const completed = await completeEvaluation()
      if (completed) {
        navigate('/evaluation-complete')
      }
    } catch (error) {
      console.error('Error completing evaluation:', error)
    }
  }

  // Renderizar pregunta actual
  const renderQuestion = (question: any, index: number) => {
    const questionText = session?.role_type === 'leader' 
      ? question.text_leader 
      : question.text_collaborator

    return (
      <div key={question.id} className="question-container">
        <h3>Pregunta {index + 1} de {questions.length}</h3>
        <p>{questionText}</p>
        
        {question.question_type === 'likert' && (
          <LikertScale
            value={currentResponses[question.id]}
            onChange={(value) => handleResponse(question.id, value)}
            config={question.response_config}
          />
        )}

        {question.question_type === 'text' && (
          <textarea
            value={currentResponses[question.id] || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
          />
        )}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="evaluation-start">
        <h2>Iniciar Evaluación</h2>
        <input
          type="text"
          placeholder="Tu nombre"
          value={evaluatorInfo.name}
          onChange={(e) => setEvaluatorInfo(prev => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="email"
          placeholder="Tu email"
          value={evaluatorInfo.email}
          onChange={(e) => setEvaluatorInfo(prev => ({ ...prev, email: e.target.value }))}
        />
        <button onClick={handleStartEvaluation}>
          Comenzar Evaluación
        </button>
      </div>
    )
  }

  return (
    <div className="evaluation-form">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress.percentage}%` }}
        />
        <span>{progress.answered} de {progress.total} respondidas</span>
      </div>

      <h2>Evaluación de Equipo: {session.team_name}</h2>
      <p>Rol: {session.role_type === 'leader' ? 'Líder' : 'Colaborador'}</p>

      {questions.length > 0 && (
        <>
          {renderQuestion(questions[currentQuestionIndex], currentQuestionIndex)}
          
          <div className="navigation-buttons">
            <button 
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Anterior
            </button>
            
            <button 
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Siguiente
            </button>
          </div>

          {progress.percentage >= 80 && (
            <button onClick={handleComplete} className="complete-button">
              Finalizar Evaluación
            </button>
          )}
        </>
      )}
    </div>
  )
}

// Componente auxiliar para escala Likert
const LikertScale: React.FC<{
  value: number | undefined
  onChange: (value: number) => void
  config: { scale: number; labels: string[] }
}> = ({ value, onChange, config }) => {
  return (
    <div className="likert-scale">
      {Array.from({ length: config.scale }, (_, i) => i + 1).map(scale => (
        <label key={scale}>
          <input
            type="radio"
            value={scale}
            checked={value === scale}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span>{scale}</span>
          {config.labels[scale - 1] && (
            <small>{config.labels[scale - 1]}</small>
          )}
        </label>
      ))}
    </div>
  )
}
```

## ANÁLISIS Y REPORTES

### 1. Dashboard de Proyecto

```typescript
// hooks/useAnalytics.ts
export const useAnalytics = (projectId: string) => {
  // Obtener métricas del dashboard
  const getDashboardMetrics = async () => {
    const { data, error } = await supabase.rpc('get_project_dashboard', {
      p_project_id: projectId
    })

    if (error) throw error
    
    return data.reduce((metrics, item) => {
      metrics[item.metric_name] = {
        value: item.metric_value,
        label: item.metric_label
      }
      return metrics
    }, {} as Record<string, { value: number; label: string }>)
  }

  // Obtener comparación entre equipos
  const getTeamsComparison = async () => {
    const { data, error } = await supabase.rpc('get_teams_comparison', {
      p_project_id: projectId
    })

    if (error) throw error
    return data
  }

  // Obtener resultados detallados por equipo
  const getTeamResults = async (teamId: string) => {
    const { data, error } = await supabase.rpc('get_team_results', {
      p_team_id: teamId
    })

    if (error) throw error
    return data
  }

  return {
    getDashboardMetrics,
    getTeamsComparison,
    getTeamResults
  }
}
```

### 2. Exportación de Datos

```typescript
// hooks/useDataExport.ts
export const useDataExport = () => {
  const exportEvaluationData = async (projectId: string) => {
    const { data, error } = await supabase.rpc('export_evaluation_data', {
      p_project_id: projectId
    })

    if (error) throw error

    // Convertir a CSV
    const csvContent = convertToCSV(data)
    downloadCSV(csvContent, `evaluation-data-${projectId}.csv`)
    
    return data
  }

  const convertToCSV = (data: any[]) => {
    if (!data.length) return ''

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value}"` : value
      }).join(','))
    ]

    return csvRows.join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return { exportEvaluationData }
}
```

## CONSIDERACIONES DE IMPLEMENTACIÓN

### 1. Manejo de Errores

```typescript
// utils/errorHandler.ts
export class EvaluationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'EvaluationError'
  }
}

export const handleSupabaseError = (error: any) => {
  switch (error.code) {
    case 'PGRST116':
      throw new EvaluationError('Token de invitación inválido o expirado', 'INVALID_TOKEN')
    case 'PGRST204':
      throw new EvaluationError('No se encontraron datos', 'NOT_FOUND')
    default:
      throw new EvaluationError(error.message, error.code, error)
  }
}
```

### 2. Optimización de Consultas

```typescript
// utils/queryOptimization.ts
// Usar select específicos para reducir transferencia de datos
const optimizedQueries = {
  // En lugar de .select('*')
  getProjectSummary: () => 
    supabase.from('projects').select('id, name, status, start_date'),
  
  // Usar count() para métricas
  getTeamCount: (projectId: string) =>
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
  
  // Paginación para listas grandes
  getEvaluationsPaginated: (page: number, limit = 20) =>
    supabase.from('evaluations')
      .select('*')
      .range(page * limit, (page + 1) * limit - 1)
}
```

Este diseño de API proporciona una base sólida para implementar el sistema de evaluación, manteniendo la separación entre la lógica de negocio (en las funciones SQL) y la interfaz de usuario (en React).