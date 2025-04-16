import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Stack,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { userUtils } from '../utils/userUtils';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 400,
  margin: '0 auto',
  marginTop: theme.spacing(8),
}));

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  userType: Yup.string().required('Please select a user type'),
});

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      userType: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError(null);
        const { success, user, message } = await userUtils.login(values.email, values.password);

        if (!success) {
          throw new Error(message);
        }

        // Handle successful login
        const dashboard = user?.userType === 'recruiter'
          ? '/recruiter/dashboard'
          : '/candidate/dashboard';
        navigate(dashboard);
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
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          gutterBottom
        >
          Sign in to continue to your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <FormControl>
              <RadioGroup
                row
                name="userType"
                value={formik.values.userType}
                onChange={formik.handleChange}
              >
                <FormControlLabel
                  value="candidate"
                  control={<Radio />}
                  label="Candidate"
                />
                <FormControlLabel
                  value="recruiter"
                  control={<Radio />}
                  label="Recruiter"
                />
              </RadioGroup>
              {formik.touched.userType && formik.errors.userType && (
                <Typography color="error" variant="caption">
                  {formik.errors.userType}
                </Typography>
              )}
            </FormControl>

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
              to="/register"
              style={{ color: 'inherit', textDecoration: 'underline' }}
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