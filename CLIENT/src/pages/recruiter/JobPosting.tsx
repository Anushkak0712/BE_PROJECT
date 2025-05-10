import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  IconButton,
  Chip,
  Alert,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { jobAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
  fontWeight: 600,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const JobPosting = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    company_name: '',
    questions: [{ question_text: '', time_limit: 60 }],
    requirements: [''],
    location: '',
    salary_range: '',
    job_type: 'Full-time',
  });

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (jobId && token) {
        try {
          setIsLoading(true);
          const response = await jobAPI.getJobById(jobId);
          if (response.success && response.job) {
            const job = response.job;
            setJobData({
              title: job.title || '',
              description: job.description || '',
              company_name: job.company_name || '',
              questions: job.questions || [{ question_text: '', time_limit: 60 }],
              requirements: job.requirements || [''],
              location: job.location || '',
              salary_range: job.salary_range || '',
              job_type: job.job_type || 'Full-time',
            });
          }
        } catch (err) {
          setErrorMessage('Failed to fetch job details');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchJobDetails();
  }, [jobId, token]);

  const handleAddQuestion = () => {
    setJobData({
      ...jobData,
      questions: [...jobData.questions, { question_text: '', time_limit: 60 }],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = jobData.questions.filter((_, i) => i !== index);
    setJobData({ ...jobData, questions: newQuestions });
  };

  const handleQuestionChange = (index: number, field: string, value: string | number) => {
    const newQuestions = [...jobData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setJobData({ ...jobData, questions: newQuestions });
  };

  const handleAddRequirement = () => {
    setJobData({
      ...jobData,
      requirements: [...jobData.requirements, ''],
    });
  };

  const handleRemoveRequirement = (index: number) => {
    const newRequirements = jobData.requirements.filter((_, i) => i !== index);
    setJobData({ ...jobData, requirements: newRequirements });
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...jobData.requirements];
    newRequirements[index] = value;
    setJobData({ ...jobData, requirements: newRequirements });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) {
        throw new Error('Not authenticated');
      }

      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Filter out empty requirements
      const filteredRequirements = jobData.requirements.filter(req => req.trim() !== '');
      
      const response = await jobAPI.createJob(token, {
        ...jobData,
        requirements: filteredRequirements,
      });

      if (response.success) {
        setSuccessMessage('Job posted successfully!');
        setTimeout(() => {
          navigate('/recruiter/dashboard');
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to post job');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to post job');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <StyledPaper elevation={3}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          {jobId ? 'Edit Job Posting' : 'Post a New Job'}
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <SectionTitle variant="h6">Basic Information</SectionTitle>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    fullWidth
                    label="Job Title"
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    fullWidth
                    label="Company Name"
                    value={jobData.company_name}
                    onChange={(e) => setJobData({ ...jobData, company_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="Job Description"
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Job Details */}
            <Grid item xs={12}>
              <SectionTitle variant="h6">Job Details</SectionTitle>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <StyledTextField
                    fullWidth
                    label="Location"
                    value={jobData.location}
                    onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Job Type</InputLabel>
                    <Select
                      value={jobData.job_type}
                      label="Job Type"
                      onChange={(e) => setJobData({ ...jobData, job_type: e.target.value })}
                    >
                      <MenuItem value="Full-time">Full-time</MenuItem>
                      <MenuItem value="Part-time">Part-time</MenuItem>
                      <MenuItem value="Contract">Contract</MenuItem>
                      <MenuItem value="Internship">Internship</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <StyledTextField
                    fullWidth
                    label="Salary Range"
                    value={jobData.salary_range}
                    onChange={(e) => setJobData({ ...jobData, salary_range: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Requirements */}
            <Grid item xs={12}>
              <SectionTitle variant="h6">Requirements</SectionTitle>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {jobData.requirements.map((req, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                    <StyledTextField
                      fullWidth
                      label={`Requirement ${index + 1}`}
                      value={req}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveRequirement(index)}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddRequirement}
                  variant="outlined"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Add Requirement
                </Button>
              </Stack>
            </Grid>

            {/* Interview Questions */}
            <Grid item xs={12}>
              <SectionTitle variant="h6">Interview Questions</SectionTitle>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={3}>
                {jobData.questions.map((question, index) => (
                  <Paper key={index} elevation={1} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <StyledTextField
                        fullWidth
                        label={`Question ${index + 1}`}
                        value={question.question_text}
                        onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                        required
                      />
                      <StyledTextField
                        label="Time Limit (seconds)"
                        type="number"
                        value={question.time_limit}
                        onChange={(e) => handleQuestionChange(index, 'time_limit', parseInt(e.target.value))}
                        sx={{ width: '150px' }}
                        required
                      />
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveQuestion(index)}
                        sx={{ mt: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddQuestion}
                  variant="outlined"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Add Question
                </Button>
              </Stack>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/recruiter/dashboard')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : jobId ? 'Update Job' : 'Post Job'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </StyledPaper>
    </Container>
  );
};

export default JobPosting; 