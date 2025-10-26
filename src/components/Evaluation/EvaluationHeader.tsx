import { Box, Typography, Paper, useTheme, Chip, alpha } from '@mui/material';
import { Groups as GroupsIcon, Person as PersonIcon } from '@mui/icons-material';
import { EvaluationStepper } from './EvaluationStepper';
import type { Team } from '../../types';

interface EvaluationHeaderProps {
  templateTitle: string;
  team?: Team;
  templateDescription?: string;
  showDescription?: boolean;
  activeStep: number;
  steps: string[];
}

export function EvaluationHeader({
  templateTitle,
  team,
  templateDescription,
  showDescription = false,
  activeStep,
  steps,
}: EvaluationHeaderProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          background: `linear-gradient(135deg, 
            ${theme.palette.primary.main} 0%, 
            ${theme.palette.primary.dark} 50%, 
            ${theme.palette.primary.light} 100%
          )`,
          color: 'white',
          position: 'relative',
          borderRadius: 3,
          boxShadow: `
            0 4px 20px ${alpha(theme.palette.primary.main, 0.3)},
            inset 0 1px 0 ${alpha('#ffffff', 0.1)}
          `,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${alpha(theme.palette.info.main, 0.1)} 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, ${alpha('#ffffff', 0.05)} 0%, transparent 50%)
            `,
          },
        }}
      >
        {/* Contenido principal */}
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          {/* Título principal */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', md: '2.25rem' },
                lineHeight: 1.2,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 1,
              }}
            >
              {templateTitle}
            </Typography>
          </Box>

          {/* Información del equipo */}
          {team && (
            <Box sx={{ mb: 3 }}>
              {/* Nombre del equipo y líder */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<GroupsIcon />}
                  label={team.name}
                  sx={{
                    background: alpha('#ffffff', 0.15),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', md: '0.9rem' },
                    py: 1,
                    border: `1px solid ${alpha('#ffffff', 0.3)}`,
                    backdropFilter: 'blur(10px)',
                    '& .MuiChip-icon': {
                      color: alpha('#ffffff', 0.9),
                    },
                  }}
                />

                {team.leader_name && (
                  <Chip
                    icon={<PersonIcon />}
                    label={`Líder: ${team.leader_name}`}
                    sx={{
                      background: alpha(theme.palette.secondary.main, 0.2),
                      color: 'white',
                      fontWeight: 500,
                      fontSize: { xs: '0.75rem', md: '0.85rem' },
                      py: 0.8,
                      border: `1px solid ${alpha(theme.palette.secondary.light, 0.4)}`,
                      '& .MuiChip-icon': {
                        color: alpha(theme.palette.secondary.light, 0.9),
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Descripción del template */}
          {templateDescription && showDescription && (
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                p: 2.5,
                background: alpha('#ffffff', 0.08),
                borderRadius: 2,
                border: `1px solid ${alpha('#ffffff', 0.15)}`,
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: `linear-gradient(180deg, ${theme.palette.secondary.light}, ${theme.palette.info.light})`,
                  borderRadius: '4px 0 0 4px',
                },
              }}
            >
              <Typography
                sx={{
                  opacity: 0.95,
                  fontSize: { xs: '0.8rem', md: '0.9rem' },
                  lineHeight: 1.6,
                  fontWeight: 400,
                  pl: 1,
                  whiteSpace: 'break-spaces',
                  color: 'white',
                }}
              >
                {templateDescription}
              </Typography>
            </Paper>
          )}

          {/* Stepper */}
          <Box sx={{ mt: 4 }}>
            <EvaluationStepper activeStep={activeStep} steps={steps} />
          </Box>
        </Box>

        {/* Elementos decorativos */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.light, 0.1)} 0%, transparent 70%)`,
            filter: 'blur(20px)',
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.info.main, 0.08)} 0%, transparent 70%)`,
            filter: 'blur(15px)',
            zIndex: 1,
          }}
        />
      </Box>
    </Paper>
  );
}
