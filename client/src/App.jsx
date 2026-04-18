import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AssessmentProvider } from './context/AssessmentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import JobApplyPage from './pages/JobApplyPage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';
import CodingTestPage from './pages/CodingTestPage';
import SystemCheckPage from './pages/SystemCheckPage';
import CandidateProfile from './pages/CandidateProfile';
import CandidateSupport from './pages/CandidateSupport';
import CandidatePractice from './pages/CandidatePractice';
import AdminLiveMonitor from './pages/AdminLiveMonitor';
import VoiceInterviewPage from './pages/VoiceInterviewPage';
import QuestionBankPage from './pages/QuestionBankPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import AdminSessionsPage from './pages/AdminSessionsPage';
// import { AdminSettings } from './pages/PlaceholderPages'; // No longer needed

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} replace />;
  }

  return children ? children : <Outlet />;
}

function AuthenticatedLayout() {
  return (
    <AssessmentProvider>
      <AppLayout />
    </AssessmentProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute role="candidate"><AuthenticatedLayout /></ProtectedRoute>}>
        <Route path="/candidate" element={<CandidateDashboard />} />
        <Route path="/check" element={<SystemCheckPage />} />
        <Route path="/apply/:jobId" element={<JobApplyPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/coding" element={<CodingTestPage />} />
        <Route path="/candidate/practice" element={<CandidatePractice />} />
        <Route path="/candidate/profile" element={<CandidateProfile />} />
        <Route path="/candidate/support" element={<CandidateSupport />} />
        <Route path="/voice-interview" element={<VoiceInterviewPage />} />
      </Route>

      <Route element={<ProtectedRoute role="admin"><AuthenticatedLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/live" element={<AdminLiveMonitor />} />
        <Route path="/admin/questions" element={<QuestionBankPage />} />
        <Route path="/admin/sessions" element={<AdminSessionsPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
