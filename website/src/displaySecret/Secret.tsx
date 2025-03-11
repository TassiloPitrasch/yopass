import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Typography } from '@mui/material';
import { useCopyToClipboard } from 'react-use';
import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

const RenderSecret = ({ secret, notice }: { readonly secret: string; readonly notice: string }) => {
  const { t } = useTranslation();
  const [copy, copyToClipboard] = useCopyToClipboard();
  const [showQr, setShowQr] = useState(false);

  return (
    <div>
      <Typography variant="h4">{t('secret.titleMessage')}</Typography>
      <Button
        color={copy.error ? 'secondary' : 'primary'}
        onClick={() => copyToClipboard(secret)}
      >
        <FontAwesomeIcon icon={faCopy} /> {t('secret.buttonCopy')}
      </Button>
      <Typography
        id="pre"
        data-test-id="preformatted-text-secret"
        sx={{
          backgroundColor: '#ecf0f1',
          padding: '15px',
          border: '1px solid #cccccc',
          display: 'block',
          fontSize: '1rem',
          borderRadius: '4px',
          wordWrap: 'break-word',
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace, monospace', // https://github.com/necolas/normalize.css/issues/519#issuecomment-197131966
        }}
      >
        {secret}
      </Typography>
	  <Button
	  	onClick={() => setShowQr(!showQr)}
	  >{(showQr ? t('secret.hideQrCode') : t('secret.showQrCode'))}</Button>
      <Box sx={{ display:(showQr ? "flex" : "none"), justifyContent:"center", alignItems:"center", margin:5 }}>
        <QRCode
          size={512}
          style={{ height: "auto" }}
          value={secret}
        />
      </Box>
      <Typography
        id="notice"
        data-test-id="preformatted-text-message"
        sx={{
          backgroundColor: '#ffe6e6',
          margin: '10px',
          padding: '15px',
          border: '2px solid #e60000',
          display: 'block',
          fontSize: '1rem',
          borderRadius: '4px',
          wordWrap: 'break-word',
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace, monospace', // see comment above
        }}
      >
        {notice}
      </Typography>
    </div>
  );
};

const DownloadSecret = ({
  secret,
  fileName,
  notice
}: {
  readonly secret: string;
  readonly fileName: string;
  readonly notice: string;
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    saveAs(
      new Blob([secret], {
        type: 'application/octet-stream',
      }),
      fileName,
    );
  }, [fileName, secret]);


  return (
    <div>
      <Typography variant="h4">{t('secret.titleFile')}</Typography>
      <Typography
        id="notice"
        data-test-id="preformatted-text-message"
        sx={{
          backgroundColor: '#ffe6e6',
          margin: '10px',
          padding: '15px',
          border: '2px solid #e60000',
          display: 'block',
          fontSize: '1rem',
          borderRadius: '4px',
          wordWrap: 'break-word',
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace, monospace', // see comment above
        }}
      >
        {notice}
      </Typography>
    </div>
  );
};

const Secret = ({
  secret,
  fileName,
  ttl,
  oneTime,
}: {
  readonly secret: string;
  readonly fileName?: string;
  readonly ttl: number;
  readonly oneTime: boolean;
}) => {
  const { t } = useTranslation();
  if (! oneTime) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const DateTimeFormat = Intl.DateTimeFormat.supportedLocalesOf([i18n.language], {localeMatcher: "lookup"}) ? i18n.language : "en-US";

    var expiryDate = new Date();
    try {
      
      if (ttl < 0) {
        throw RangeError;
      }
      else {
        expiryDate.setMilliseconds(ttl / 1000000);
      }

      var formattedExpiryDate = new Intl.DateTimeFormat(DateTimeFormat, {
        dateStyle: 'full',
        timeStyle: 'long',
        timeZone: timeZone,
      }).format(expiryDate);
      var notice = t('secret.expiresOn', {formattedExpiryDate: formattedExpiryDate});;
    }
    catch(RangeError) {
      var notice = t('secret.expireUnkown');
    }
  }
  else {
    var notice = t('secret.oneTime');
  }
  if (fileName) {
    return <DownloadSecret fileName={fileName} secret={secret} notice={notice}/>;
  }

  return <RenderSecret secret={secret} notice={notice}/>;
};

export default Secret;
