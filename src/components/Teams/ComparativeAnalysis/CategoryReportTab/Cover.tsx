import { Box, CardMedia, Paper, Typography, useTheme, type SxProps } from '@mui/material';
import type { CategoryData } from '../types';
import PracticeMedia from './PracticeMedia';

interface CoverProps {
  pageStyle: SxProps;
  teamName: string;
  teamLeader?: string;
  categoryData: CategoryData[];
}

const Cover = ({ pageStyle, teamName, teamLeader, categoryData }: CoverProps) => {
  const { palette } = useTheme();

  return (
    <Paper sx={{ ...pageStyle, p: 0 }} className="caratula" data-testid="page">
      <Box
        sx={{
          height: '279mm',
          width: '216mm',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#fafafa',
        }}
      >
        {/* Header corporativo unificado */}
        <Box
          sx={{
            height: '100px',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            // Efectos de diseño mejorados
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                linear-gradient(45deg, transparent 65%, rgba(255,255,255,0.03) 65%, rgba(255,255,255,0.03) 70%, transparent 70%),
                linear-gradient(-45deg, transparent 65%, rgba(255,255,255,0.03) 65%, rgba(255,255,255,0.03) 70%, transparent 70%)
              `,
              backgroundSize: '40px 40px',
              opacity: 0.6,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            },
          }}
        >
          {/* Logo con contenedor mejorado */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: 140,
                height: 70,
                backgroundColor: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                border: '2px solid rgba(255,255,255,0.8)',
                padding: '8px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardMedia
                component="img"
                image="/ho_logo.jpg"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 54,
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>

          {/* Título del header alineado a la derecha */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              position: 'relative',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                mb: 0.5,
              }}
            ></Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 400,
                fontSize: '0.9rem',
                letterSpacing: '0.5px',
                textShadow: '0 1px 1px rgba(0,0,0,0.1)',
              }}
            >
              Consultores para el desarrollo
            </Typography>
          </Box>
        </Box>

        {/* Contenido principal centralizado */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 6,
            py: 8,
            textAlign: 'center',
            mt: 2,
          }}
        >
          {/* Título principal mejorado */}
          <Box
            sx={{
              mb: 6,
              p: 4,
              backgroundColor: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: '1px solid #e0e0e0',
              maxWidth: '550px',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
                borderRadius: '3px 3px 0 0',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)',
              },
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: palette.primary.main,
                mb: 1,
                fontSize: { md: '1.8rem' },
                letterSpacing: '1px',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              INVENTARIO DE
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#0d47a1',
                fontSize: { md: '2.1rem' },
                letterSpacing: '1px',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                mb: 3,
              }}
            >
              PRÁCTICAS DE LIDERAZGO
            </Typography>

            {/* Prácticas de liderazgo */}
            <Box
              sx={{
                mt: 3,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {categoryData.length > 0 &&
                categoryData.map(category => (
                  <PracticeMedia key={category.category.id} index={category.category.order_index} category={category.category.name} />
                ))}
            </Box>
          </Box>

          {/* Información del equipo mejorada */}
          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              borderRadius: 4,
              p: 4,
              mb: 4,
              maxWidth: '510px',
              width: '100%',
              border: '2px solid #e3f2fd',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                background: 'linear-gradient(180deg, #1976d2, #42a5f5)',
              },
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: palette.primary.main,
                fontSize: '1.8rem',
              }}
            >
              {teamName}
            </Typography>
            {teamLeader && (
              <Typography
                variant="h6"
                sx={{
                  color: 'primary.light',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  fontSize: '1.1rem',
                  mb: 3,
                  borderRadius: 2,
                }}
              >
                Líder del equipo: <strong>{teamLeader}</strong>
              </Typography>
            )}
            <Typography
              variant="h6"
              sx={{
                color: '#546e7a',
                fontWeight: 400,
                lineHeight: 1.4,
                fontSize: '1.1rem',
              }}
            >
              Análisis Comparativo de las Cinco Prácticas de Liderazgo
            </Typography>
          </Box>

          {/* Indicadores de progreso mejorados */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            {[0, 1, 2, 3, 4].map(index => (
              <Box
                key={index}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: index === 2 ? palette.primary.main : '#e3f2fd',
                  transform: index === 2 ? 'scale(1.5)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Footer corporativo */}
        <Box
          sx={{
            backgroundColor: 'white',
            borderTop: '3px solid #1976d2',
            py: 3,
            px: 4,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              backgroundColor: '#f8f9fa',
              borderRadius: 2,
              p: 2,
              border: '1px solid #e0e0e0',
              maxWidth: 400,
              margin: '0 auto',
            }}
          >
            {/* Icono de calendario mejorado */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                  fill="white"
                />
              </svg>
            </Box>
            <Box sx={{ textAlign: 'left', flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#546e7a',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  mb: 0.5,
                }}
              >
                Fecha de Elaboración
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: palette.primary.main,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                }}
              >
                {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Elementos decorativos de fondo */}
        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '3px solid #e3f2fd',
            opacity: 0.4,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '2px solid #e3f2fd',
            opacity: 0.3,
          }}
        />
      </Box>
    </Paper>
  );
};

export default Cover;
