export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json
                    operationName?: string
                    query?: string
                    variables?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    public: {
        Tables: {
            evaluation_responses: {
                Row: {
                    created_at: string
                    evaluation_id: string
                    id: string
                    question_id: string
                    response_data: Json | null
                    response_text: string | null
                    response_time_seconds: number | null
                    response_value: number | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    evaluation_id: string
                    id?: string
                    question_id: string
                    response_data?: Json | null
                    response_text?: string | null
                    response_time_seconds?: number | null
                    response_value?: number | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    evaluation_id?: string
                    id?: string
                    question_id?: string
                    response_data?: Json | null
                    response_text?: string | null
                    response_time_seconds?: number | null
                    response_value?: number | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "evaluation_responses_evaluation_id_fkey"
                        columns: ["evaluation_id"]
                        isOneToOne: false
                        referencedRelation: "evaluations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "evaluation_responses_question_id_fkey"
                        columns: ["question_id"]
                        isOneToOne: false
                        referencedRelation: "questions"
                        referencedColumns: ["id"]
                    },
                ]
            }
            evaluations: {
                Row: {
                    completed_at: string
                    completion_percentage: number | null
                    created_at: string
                    evaluator_email: string
                    evaluator_metadata: Json | null
                    evaluator_name: string
                    evaluator_role: string
                    id: string
                    invitation_id: string
                    is_complete: boolean | null
                    team_id: string
                    updated_at: string
                }
                Insert: {
                    completed_at?: string
                    completion_percentage?: number | null
                    created_at?: string
                    evaluator_email: string
                    evaluator_metadata?: Json | null
                    evaluator_name: string
                    evaluator_role: string
                    id?: string
                    invitation_id: string
                    is_complete?: boolean | null
                    team_id: string
                    updated_at?: string
                }
                Update: {
                    completed_at?: string
                    completion_percentage?: number | null
                    created_at?: string
                    evaluator_email?: string
                    evaluator_metadata?: Json | null
                    evaluator_name?: string
                    evaluator_role?: string
                    id?: string
                    invitation_id?: string
                    is_complete?: boolean | null
                    team_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "evaluations_invitation_id_fkey"
                        columns: ["invitation_id"]
                        isOneToOne: false
                        referencedRelation: "team_invitations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "evaluations_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            invitation_sessions: {
                Row: {
                    created_at: string
                    expires_at: string
                    id: string
                    invitation_id: string
                    last_activity: string
                    session_data: Json | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    expires_at?: string
                    id?: string
                    invitation_id: string
                    last_activity?: string
                    session_data?: Json | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    expires_at?: string
                    id?: string
                    invitation_id?: string
                    last_activity?: string
                    session_data?: Json | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "invitation_sessions_invitation_id_fkey"
                        columns: ["invitation_id"]
                        isOneToOne: true
                        referencedRelation: "team_invitations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            organizations: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    settings: Json | null
                    subdomain: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    settings?: Json | null
                    subdomain: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    settings?: Json | null
                    subdomain?: string
                    updated_at?: string
                }
                Relationships: []
            }
            project_configurations: {
                Row: {
                    allow_re_evaluation: boolean | null
                    created_at: string
                    custom_settings: Json | null
                    email_notifications: boolean | null
                    evaluation_deadline: string | null
                    id: string
                    project_id: string
                    reminder_days: number[] | null
                    require_evaluator_info: boolean | null
                    updated_at: string
                }
                Insert: {
                    allow_re_evaluation?: boolean | null
                    created_at?: string
                    custom_settings?: Json | null
                    email_notifications?: boolean | null
                    evaluation_deadline?: string | null
                    id?: string
                    project_id: string
                    reminder_days?: number[] | null
                    require_evaluator_info?: boolean | null
                    updated_at?: string
                }
                Update: {
                    allow_re_evaluation?: boolean | null
                    created_at?: string
                    custom_settings?: Json | null
                    email_notifications?: boolean | null
                    evaluation_deadline?: string | null
                    id?: string
                    project_id?: string
                    reminder_days?: number[] | null
                    require_evaluator_info?: boolean | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_configurations_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: true
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                ]
            }
            projects: {
                Row: {
                    created_at: string
                    created_by: string | null
                    description: string | null
                    end_date: string | null
                    hierarchy_levels: number | null
                    id: string
                    name: string
                    organization_id: string
                    start_date: string | null
                    status: string | null
                    template_id: string | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    created_by?: string | null
                    description?: string | null
                    end_date?: string | null
                    hierarchy_levels?: number | null
                    id?: string
                    name: string
                    organization_id: string | null
                    start_date?: string | null
                    status?: string | null
                    template_id: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    created_by?: string | null
                    description?: string | null
                    end_date?: string | null
                    hierarchy_levels?: number | null
                    id?: string
                    name?: string
                    organization_id?: string
                    start_date?: string | null
                    status?: string | null
                    template_id?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "projects_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "projects_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "projects_template_id_fkey"
                        columns: ["template_id"]
                        isOneToOne: false
                        referencedRelation: "question_templates"
                        referencedColumns: ["id"]
                    },
                ]
            }
            question_templates: {
                Row: {
                    created_at: string
                    created_by: string | null
                    description: string | null
                    id: string
                    is_active: boolean | null
                    organization_id: string
                    title: string
                    updated_at: string
                    version_type: string | null
                }
                Insert: {
                    created_at?: string
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    organization_id: string
                    title: string
                    updated_at?: string
                    version_type?: string | null
                }
                Update: {
                    created_at?: string
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    organization_id?: string
                    title?: string
                    updated_at?: string
                    version_type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "question_templates_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "question_templates_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            questions: {
                Row: {
                    category: Json | null
                    created_at: string
                    id: string
                    is_active: boolean | null
                    order_index: number
                    question_type: string | null
                    response_config: Json | null
                    template_id: string
                    text_collaborator: string
                    text_leader: string
                    updated_at: string
                }
                Insert: {
                    category?: Json | null
                    created_at?: string
                    id?: string
                    is_active?: boolean | null
                    order_index?: number
                    question_type?: string | null
                    response_config?: Json | null
                    template_id: string
                    text_collaborator: string
                    text_leader: string
                    updated_at?: string
                }
                Update: {
                    category?: Json | null
                    created_at?: string
                    id?: string
                    is_active?: boolean | null
                    order_index?: number
                    question_type?: string | null
                    response_config?: Json | null
                    template_id?: string
                    text_collaborator?: string
                    text_leader?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "questions_template_id_fkey"
                        columns: ["template_id"]
                        isOneToOne: false
                        referencedRelation: "question_templates"
                        referencedColumns: ["id"]
                    },
                ]
            }
            team_invitations: {
                Row: {
                    created_at: string
                    current_uses: number | null
                    expires_at: string | null
                    id: string
                    is_active: boolean | null
                    max_uses: number | null
                    role_type: string
                    team_id: string
                    unique_token: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    current_uses?: number | null
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    max_uses?: number | null
                    role_type: string
                    team_id: string
                    unique_token?: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    current_uses?: number | null
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    max_uses?: number | null
                    role_type?: string
                    team_id?: string
                    unique_token?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_invitations_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            teams: {
                Row: {
                    created_at: string
                    department: string | null
                    id: string
                    is_active: boolean | null
                    leader_email: string
                    leader_name: string
                    name: string
                    project_id: string
                    team_size: number | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    department?: string | null
                    id?: string
                    is_active?: boolean | null
                    leader_email?: string
                    leader_name?: string
                    name: string
                    project_id: string
                    team_size?: number | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    department?: string | null
                    id?: string
                    is_active?: boolean | null
                    leader_email?: string
                    leader_name?: string
                    name?: string
                    project_id?: string
                    team_size?: number | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "teams_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    created_at: string
                    email: string
                    first_name: string | null
                    id: string
                    is_active: boolean | null
                    last_login_at: string | null
                    last_name: string | null
                    organization_id: string | null
                    role: string | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    email: string
                    first_name?: string | null
                    id?: string
                    is_active?: boolean | null
                    last_login_at?: string | null
                    last_name?: string | null
                    organization_id?: string | null
                    role?: string | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    email?: string
                    first_name?: string | null
                    id?: string
                    is_active?: boolean | null
                    last_login_at?: string | null
                    last_name?: string | null
                    organization_id?: string | null
                    role?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "users_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            activate_project: {
                Args: { project_uuid: string }
                Returns: boolean
            }
            cleanup_expired_data: {
                Args: Record<PropertyKey, never>
                Returns: {
                    cleanup_type: string
                    items_cleaned: number
                }[]
            }
            cleanup_expired_sessions: {
                Args: Record<PropertyKey, never>
                Returns: number
            }
            complete_evaluation: {
                Args: { p_evaluation_id: string }
                Returns: boolean
            }
            create_project_with_config: {
                Args: {
                    p_allow_re_evaluation?: boolean
                    p_description?: string
                    p_evaluation_deadline?: string
                    p_hierarchy_levels?: number
                    p_name: string
                    p_organization_id: string
                    p_template_id: string
                }
                Returns: string
            }
            create_team_with_invitations: {
                Args: {
                    p_department?: string
                    p_leader_email: string
                    p_leader_name: string
                    p_project_id: string
                    p_team_name: string
                    p_team_size?: number
                }
                Returns: string
            }
            export_evaluation_data: {
                Args: { p_project_id: string }
                Returns: {
                    completed_at: string
                    evaluator_name: string
                    evaluator_role: string
                    question_category: string
                    question_text: string
                    response_text: string
                    response_value: number
                    team_name: string
                }[]
            }
            get_evaluation_stats: {
                Args: { project_uuid: string }
                Returns: {
                    completed_evaluations: number
                    completion_rate: number
                    team_name: string
                    total_invitations: number
                }[]
            }
            get_project_dashboard: {
                Args: { p_project_id: string }
                Returns: {
                    metric_label: string
                    metric_name: string
                    metric_value: number
                }[]
            }
            get_team_results: {
                Args: { p_team_id: string }
                Returns: {
                    avg_collaborator_score: number
                    avg_leader_score: number
                    category: string
                    question_text: string
                    response_count: number
                }[]
            }
            get_teams_comparison: {
                Args: { p_project_id: string }
                Returns: {
                    collaborator_avg_score: number
                    last_evaluation: string
                    leader_avg_score: number
                    team_name: string
                    total_responses: number
                }[]
            }
            get_user_organization_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            gtrgm_compress: {
                Args: { "": unknown }
                Returns: unknown
            }
            gtrgm_decompress: {
                Args: { "": unknown }
                Returns: unknown
            }
            gtrgm_in: {
                Args: { "": unknown }
                Returns: unknown
            }
            gtrgm_options: {
                Args: { "": unknown }
                Returns: undefined
            }
            gtrgm_out: {
                Args: { "": unknown }
                Returns: unknown
            }
            is_organization_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            regenerate_invitation_token: {
                Args: { invitation_uuid: string }
                Returns: string
            }
            set_limit: {
                Args: { "": number }
                Returns: number
            }
            show_limit: {
                Args: Record<PropertyKey, never>
                Returns: number
            }
            show_trgm: {
                Args: { "": string }
                Returns: string[]
            }
            start_evaluation_session: {
                Args: {
                    p_evaluator_email: string
                    p_evaluator_name: string
                    p_invitation_token: string
                }
                Returns: {
                    evaluation_id: string
                    role_type: string
                    session_id: string
                    team_name: string
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {},
    },
} as const
