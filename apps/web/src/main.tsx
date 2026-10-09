import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';

import { App } from './App';
import { CardDetailPage } from './features/catalog/CardDetailPage';
import { CatalogPage } from './features/catalog/CatalogPage';
import { PlaygroundPage } from './features/playground/PlaygroundPage';
import { SourceHealthPage } from './features/source-health/SourceHealthPage';
import { HomePage } from './HomePage';
import './styles.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'kaynaklar', element: <SourceHealthPage /> },
      { path: 'katalog', element: <CatalogPage /> },
      { path: 'katalog/:eaId', element: <CardDetailPage /> },
      { path: 'oyun-alani', element: <PlaygroundPage /> },
    ],
  },
]);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
