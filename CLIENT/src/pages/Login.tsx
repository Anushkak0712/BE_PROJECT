import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Link,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 400,
  margin: '0 auto',
  marginTop: theme.spacing(8),
}));

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');

  // Test API connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/jobs');
        const data = await response.json();
        setApiStatus('Backend connection successful!');
        console.log('API Response:', data);
      } catch (err) {
        setApiStatus('Failed to connect to backend. Make sure the server is running.');
        console.error('API Error:', err);
      }
    };

    testConnection();
  }, []);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        const response = await login(values.email, values.password);
        console.log('Login response in component:', response);
        
        // Get the intended destination or default to appropriate dashboard
        const from = (location.state as any)?.from?.pathname;
        if (from) {
          navigate(from, { replace: true });
        } else {
          // Get user type from localStorage
          const userType = localStorage.getItem('userType');
          console.log('User type from localStorage:', userType);
          
          // Redirect to appropriate dashboard based on user type
          const dashboardPath = userType === 'recruiter' 
            ? '/recruiter/dashboard' 
            : '/candidate/dashboard';
          console.log('Navigating to:', dashboardPath);
          navigate(dashboardPath, { replace: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <StyledPaper elevation={3}>
        <Typography variant="h4" align="center" gutterBottom>
          Welcome Back
        </Typography>
        
        {/* Display API connection status */}
        {apiStatus && (
          <Alert severity={apiStatus.includes('successful') ? 'success' : 'error'} sx={{ mb: 2 }}>
            {apiStatus}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              variant="outlined"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              variant="outlined"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              Sign In
            </Button>
          </Stack>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/register')}
            >
              Sign up here
            </Link>
          </Typography>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default Login; 