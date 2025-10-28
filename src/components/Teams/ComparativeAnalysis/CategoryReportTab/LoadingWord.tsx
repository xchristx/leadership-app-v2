import { Box, Typography, useTheme } from '@mui/material';

const LoadingWord = () => {
  const { palette } = useTheme();
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          p: 4,
          minWidth: 300,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: palette.primary.main, fontWeight: 600 }}>
          Generando Word
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
          Preparando y empaquetando el documento. Por favor espera...
        </Typography>
        <Box sx={{ width: '100%', mb: 2 }}>
          <div
            style={{
              width: '100%',
              height: 8,
              backgroundColor: '#e0e0e0',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: palette.primary.main,
                borderRadius: 4,
                transition: 'width 0.3s ease',
                width: '60%',
              }}
            />
          </div>
        </Box>
        <Typography variant="caption" sx={{ color: '#999' }}>
          Por favor espera mientras se genera tu documento...
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingWord;
