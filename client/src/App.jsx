import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Jobs pages (Day 3)
import Jobs from './pages/jobs/Jobs';
import JobDetail from './pages/jobs/JobDetail';

// Employer pages (Day 4)
import EmployerDashboard from './pages/employer/EmployerDashboard';

// Seeker pages (Day 5)
import SeekerApplications from './pages/seeker/SeekerApplications';
import SeekerProfile from './pages/seeker/SeekerProfile';

const Home = () => <Navigate to="/jobs" replace />;

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Navbar />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />

          {/* Employer only */}
          <Route element={<ProtectedRoute role="employer" />}>
            <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          </Route>

          {/* Seeker only */}
          <Route element={<ProtectedRoute role="seeker" />}>
            <Route path="/seeker/applications" element={<SeekerApplications />} />
            <Route path="/seeker/profile" element={<SeekerProfile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
