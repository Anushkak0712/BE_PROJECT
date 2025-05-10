# Recruitment Portal

A modern recruitment platform that facilitates asynchronous video interviews between candidates and recruiters. This platform streamlines the hiring process by allowing candidates to record their interview responses at their convenience while providing recruiters with an efficient way to review and evaluate candidates.

## Features

- **User Types**:
  - Candidates can record and submit video interviews
  - Recruiters can review submissions and manage positions
  
- **Key Functionalities**:
  - Asynchronous video interviews
  - User authentication and role-based access
  - Dashboard for both candidates and recruiters
  - Interview status tracking
  - Professional and intuitive UI

## Tech Stack

- React 18
- TypeScript
- Material-UI (MUI) for UI components
- React Router for navigation
- Formik & Yup for form handling and validation
- React Webcam for video recording
- Styled Components for custom styling

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd recruitment-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your backend API URL:
   ```
   REACT_APP_API_URL=your_backend_api_url
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## Project Structure

```
recruitment-portal/
├── src/
│   ├── components/
│   │   └── common/
│   │       └── Navbar.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── candidate/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── VideoInterview.tsx
│   │   │   └── recruiter/
│   │   │       └── Dashboard.tsx
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── README.md
```

## Usage

1. **For Candidates**:
   - Register as a candidate
   - View available interview requests
   - Record and submit video interviews
   - Track interview status

2. **For Recruiters**:
   - Register as a recruiter
   - Create new positions
   - Review candidate submissions
   - Provide feedback and manage applications

## Development

- Use `npm run build` to create a production build
- Use `npm test` to run tests
- Follow the TypeScript and ESLint configurations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com
Project Link: [https://github.com/yourusername/recruitment-portal](https://github.com/yourusername/recruitment-portal) 