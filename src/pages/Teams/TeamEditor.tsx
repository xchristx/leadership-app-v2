// ============================================================================
// COMPONENTE TEAM EDITOR
// ============================================================================
// Diálogo modal para editar equipos existentes
// ============================================================================

import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { TeamForm } from '../../components/Forms';
import type { Team } from '../../types';

export interface TeamEditorProps {
  open: boolean;
  team: Team | null;
  onClose: () => void;
  onSave: (teamData: Omit<Team, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function TeamEditor({ open, team, onClose, onSave, loading = false }: TeamEditorProps) {
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Convertir el equipo a los datos del formulario
  const getFormData = (team: Team) => {
    return {
      id: team.id,
      name: team.name,
      project_id: team.project_id,
      leader_name: team.leader_name,
      leader_email: team.leader_email,
      team_size: team.team_size,
      is_active: team.is_active,
    };
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        Editar Equipo
        <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {team && <TeamForm mode="edit" initialData={getFormData(team)} onSubmit={onSave} onCancel={handleClose} isLoading={loading} />}
      </DialogContent>
    </Dialog>
  );
}
