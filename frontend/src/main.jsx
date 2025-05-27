import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './components/theme-provider'
import { SkillQuestProvider } from './context/SkillQuestContext'
import "./index.css"

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <SkillQuestProvider>
          <App />
          <ToastContainer position="bottom-right" />
        </SkillQuestProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
