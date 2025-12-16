/**
 * 設定画面エントリーポイント
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Options } from './Options';
import './styles/options.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Options />
    </StrictMode>
  );
}
