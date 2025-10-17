// ============================================================================
// COMPONENTE TABLA REUTILIZABLE
// ============================================================================
// Tabla customizada con paginación, ordenamiento y filtros
// ============================================================================

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Skeleton,
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useState, useMemo } from 'react';

export interface Column<T = Record<string, unknown>> {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  format?: (value: unknown) => string;
}

export interface CustomTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  loading?: boolean;
  selectable?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyMessage?: string;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
}

export function CustomTable<T extends { id: string }>({
  data,
  columns,
  title,
  loading = false,
  selectable = false,
  searchable = false,
  pagination = true,
  onRowClick,
  onSelectionChange,
  emptyMessage = 'No hay datos disponibles',
  rowsPerPageOptions = [5, 10, 25],
  defaultRowsPerPage = 10,
}: CustomTableProps<T>) {
  // Estados locales
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [orderBy, setOrderBy] = useState<keyof T | ''>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Filtrado y ordenamiento
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Filtrar por búsqueda
    if (searchTerm && searchable) {
      filtered = filtered.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase())));
    }

    // Ordenar
    if (orderBy) {
      filtered.sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];

        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, orderBy, order, searchable]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage, pagination]);

  // Handlers
  const handleRequestSort = (property: keyof T) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredData.map(n => n.id);
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    } else {
      setSelected([]);
      onSelectionChange?.([]);
    }
  };

  const handleClick = (id: string) => {
    if (!selectable) return;

    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }

    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  // Loading skeleton
  if (loading) {
    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        {(title || searchable) && (
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
              {title && <Skeleton width={200} />}
            </Typography>
            {searchable && <Skeleton variant="rectangular" width={200} height={40} />}
          </Toolbar>
        )}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Skeleton width={42} height={42} />
                  </TableCell>
                )}
                {columns.map(column => (
                  <TableCell key={String(column.id)}>
                    <Skeleton width={100} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton width={42} height={42} />
                    </TableCell>
                  )}
                  {columns.map(column => (
                    <TableCell key={String(column.id)}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      {/* Toolbar */}
      {(title || searchable || selected.length > 0) && (
        <Toolbar>
          {selected.length > 0 ? (
            <Typography variant="subtitle1" component="div" sx={{ flex: '1 1 100%' }}>
              {selected.length} seleccionado(s)
            </Typography>
          ) : (
            <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
              {title}
            </Typography>
          )}

          {selected.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Acciones para elementos seleccionados */}
              <Chip
                label={`${selected.length} seleccionado(s)`}
                onDelete={() => {
                  setSelected([]);
                  onSelectionChange?.([]);
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {searchable && (
                <TextField
                  size="small"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 200 }}
                />
              )}
              <IconButton>
                <FilterIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      )}

      {/* Tabla */}
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredData.length}
                    checked={filteredData.length > 0 && selected.length === filteredData.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map(column => (
                <TableCell
                  key={String(column.id)}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0) + 1} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map(row => {
                const isItemSelected = isSelected(row.id);
                return (
                  <TableRow
                    hover
                    onClick={() => onRowClick?.(row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onClick={event => {
                            event.stopPropagation();
                            handleClick(row.id);
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map(column => {
                      const value = row[column.id];
                      return (
                        <TableCell key={String(column.id)} align={column.align}>
                          {column.render ? column.render(value, row) : column.format ? column.format(value) : String(value)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      {pagination && filteredData.length > 0 && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      )}
    </Paper>
  );
}
