import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './components/theme-provider'
import { SkillQuestProvider } from './context/SkillQuestContext'
import "./index.css"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <SkillQuestProvider>
        <BrowserRouter>
          <App />
          <ToastContainer position="bottom-right" />

        </BrowserRouter>
      </SkillQuestProvider>
    </ThemeProvider>
  </StrictMode>,
)
