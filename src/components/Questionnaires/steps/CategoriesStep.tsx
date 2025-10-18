// ============================================================================
// PASO 2: GESTIÓN DE CATEGORÍAS
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import type { QuestionnaireFormData, QuestionCategory } from '../types';

interface CategoriesStepProps {
  values: QuestionnaireFormData;
  setFieldValue: (field: string, value: unknown) => void;
}

export function CategoriesStep({ values, setFieldValue }: CategoriesStepProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<QuestionCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  const handleToggleCategories = (enabled: boolean) => {
    setFieldValue('use_categories', enabled);
    if (!enabled) {
      // Si desactiva categorías, limpia las categorías y remueve category_id de preguntas
      setFieldValue('categories', []);
      setFieldValue(
        'questions',
        values.questions.map(q => ({ ...q, category_id: undefined }))
      );
    }
  };

  const handleOpenDialog = (category?: QuestionCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategoryDescription(category.description || '');
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setCategoryDescription('');
    }
    setDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryName.trim()) return;

    const newCategory: QuestionCategory = {
      id: editingCategory?.id || `cat_${Date.now()}`,
      name: categoryName.trim(),
      description: categoryDescription.trim() || undefined,
      order_index: editingCategory?.order_index ?? values.categories.length,
    };

    let updatedCategories;
    if (editingCategory) {
      updatedCategories = values.categories.map(cat => (cat.id === editingCategory.id ? newCategory : cat));
    } else {
      updatedCategories = [...values.categories, newCategory];
    }

    setFieldValue('categories', updatedCategories);
    setDialogOpen(false);
    setCategoryName('');
    setCategoryDescription('');
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = values.categories.filter(cat => cat.id !== categoryId);
    setFieldValue('categories', updatedCategories);

    // Remover la categoría de las preguntas que la tenían asignada
    const updatedQuestions = values.questions.map(q => (q.category_id === categoryId ? { ...q, category_id: undefined } : q));
    setFieldValue('questions', updatedQuestions);
  };

  /* TODO: Función para reordenar categorías (disponible para implementación futura de drag & drop)
  const moveCategory = (fromIndex: number, toIndex: number) => {
    const newCategories = [...values.categories];
    const [moved] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, moved);
    
    // Actualizar order_index
    const reorderedCategories = newCategories.map((cat, index) => ({
      ...cat,
      order_index: index,
    }));

    setFieldValue('categories', reorderedCategories);
  };
  */

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Categorías de Preguntas
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Las categorías te permiten organizar las preguntas en grupos temáticos. Si activas las categorías, todas las preguntas deberán tener
        una categoría asignada.
      </Alert>

      {/* Toggle para usar categorías */}
      <FormControlLabel
        control={<Switch checked={values.use_categories} onChange={e => handleToggleCategories(e.target.checked)} />}
        label="Usar categorías para organizar preguntas"
      />

      {values.use_categories && (
        <>
          {/* Botón para agregar categoría */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">Categorías ({values.categories.length})</Typography>
            <Button type="button" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Agregar Categoría
            </Button>
          </Box>

          {/* Lista de categorías */}
          {values.categories.length > 0 ? (
            <List>
              {values.categories.map((category, index) => (
                <ListItem key={category.id} divider>
                  <IconButton edge="start" sx={{ mr: 1 }}>
                    <DragIcon />
                  </IconButton>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{category.name}</Typography>
                        <Chip label={`#${index + 1}`} size="small" />
                      </Box>
                    }
                    secondary={category.description}
                  />

                  <ListItemSecondaryAction>
                    <IconButton type="button" onClick={() => handleOpenDialog(category)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton type="button" onClick={() => handleDeleteCategory(category.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="warning">Debe crear al menos una categoría para continuar</Alert>
          )}
        </>
      )}

      {/* Dialog para crear/editar categoría */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre de la Categoría *"
            value={categoryName}
            onChange={e => setCategoryName(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Ej: Comunicación, Toma de Decisiones"
          />
          <TextField
            fullWidth
            label="Descripción (Opcional)"
            multiline
            rows={3}
            value={categoryDescription}
            onChange={e => setCategoryDescription(e.target.value)}
            placeholder="Descripción de qué evalúa esta categoría..."
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSaveCategory} variant="contained" disabled={!categoryName.trim()}>
            {editingCategory ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
