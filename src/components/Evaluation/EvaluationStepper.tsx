import { Stepper, Step, StepLabel, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface EvaluationStepperProps {
  activeStep: number;
  steps: string[];
}

export function EvaluationStepper({ activeStep, steps }: EvaluationStepperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <Stepper
      activeStep={activeStep}
      sx={{
        mt: 3,
        '& .MuiStepLabel-root .Mui-completed': { color: 'white' },
        '& .MuiStepLabel-root .Mui-active': { color: theme.palette.warning.main },
        '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.5)' },
      }}
      orientation={isMobile ? 'vertical' : 'horizontal'}
    >
      {steps.map(label => (
        <Step key={label}>
          <StepLabel>
            <Typography color="white" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
              {label}
            </Typography>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
