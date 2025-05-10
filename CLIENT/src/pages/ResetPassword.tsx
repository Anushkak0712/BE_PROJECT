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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '../api/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 600,
  margin: '0 auto',
  marginTop: theme.spacing(8),
}));

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values) => {
      if (!token) {
        setStatus({
          type: 'error',
          message: 'Reset token is missing. Please request a new password reset.',
        });
        return;
      }

      try {
        const response = await authAPI.resetPassword(token, values.password);
        if (response.success) {
          setStatus({
            type: 'success',
            message: 'Password has been reset successfully. You can now login with your new password.',
          });
          // Clear the stored email
          sessionStorage.removeItem('resetEmail');
          // Redirect to login page after successful reset
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus({
            type: 'error',
            message: response.message || 'Failed to reset password.',
          });
        }
      } catch (error: any) {
        setStatus({
          type: 'error',
          message: error.message || 'Failed to reset password.',
        });
      }
    },
  });

  if (!token) {
    return (
      <Container maxWidth="sm">
        <StyledPaper elevation={3}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Invalid or missing reset token. Please request a new password reset.
          </Alert>
          <Box textAlign="center" mt={2}>
            <Button
              color="primary"
              onClick={() => navigate('/forgot-password')}
            >
              Go to Forgot Password
            </Button>
          </Box>
        </StyledPaper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <StyledPaper elevation={3}>
        <Typography variant="h4" align="center" gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Please enter your new password.
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
              id="password"
              name="password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              variant="outlined"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.confirmPassword &&
                Boolean(formik.errors.confirmPassword)
              }
              helperText={
                formik.touched.confirmPassword && formik.errors.confirmPassword
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={formik.isSubmitting}
            >
              Reset Password
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

export default ResetPassword; 