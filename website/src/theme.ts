import { createTheme, Theme } from '@mui/material/styles';
import { blueGrey } from '@mui/material/colors';

var theme: Theme;

theme = createTheme({
  colorSchemes: {
    dark: {
      palette: {
        background: {
          default: '#222',
        },
        notice: {
          background: '#e60000',
          border: '#ffe6e6',
        },
      },
    },
    light: {
      palette: {
        primary: blueGrey,
        background: {
          paper: '#ecf0f1',
        },
        notice: {
          background: '#ffe6e6',
          border: '#e60000',
        },
      },
    },
  },
});


if (import.meta.env.VITE_PRIMARY_COLOR) {
  theme.colorSchemes.dark.palette.primary = {main: import.meta.env.VITE_PRIMARY_COLOR};
  theme.colorSchemes.light.palette.primary = {main: import.meta.env.VITE_PRIMARY_COLOR};
}

export { theme };
