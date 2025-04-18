import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  CheckCircle,
  Pending,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { jobAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsResponse, applicationsResponse] = await Promise.all([
          jobAPI.getJobs(),
          jobAPI.getCandidateApplications(token!)
        ]);

        if (jobsResponse.success) {
          setJobs(jobsResponse.jobs);
        }

        if (applicationsResponse.success) {
          setApplications(applicationsResponse.applications);
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <StatusChip
            icon={<CheckCircle />}
            label="Completed"
            color="success"
            size="small"
          />
        );
      case 'pending':
        return (
          <StatusChip
            icon={<Pending />}
            label="In Progress"
            color="warning"
            size="small"
          />
        );
      case 'rejected':
        return (
          <StatusChip
            icon={<Close />}
            label="Rejected"
            color="error"
            size="small"
          />
        );
      default:
        return (
          <StatusChip
            icon={<Schedule />}
            label="Not Started"
            color="default"
            size="small"
          />
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Candidate Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Available Positions
            </Typography>
            <List>
              {jobs.map((job) => (
                <React.Fragment key={job._id}>
                  <ListItem
                    secondaryAction={
                      <Button
                        variant="contained"
                        startIcon={<VideoCall />}
                        onClick={() => navigate(`/candidate/jobs/${job._id}/apply`)}
                      >
                        Apply Now
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <VideoCall />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <>
                          {job.title} at {job.company_name}
                          <StatusChip
                            label={job.job_type}
                            color="primary"
                            size="small"
                          />
                        </>
                      }
                      secondary={
                        <>
                          Location: {job.location}
                          <br />
                          Posted: {new Date(job.created_at).toLocaleDateString()}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Your Applications
            </Typography>
            <List>
              {applications.map((application) => {
                const job = jobs.find(j => j._id === application.job_id);
                return (
                  <React.Fragment key={application._id}>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <>
                            {job?.title} at {job?.company_name}
                            {getStatusChip(application.status)}
                          </>
                        }
                        secondary={
                          <>
                            Applied on: {new Date(application.created_at).toLocaleDateString()}
                            <br />
                            Status: {application.status}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CandidateDashboard; 