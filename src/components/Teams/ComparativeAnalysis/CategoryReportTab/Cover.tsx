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
        {/* Header corporativo con líneas geométricas */}
        <Box
          sx={{
            height: '80px',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 41%, rgba(255,255,255,0.1) 59%, transparent 60%)',
            },
          }}
        />

        {/* Logo y marca superior */}
        <Box sx={{ position: 'absolute', top: 3, left: 4, right: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 2 }}>
            <Box
              sx={{
                width: 120,
                height: 60,
                backgroundColor: 'white',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '2px solid #e3f2fd',
              }}
            >
              <CardMedia component="img" image="/ho_logo.jpg" sx={{ width: 100, height: 'auto', maxHeight: 50 }} />
            </Box>
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
            mt: 4,
          }}
        >
          {/* Título principal con diseño corporativo */}
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
              }}
            >
              PRÁCTICAS DE LIDERAZGO
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {categoryData.length > 0 &&
                categoryData.map(category => (
                  <PracticeMedia key={category.category.id} index={category.category.order_index} category={category.category.name} />
                ))}
            </Box>
          </Box>

          {/* Información del equipo con diseño elegante */}
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
                  fontWeight: 400,
                  lineHeight: 1.4,
                  fontSize: '1.1rem',
                  mb: 2,
                }}
              >
                Líder: {teamLeader}
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

          {/* Elementos decorativos geométricos */}
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
            }}
          >
            {/* Icono de calendario elegante */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                backgroundColor: palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                  fill="white"
                />
              </svg>
            </Box>
            <Box sx={{ textAlign: 'left' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#546e7a',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
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
            top: '20%',
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            border: '2px solid #e3f2fd',
            opacity: 0.3,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '25%',
            left: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '2px solid #e3f2fd',
            opacity: 0.2,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '70%',
            width: 80,
            height: 80,
            transform: 'rotate(45deg)',
            border: '2px solid #e3f2fd',
            opacity: 0.15,
          }}
        />
      </Box>
    </Paper>
  );
};

export default Cover;
