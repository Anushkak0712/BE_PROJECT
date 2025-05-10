import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/candidate/Dashboard';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import VideoInterview from './pages/candidate/VideoInterview';
import { Container } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import JobPosting from './pages/recruiter/JobPosting';
import JobApplications from './pages/recruiter/JobApplications';
import JobApplication from './pages/candidate/JobApplication';


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedUserTypes?: string[] }> = ({
  children,
  allowedUserTypes
}) => {
  const { isAuthenticated, user } = useAuth();

  console.log('PrivateRoute - User:', user);
  console.log('PrivateRoute - Allowed Types:', allowedUserTypes);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  // Get user type from localStorage if not in context
  const userType = user?.user_type || localStorage.getItem('userType');
  console.log('PrivateRoute - User Type:', userType);

  if (allowedUserTypes && userType && !allowedUserTypes.includes(userType)) {
    console.log('PrivateRoute - Access Denied: User type not allowed');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/interview/:id" element={<VideoInterview />} />

              {/* Recruiter Routes */}
              <Route
                path="/recruiter/job-posting"
                element={
                  <PrivateRoute allowedUserTypes={['recruiter']}>
                    <JobPosting />
                  </PrivateRoute>
                }
              />
              <Route
                path="/recruiter/jobs/:jobId/applications"
                element={
                  <PrivateRoute allowedUserTypes={['recruiter']}>
                    <JobApplications />
                  </PrivateRoute>
                }
              />

              {/* Candidate Routes */}
              <Route
                path="/candidate/jobs/:jobId/apply"
                element={
                  <PrivateRoute allowedUserTypes={['candidate']}>
                    <JobApplication />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Container>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 