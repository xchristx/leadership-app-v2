import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
} from '@mui/material';
import { Close, Checklist, Group, Link, Assessment, Analytics, ArrowRightAlt, ZoomIn } from '@mui/icons-material';

const stepsData = {
  project: {
    title: 'Crear proyecto',
    desc: 'Cómo iniciar un nuevo proyecto y prepararlo para evaluación',
    icon: <Checklist sx={{ fontSize: 28 }} />,
    steps: ['Ir a Proyectos > Nuevo proyecto', 'Rellenar nombre, descripción y configurar opciones básicas', 'Guardar proyecto'],
    color: '#4CAF50',
  },
  teams: {
    title: 'Crear equipos',
    desc: 'Configurar equipos y asignar líderes',
    icon: <Group sx={{ fontSize: 28 }} />,
    steps: [
      'Necesitas tener un proyecto creado',
      'Dentro del proyecto presionar Equipos > + Agregar Equipo',
      'Llenas los campos de nombre, proyecto, Nombre del líder, email del líder (opcional) y tamaño del equipo',
      'El equipo debe estar en estado activo para que los miembros puedan recibir invitaciones',
    ],
    color: '#2196F3',
  },
  invite: {
    title: 'Compartir enlace de invitación',
    desc: 'Generar y compartir enlaces para sumar participantes',
    icon: <Link sx={{ fontSize: 28 }} />,
    steps: [
      'Desde la vista del equipo seleccionar "Invitaciones"',
      'Si el proyecto requiere el rol de Director, generarlo primero presionando "+ Nueva Invitación"',
      'Puedes elegir una cantidad maxima de usos y una fecha límite para el enlace (opcional), si no llenas estos campos el enlace será ilimitado',
      'Copiar enlace de invitación correspondiente a cada rol (Líder, Miembro, Director) y enviarlo por correo o chat',
      'El invitado accederá y será añadido al equipo tras aceptar',
    ],
    color: '#FF9800',
  },
  questionnaire: {
    title: 'Completar cuestionario',
    desc: 'Proceso para participantes que responden el cuestionario',
    icon: <Assessment sx={{ fontSize: 28 }} />,
    steps: [
      'El participante abre el enlace de evaluación recibido',
      'Completa el cuestionario siguiendo las instrucciones',
      'Al enviar, los resultados quedan asociados al equipo/proyecto',
    ],
    color: '#9C27B0',
  },
  reports: {
    title: 'Ver reportes',
    desc: 'Generar y descargar reportes e interpretarlos',
    icon: <Analytics sx={{ fontSize: 28 }} />,
    steps: [
      'Ir a Proyectos > Equipos > "Seleccionar un equipo" > Análisis Comparativo',
      'Existen varias opciones de informes, (Resumen Ejecutivo, Análisis por categoría, Análisis detallado y Reporte por categoría), "Reportes por Categoría" es el informe final más completo con posibilidad de exportación a word y PDF',
    ],
    color: '#F44336',
  },
};

const processFlow = [
  { key: 'project', position: 0 },
  { key: 'teams', position: 1 },
  { key: 'invite', position: 2 },
  { key: 'questionnaire', position: 3 },
  { key: 'reports', position: 4 },
];

export default function GuidesDiagram() {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleStepClick = (stepKey: string) => {
    setSelectedStep(stepKey);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedStep(null);
  };

  const getNextStep = (currentKey: string) => {
    const currentIndex = processFlow.findIndex(step => step.key === currentKey);
    return currentIndex < processFlow.length - 1 ? processFlow[currentIndex + 1].key : null;
  };

  const getPrevStep = (currentKey: string) => {
    const currentIndex = processFlow.findIndex(step => step.key === currentKey);
    return currentIndex > 0 ? processFlow[currentIndex - 1].key : null;
  };

  const navigateToStep = (stepKey: string) => {
    setSelectedStep(stepKey);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, margin: '0 auto' }}>
      <Fade in timeout={800}>
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: `linear(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              mb: 1,
            }}
          >
            Flujo del Proceso - Diagrama
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
            Visualice el proceso completo y acceda a los detalles paso a paso de cada fase
          </Typography>

          {/* Diagrama de flujo horizontal */}
          <Card elevation={2} sx={{ mb: 4, p: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
              Flujo de Trabajo del Sistema
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              {processFlow.map((flowItem, index) => {
                const step = stepsData[flowItem.key as keyof typeof stepsData];
                return (
                  <Box key={flowItem.key} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    {/* Paso del diagrama */}
                    <Card
                      elevation={selectedStep === flowItem.key ? 8 : 2}
                      onClick={() => handleStepClick(flowItem.key)}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        flex: 1,
                        border: `2px solid ${step.color}30`,
                        backgroundColor: selectedStep === flowItem.key ? `${step.color}10` : 'background.paper',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          elevation: 4,
                          backgroundColor: `${step.color}15`,
                        },
                        minHeight: 140,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '50%',
                          backgroundColor: step.color,
                          color: 'white',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {step.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 1 }}>
                        {step.title}
                      </Typography>
                      <Chip
                        label={`Paso ${index + 1}`}
                        size="small"
                        sx={{
                          backgroundColor: step.color,
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Card>

                    {/* Flecha conectora (excepto último elemento) */}
                    {index < processFlow.length - 1 && (
                      <Box sx={{ mx: isMobile ? 0 : 2, my: isMobile ? 1 : 0 }}>
                        <ArrowRightAlt
                          sx={{
                            fontSize: 40,
                            color: 'text.secondary',
                            transform: isMobile ? 'rotate(90deg)' : 'none',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Card>

          {/* Vista de detalles en stepper vertical */}
          <Card elevation={2} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Detalles Paso a Paso
              </Typography>

              <Stepper orientation="vertical">
                {processFlow.map(flowItem => {
                  const step = stepsData[flowItem.key as keyof typeof stepsData];
                  return (
                    <Step key={flowItem.key} expanded sx={{ '& .MuiStepLabel-root': { cursor: 'pointer' } }}>
                      <StepLabel
                        onClick={() => handleStepClick(flowItem.key)}
                        icon={
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: step.color,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {step.icon}
                          </Box>
                        }
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            {step.title}
                          </Typography>
                          <IconButton size="small" onClick={() => handleStepClick(flowItem.key)}>
                            <ZoomIn fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {step.desc}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Box sx={{ pl: 2 }}>
                          <List dense>
                            {step.steps.map((s, i) => (
                              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                                <Box
                                  sx={{
                                    minWidth: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: step.color,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    mr: 2,
                                    mt: 0.25,
                                  }}
                                >
                                  {i + 1}
                                </Box>
                                <Typography variant="body2" sx={{ lineHeight: 1.4, flex: 1 }}>
                                  {s}
                                </Typography>
                              </Box>
                            ))}
                          </List>
                        </Box>
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            </CardContent>
          </Card>

          {/* Dialog de detalle */}
          <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${theme.palette.divider}`,
                pb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {selectedStep && (
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: stepsData[selectedStep as keyof typeof stepsData].color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stepsData[selectedStep as keyof typeof stepsData].icon}
                  </Box>
                )}
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {selectedStep ? stepsData[selectedStep as keyof typeof stepsData].title : ''}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDetail}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
              {selectedStep && (
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {stepsData[selectedStep as keyof typeof stepsData].desc}
                  </Typography>

                  <Stepper orientation="vertical">
                    {stepsData[selectedStep as keyof typeof stepsData].steps.map((step, index) => (
                      <Step key={index} active>
                        <StepLabel>
                          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                            Paso {index + 1}
                          </Typography>
                        </StepLabel>
                        <StepContent>
                          <Typography variant="body2" sx={{ pl: 2, lineHeight: 1.6 }}>
                            {step}
                          </Typography>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
              )}
            </DialogContent>

            <DialogActions
              sx={{
                p: 3,
                borderTop: `1px solid ${theme.palette.divider}`,
                justifyContent: 'space-between',
              }}
            >
              <Box>
                {selectedStep && getPrevStep(selectedStep) && (
                  <Button
                    onClick={() => navigateToStep(getPrevStep(selectedStep)!)}
                    startIcon={<ArrowRightAlt sx={{ transform: 'rotate(180deg)' }} />}
                  >
                    Anterior: {stepsData[getPrevStep(selectedStep)! as keyof typeof stepsData].title}
                  </Button>
                )}
              </Box>

              <Box>
                {selectedStep && getNextStep(selectedStep) && (
                  <Button variant="contained" onClick={() => navigateToStep(getNextStep(selectedStep)!)} endIcon={<ArrowRightAlt />}>
                    Siguiente: {stepsData[getNextStep(selectedStep)! as keyof typeof stepsData].title}
                  </Button>
                )}
                <Button onClick={handleCloseDetail} sx={{ ml: 1 }}>
                  Cerrar
                </Button>
              </Box>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Box>
  );
}
