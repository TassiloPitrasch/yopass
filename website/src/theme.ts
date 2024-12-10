import { createTheme } from '@mui/material/styles';
import { blueGrey } from '@mui/material/colors';

let theme;

if (process.env.PRIMARY_COLOR) {
  theme = createTheme({
    palette: {
      primary: {
        main: process.env.PRIMARY_COLOR,
      },
    }
  })
}
else {
  theme = createTheme({palette: {primary: blueGrey}});
}

export { theme };