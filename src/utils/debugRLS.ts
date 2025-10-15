// ============================================================================
// UTILIDAD DE DIAGNÓSTICO PARA RLS
// ============================================================================
// Funciones para diagnosticar problemas de autenticación y RLS
// ============================================================================

import { supabase } from '../lib/supabase';

export const debugRLS = {
    // Verificar el usuario actual y su sesión
    async getCurrentUserInfo() {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error('Error getting user:', userError);
                return null;
            }

            console.log('Current user from auth:', user);

            // Verificar el perfil en la tabla users
            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                console.log('User profile from database:', profile);
                console.log('Profile error:', profileError);

                return { user, profile, profileError };
            }

            return { user: null, profile: null };
        } catch (error) {
            console.error('Error in getCurrentUserInfo:', error);
            return null;
        }
    },

    // Probar las funciones de seguridad RLS
    async testRLSFunctions() {
        try {
            console.log('Testing RLS functions...');

            // Probar get_user_organization_id()
            const { data: orgId, error: orgError } = await supabase
                .rpc('get_user_organization_id');

            console.log('get_user_organization_id() result:', orgId);
            console.log('get_user_organization_id() error:', orgError);

            // Probar is_organization_admin()
            const { data: isAdmin, error: adminError } = await supabase
                .rpc('is_organization_admin');

            console.log('is_organization_admin() result:', isAdmin);
            console.log('is_organization_admin() error:', adminError);

            return { orgId, orgError, isAdmin, adminError };
        } catch (error) {
            console.error('Error testing RLS functions:', error);
            return null;
        }
    },

    // Probar acceso directo a question_templates
    async testTemplateAccess() {
        try {
            console.log('Testing template access...');

            // Intentar leer templates
            const { data: templates, error: readError } = await supabase
                .from('question_templates')
                .select('*')
                .limit(5);

            console.log('Templates read result:', templates);
            console.log('Templates read error:', readError);

            return { templates, readError };
        } catch (error) {
            console.error('Error testing template access:', error);
            return null;
        }
    },

    // Ejecutar todos los diagnósticos
    async runFullDiagnosis() {
        console.log('=== RLS DIAGNOSIS START ===');

        const userInfo = await this.getCurrentUserInfo();
        const rlsTest = await this.testRLSFunctions();
        const templateTest = await this.testTemplateAccess();

        console.log('=== DIAGNOSIS SUMMARY ===');
        console.log('User authenticated:', !!userInfo?.user);
        console.log('User has profile:', !!userInfo?.profile);
        console.log('Organization ID:', userInfo?.profile?.organization_id);
        console.log('RLS functions working:', !rlsTest?.orgError && !rlsTest?.adminError);
        console.log('Template access:', !templateTest?.readError);
        console.log('=== RLS DIAGNOSIS END ===');

        return {
            userInfo,
            rlsTest,
            templateTest,
            summary: {
                authenticated: !!userInfo?.user,
                hasProfile: !!userInfo?.profile,
                organizationId: userInfo?.profile?.organization_id,
                rlsFunctionsWork: !rlsTest?.orgError && !rlsTest?.adminError,
                templateAccess: !templateTest?.readError
            }
        };
    }
};