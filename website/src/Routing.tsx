import { Route, Routes } from 'react-router-dom';

import CreateSecret from './createSecret/CreateSecret';
import DisplaySecret from './displaySecret/DisplaySecret';
import Upload from './createSecret/Upload';

export const Routing = () => {
  const fileUpload = process.env.YOPASS_DISABLE_FILE_UPLOAD !== '1';
  const oneClickLink = process.env.YOPASS_DISABLE_ONE_CLICK_LINK !== '1';
  return (
    <Routes>
      <Route path="/" element={<CreateSecret />} />
      {fileUpload && (
        <Route path="/upload" element={<Upload />} />
      )}
      {oneClickLink && (
        <Route path="/:format/:key/:password" element={<DisplaySecret />} />
      )}
      <Route path="/:format/:key" element={<DisplaySecret />} />
    </Routes>
  );
};
