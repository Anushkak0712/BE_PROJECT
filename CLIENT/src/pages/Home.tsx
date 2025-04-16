import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
} from '@mui/material';
import {
  VideoCall,
  Speed,
  Assessment,
  People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
  color: theme.palette.common.white,
  padding: theme.spacing(15, 0),
  textAlign: 'center',
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  padding: theme.spacing(2),
  borderRadius: '50%',
  marginBottom: theme.spacing(2),
}));

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <VideoCall fontSize="large" />,
      title: 'Asynchronous Interviews',
      description:
        'Record your interview responses at your convenience. No scheduling conflicts or timezone issues.',
    },
    {
      icon: <Speed fontSize="large" />,
      title: 'Efficient Process',
      description:
        'Streamlined recruitment process that saves time for both candidates and recruiters.',
    },
    {
      icon: <Assessment fontSize="large" />,
      title: 'Fair Assessment',
      description:
        'Standardized evaluation process ensures all candidates are assessed equally.',
    },
    {
      icon: <People fontSize="large" />,
      title: 'Global Talent Pool',
      description:
        'Connect with candidates and opportunities worldwide without geographical constraints.',
    },
  ];

  return (
    <Box>
      <HeroSection>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            Transform Your Hiring Process
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4 }}>
            Experience the future of recruitment with our asynchronous video
            interview platform
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              color="secondary"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ color: 'white', borderColor: 'white' }}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </HeroSection>

      <Container sx={{ py: 8 }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Why Choose Us?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard elevation={3}>
                <IconWrapper>
                  {feature.icon}
                </IconWrapper>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" gutterBottom>
            Ready to Transform Your Recruitment?
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="text.secondary"
            paragraph
            sx={{ mb: 4 }}
          >
            Join thousands of companies that have already modernized their hiring
            process
          </Typography>
          <Box textAlign="center">
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 