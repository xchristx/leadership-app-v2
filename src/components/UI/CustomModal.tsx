// ============================================================================
// COMPONENTE MODAL REUTILIZABLE
// ============================================================================
// Modal customizado con diferentes variantes y tamaños
// ============================================================================

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  Zoom,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';

// Transiciones
const SlideTransition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FadeTransition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Fade ref={ref} {...props} />;
});

const ZoomTransition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Zoom ref={ref} {...props} />;
});

export interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  fullScreen?: boolean;
  transition?: 'slide' | 'fade' | 'zoom';
  closable?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
}

export function CustomModal({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  transition = 'fade',
  closable = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
}: CustomModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Seleccionar transición
  const getTransition = () => {
    switch (transition) {
      case 'slide':
        return SlideTransition;
      case 'zoom':
        return ZoomTransition;
      default:
        return FadeTransition;
    }
  };

  const handleClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen || isMobile}
      TransitionComponent={getTransition()}
      PaperProps={{
        sx: {
          borderRadius: fullScreen || isMobile ? 0 : 2,
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      {(title || closable) && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: description ? 1 : 2,
          }}
        >
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {closable && (
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" size="small">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {/* Descripción */}
      {description && (
        <DialogContent sx={{ pt: 0, pb: 1 }}>
          <DialogContentText>{description}</DialogContentText>
        </DialogContent>
      )}

      {/* Contenido principal */}
      <DialogContent
        sx={{
          pt: description ? 2 : title ? 0 : 3,
          pb: actions ? 1 : 3,
        }}
      >
        {children}
      </DialogContent>

      {/* Acciones */}
      {actions && <DialogActions sx={{ p: 2, pt: 1 }}>{actions}</DialogActions>}
    </Dialog>
  );
}

// Modales predefinidos
export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'primary',
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      maxWidth="xs"
      actions={
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', border: '1px solid #ccc', background: 'transparent', borderRadius: '4px' }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: confirmColor === 'error' ? '#d32f2f' : '#1976d2',
              color: 'white',
              borderRadius: '4px',
            }}
          >
            {confirmText}
          </button>
        </Box>
      }
    >
      <></>
    </CustomModal>
  );
}
