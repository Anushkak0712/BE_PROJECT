import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 600,
  margin: '0 auto',
  marginTop: theme.spacing(8),
}));

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    }),
    onSubmit: async (values) => {
      try {
        const response = await authAPI.requestPasswordReset(values.email);
        if (response.success) {
          setStatus({
            type: 'success',
            message: 'Password reset instructions have been sent to your email. Please check your inbox.',
          });
          // Store the email in sessionStorage for the reset page
          sessionStorage.setItem('resetEmail', values.email);
          formik.resetForm();
        } else {
          setStatus({
            type: 'error',
            message: response.message || 'Failed to request password reset.',
          });
        }
      } catch (error: any) {
        setStatus({
          type: 'error',
          message: error.message || 'Failed to request password reset.',
        });
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <StyledPaper elevation={3}>
        <Typography variant="h4" align="center" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Enter your email address and we'll send you instructions to reset your password.
        </Typography>

        {status.message && (
          <Alert severity={status.type || 'info'} sx={{ mb: 3 }}>
            {status.message}
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

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={formik.isSubmitting}
            >
              Send Reset Instructions
            </Button>

            <Box textAlign="center">
              <Button
                color="primary"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </Box>
          </Stack>
        </form>
      </StyledPaper>
    </Container>
  );
};

export default ForgotPassword; 