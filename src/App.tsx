// GAGO CAMPAIGN OS — Componente principal
// Prof. Manuel GAGO FERNÁNDEZ
import { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import CampaignsPage from './pages/CampaignsPage';
import CreativesPage from './pages/CreativesPage';
import EvidencePage from './pages/EvidencePage';
import ReviewsPage from './pages/ReviewsPage';
import ResultsPage from './pages/ResultsPage';
import ImportExportPage from './pages/ImportExportPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { state } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!state.user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'products':
        return <ProductsPage />;
      case 'campaigns':
        return <CampaignsPage />;
      case 'creatives':
        return <CreativesPage />;
      case 'evidence':
        return <EvidencePage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'results':
        return <ResultsPage />;
      case 'import-export':
        return <ImportExportPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
