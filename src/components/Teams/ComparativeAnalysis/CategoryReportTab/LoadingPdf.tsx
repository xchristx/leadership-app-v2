import { Box, Typography, useTheme } from '@mui/material';
interface LoadingPdfProps {
  currentPdfPage: number;
  totalPdfPages: number;
}
const LoadingPdf = ({ currentPdfPage, totalPdfPages }: LoadingPdfProps) => {
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
        zIndex: 9999,
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
          Generando PDF
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
          Procesando página {currentPdfPage} de {totalPdfPages}
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
                width: totalPdfPages > 0 ? `${(currentPdfPage / totalPdfPages) * 100}%` : '0%',
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

export default LoadingPdf;
