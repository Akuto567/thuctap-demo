import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/main.css'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6ee7b7',
      light: '#a7f3d0',
      dark: '#34d399',
      contrastText: '#0f1117'
    },
    secondary: {
      main: '#a78bfa',
      light: '#c4b5fd',
      dark: '#7c3aed'
    },
    background: {
      default: '#0f1117',
      paper: '#1a1d27'
    },
    error: { main: '#f87171' },
    warning: { main: '#fbbf24' },
    success: { main: '#34d399' }
  },
  typography: {
    fontFamily: '"DM Sans", "Inter", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }
      }
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 }
      }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
