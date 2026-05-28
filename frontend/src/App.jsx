import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './styles/GlobalStyles.css';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppearanceProvider, useAppearance } from './contexts/AppearanceContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import DemandeAcces from './pages/DemandeAcces';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import RecteurDashboard from './pages/dashboards/RecteurDashboard';
import DirecteurDashboard from './pages/dashboards/DirecteurDashboard';
import EnseignantDashboard from './pages/dashboards/EnseignantDashboard';
import EnseignantGestionEtudiants from './pages/EnseignantGestionEtudiants';
import EnseignantClasses from './pages/EnseignantClasses';
import EnseignantNotes from './pages/EnseignantNotes';
import EnseignantPlanning from './pages/EnseignantPlanning';
import EnseignantUniversite from './pages/EnseignantUniversite';
import EnseignantAbsences from './pages/EnseignantAbsences';
import EnseignantHistorique from './pages/EnseignantHistorique';
import EtudiantDashboard from './pages/dashboards/EtudiantDashboard';
import EtudiantMesCours from './pages/EtudiantMesCours';
import EtudiantMesNotes from './pages/EtudiantMesNotes';
import EtudiantObjectifs from './pages/EtudiantObjectifs';
import EtudiantEtablissement from './pages/EtudiantEtablissement';
import EtudiantAbsences from './pages/EtudiantAbsences';
import UserManagement from './pages/UserManagement';
import GestionDemandesAcces from './pages/GestionDemandesAcces';
import ArchivedUsers from './pages/ArchivedUsers';
import AuditHistory from './pages/AuditHistory';
import GestionEtablissements from './pages/GestionEtablissements';
import DetailEtablissement from './pages/DetailEtablissement';
import AjouterEtablissement from './pages/AjouterEtablissement';
import EtablissementsArchives from './pages/EtablissementsArchives';
import DemandeAccesSuccess from './pages/DemandeAccesSuccess';
import RecteurUserManagement from './pages/RecteurUserManagement';
import RecteurEtablissements from './pages/RecteurEtablissements';
import RecteurEtablissementsArchives from './pages/RecteurEtablissementsArchives';
import DirecteurUserManagement from './pages/DirecteurUserManagement';
import DirecteurDepartements from './pages/DirecteurDepartements';
import DetailDepartement from './pages/DetailDepartement';
import EtudiantsRisqueAdmin from './pages/EtudiantsRisqueAdmin';
import EtudiantsRisqueRecteur from './pages/EtudiantsRisqueRecteur';
import EtudiantsRisqueDirecteur from './pages/EtudiantsRisqueDirecteur';
import AnalyticsAdmin from './pages/AnalyticsAdmin';
import RapportsAdmin from './pages/RapportsAdmin';
import RapportImpression from './pages/RapportImpression';
import Settings from './pages/Settings';

// Composant pour rediriger vers le bon dashboard selon le rôle
const DashboardRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role?.toLowerCase() || 'admin';
  return <Navigate to={`/dashboard/${role}`} replace />;
};

function AppRoutes() {
  const { theme } = useAppearance();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
      <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/demande-acces" element={<DemandeAcces />} />
            <Route path="/demande-acces/success" element={<DemandeAccesSuccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Page rapport impression — standalone, sans sidebar pour impression propre */}
            <Route path="/rapport/impression" element={<RapportImpression />} />

            {/* Protected Routes - Dashboard */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardRedirect />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users/:userType" element={<UserManagement />} />
              <Route path="admin/archived-users" element={<ArchivedUsers />} />
              <Route path="admin/audit-history" element={<AuditHistory />} />
              <Route path="admin/demandes-acces" element={<GestionDemandesAcces />} />
              <Route path="admin/etablissements" element={<GestionEtablissements />} />
              <Route path="admin/etablissements/archives" element={<EtablissementsArchives />} />
              <Route path="admin/etablissements/ajouter" element={<AjouterEtablissement />} />
              <Route path="admin/etablissements/modifier/:id" element={<AjouterEtablissement />} />
              <Route path="admin/etablissements/:id" element={<DetailEtablissement />} />
              <Route path="recteur" element={<RecteurDashboard />} />
              <Route path="recteur/users" element={<RecteurUserManagement />} />
              <Route path="recteur/etablissements" element={<RecteurEtablissements />} />
              <Route path="recteur/etablissements/archives" element={<RecteurEtablissementsArchives />} />
              <Route path="recteur/etablissements/:id" element={<DetailEtablissement />} />
              <Route path="recteur/etudiants-risque" element={<EtudiantsRisqueRecteur />} />
              <Route path="admin/etudiants-risque" element={<EtudiantsRisqueAdmin />} />
              <Route path="admin/analytics" element={<AnalyticsAdmin />} />
              <Route path="admin/rapports" element={<RapportsAdmin />} />
              <Route path="admin/departements/:id" element={<DetailDepartement />} />
              <Route path="recteur/departements/:id" element={<DetailDepartement />} />
              <Route path="directeur" element={<DirecteurDashboard />} />
              <Route path="directeur/users" element={<DirecteurUserManagement />} />
              <Route path="directeur/departements" element={<DirecteurDepartements />} />
              <Route path="directeur/departements/:id" element={<DetailDepartement />} />
              <Route path="directeur/etudiants-risque" element={<EtudiantsRisqueDirecteur />} />
              <Route path="enseignant" element={<EnseignantDashboard />} />
              <Route path="enseignant/etudiants" element={<EnseignantGestionEtudiants />} />
              <Route path="enseignant/classes" element={<EnseignantClasses />} />
              <Route path="enseignant/notes" element={<EnseignantNotes />} />
              <Route path="enseignant/planning" element={<EnseignantPlanning />} />
              <Route path="enseignant/universite" element={<EnseignantUniversite />} />
              <Route path="enseignant/absences" element={<EnseignantAbsences />} />
              <Route path="enseignant/historique" element={<EnseignantHistorique />} />
              <Route path="etudiant" element={<EtudiantDashboard />} />
              <Route path="etudiant/cours" element={<EtudiantMesCours />} />
              <Route path="etudiant/notes" element={<EtudiantMesNotes />} />
              <Route path="etudiant/objectifs" element={<EtudiantObjectifs />} />
              <Route path="etudiant/etablissement" element={<EtudiantEtablissement />} />
              <Route path="etudiant/absences" element={<EtudiantAbsences />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AppearanceProvider>
      <AppRoutes />
    </AppearanceProvider>
  );
}

export default App;
