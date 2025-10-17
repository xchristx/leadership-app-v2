// ============================================================================
// GESTIÓN DE INVITACIONES DE EQUIPO
// ============================================================================
// Vista completa para gestionar invitaciones con tokens únicos
// ============================================================================

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

import { useTeamInvitations } from '../../hooks/useTeams';
import type { TeamInvitation, Team } from '../../types';

export interface TeamInvitationsProps {
  teamId?: string;
  team?: Team;
  onClose?: () => void;
}

export function TeamInvitations({ teamId: propTeamId }: TeamInvitationsProps = {}) {
  const { teamId: routeTeamId } = useParams<{ teamId: string }>();
  const teamId = propTeamId || routeTeamId;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<TeamInvitation | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Form states
  const [newRole, setNewRole] = useState<'leader' | 'collaborator'>('collaborator');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState('');

  const { invitations, isLoading, isError, error, createInvitation, updateInvitation, deleteInvitation } = useTeamInvitations(teamId || '');

  if (!teamId) {
    return <Alert severity="error">ID de equipo no válido</Alert>;
  }

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const copyToClipboard = async (token: string) => {
    const url = `${window.location.origin}/evaluation/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showMessage('Enlace copiado al portapapeles');
    } catch {
      showMessage('Error al copiar enlace');
    }
  };

  const generateQRCode = async (invitation: TeamInvitation) => {
    const url = `${window.location.origin}/evaluation/${invitation.unique_token}`;
    try {
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrCodeDataURL);
      setSelectedInvitation(invitation);
      setQrDialogOpen(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      showMessage('Error al generar código QR');
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedInvitation) return;

    const link = document.createElement('a');
    link.download = `qr-invitacion-${selectedInvitation.role_type}-${selectedInvitation.unique_token.substring(0, 8)}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMessage('Código QR descargado');
  };

  const handleCreateInvitation = async () => {
    const options: { maxUses?: number; expiresAt?: string } = {};
    if (maxUses !== '') options.maxUses = Number(maxUses);
    if (expiresAt) options.expiresAt = expiresAt;

    const result = await createInvitation(newRole, options);

    if (result.success) {
      showMessage('Invitación creada exitosamente');
      setCreateDialogOpen(false);
      resetForm();
    } else {
      showMessage(result.error || 'Error al crear invitación');
    }
  };

  const handleUpdateInvitation = async () => {
    if (!selectedInvitation) return;

    const updates: { maxUses?: number; expiresAt?: string } = {};
    if (maxUses !== '') updates.maxUses = Number(maxUses);
    if (expiresAt) updates.expiresAt = expiresAt;

    const result = await updateInvitation(selectedInvitation.id, updates);

    if (result.success) {
      showMessage('Invitación actualizada exitosamente');
      setEditDialogOpen(false);
      setSelectedInvitation(null);
      resetForm();
    } else {
      showMessage(result.error || 'Error al actualizar invitación');
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta invitación?')) return;

    const result = await deleteInvitation(invitationId);

    if (result.success) {
      showMessage('Invitación eliminada exitosamente');
    } else {
      showMessage(result.error || 'Error al eliminar invitación');
    }
  };

  const handleToggleActive = async (invitation: TeamInvitation) => {
    const result = await updateInvitation(invitation.id, {
      isActive: !invitation.is_active,
    });

    if (result.success) {
      showMessage(`Invitación ${invitation.is_active ? 'desactivada' : 'activada'} exitosamente`);
    } else {
      showMessage(result.error || 'Error al cambiar estado');
    }
  };

  const resetForm = () => {
    setNewRole('collaborator');
    setMaxUses('');
    setExpiresAt('');
  };

  const openEditDialog = (invitation: TeamInvitation) => {
    setSelectedInvitation(invitation);
    setMaxUses(invitation.max_uses || '');
    setExpiresAt(invitation.expires_at ? invitation.expires_at.split('T')[0] : '');
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando invitaciones...</Typography>
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Error al cargar invitaciones: {error?.message}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
            Nueva Invitación
          </Button>
        </Box>
      </Box>

      {invitations.length === 0 ? (
        <Alert severity="info">No hay invitaciones creadas. Crea la primera invitación para comenzar.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rol</TableCell>
                <TableCell>Token</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Usos</TableCell>
                <TableCell>Expira</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map(invitation => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <Chip
                      label={invitation.role_type === 'leader' ? 'Líder' : 'Colaborador'}
                      color={invitation.role_type === 'leader' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {invitation.unique_token}
                      </Typography>
                      <Tooltip title="Copiar enlace">
                        <IconButton size="small" onClick={() => copyToClipboard(invitation.unique_token)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generar código QR">
                        <IconButton size="small" onClick={() => generateQRCode(invitation)}>
                          <QrCodeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={invitation.is_active ? 'Activa' : 'Inactiva'}
                        color={invitation.is_active ? 'success' : 'default'}
                        size="small"
                      />
                      <Tooltip title={invitation.is_active ? 'Desactivar' : 'Activar'}>
                        <IconButton size="small" onClick={() => handleToggleActive(invitation)}>
                          {invitation.is_active ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {invitation.current_uses ?? 0} / {invitation.max_uses || '∞'}
                  </TableCell>
                  <TableCell>{invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : 'Sin límite'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEditDialog(invitation)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDeleteInvitation(invitation.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para crear invitación */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Invitación</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select value={newRole} onChange={e => setNewRole(e.target.value as 'leader' | 'collaborator')} label="Rol">
                <MenuItem value="leader">Líder</MenuItem>
                <MenuItem value="collaborator">Colaborador</MenuItem>
              </Select>
            </FormControl>

            <TextField
              type="number"
              label="Máximo de usos"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
              helperText="Dejar vacío para usos ilimitados"
              inputProps={{ min: 1 }}
            />

            <TextField
              type="date"
              label="Fecha de expiración"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Dejar vacío para no expirar"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateInvitation}>
            Crear Invitación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar invitación */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Invitación</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              type="number"
              label="Máximo de usos"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
              helperText="Dejar vacío para usos ilimitados"
              inputProps={{ min: 1 }}
            />

            <TextField
              type="date"
              label="Fecha de expiración"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Dejar vacío para no expirar"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateInvitation}>
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para mostrar código QR */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <QrCodeIcon />
            Código QR - Invitación de {selectedInvitation?.role_type === 'leader' ? 'Líder' : 'Colaborador'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {qrCodeUrl && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: 1,
                  display: 'inline-block',
                }}
              >
                <img
                  src={qrCodeUrl}
                  alt="Código QR"
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              </Box>
            )}

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Escanea este código QR para acceder directamente a la evaluación
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {selectedInvitation && `${window.location.origin}/evaluation/${selectedInvitation.unique_token}`}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => selectedInvitation && copyToClipboard(selectedInvitation.unique_token)}
                sx={{ flex: 1 }}
              >
                Copiar Enlace
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadQRCode} sx={{ flex: 1 }}>
                Descargar QR
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)} fullWidth>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </Box>
  );
}
