import { createTheme, Theme } from '@mui/material/styles';
import { blueGrey } from '@mui/material/colors';

var theme: Theme;

if (import.meta.env.VITE_PRIMARY_COLOR) {
  theme = createTheme({
    palette: {
      primary: {
        main: import.meta.env.VITE_PRIMARY_COLOR,
      },
    }
  })
}
else {
  theme = createTheme({palette: {primary: blueGrey}});
}

export { theme };