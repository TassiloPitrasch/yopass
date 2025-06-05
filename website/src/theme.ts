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
      },
    },
    light: {
      palette: {
        primary: blueGrey,
        background: {
          paper: '#ecf0f1',
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
