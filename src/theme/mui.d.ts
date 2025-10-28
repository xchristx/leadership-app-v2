declare module '@mui/material/styles' {
    interface Palette {
        supervisor: Palette['primary'];
    }
    interface PaletteOptions {
        supervisor?: PaletteOptions['primary'];
    }
}

export { };
