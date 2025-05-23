import { AppBar, Toolbar, Typography, Button, Box, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const isOnUploadPage = location.pathname.includes('upload');
  const base = process.env.PUBLIC_URL || '';
  const home = base + '/#/';
  const upload = base + '/#/upload';
  const fileUpload = process.env.YOPASS_DISABLE_FILE_UPLOAD !== '1';
  // Replace home with base in first href below to force reload when clicking on logo
  return (
    <AppBar position="static" color="transparent" sx={{ marginBottom: 4 }}>
      <Toolbar>
        <Link href={home} color="inherit" underline="none">
          <Typography variant="h6" component="div">
            Yopass
            <Box
              sx={{
                verticalAlign: 'middle',
                paddingLeft: '5px',
                width: '40px',
                height: '40px',
              }}
              component="img"
              height="40"
              alt="Yopass Logo"
              src={import.meta.env.VITE_LOGO ? import.meta.env.VITE_LOGO : "yopass.svg"}
            />
          </Typography>
        </Link>
        {fileUpload && (
          <>
            <Box
              sx={{
                marginLeft: 'auto',
              }}
             >
               <Button
                 component={Link}
                 href={isOnUploadPage ? home : upload}
                 variant="contained"
                 color="primary"
               >
                 {isOnUploadPage ? t('header.buttonHome') : t('header.buttonUpload')}
               </Button>
             </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};
