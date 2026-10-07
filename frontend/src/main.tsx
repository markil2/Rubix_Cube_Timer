import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/archivo/standard.css'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/global.css'
import { App } from './App'
import { SolvesProvider } from './data/SolvesProvider'
import { DeviceProvider } from './input/DeviceProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DeviceProvider>
        <SolvesProvider>
          <App />
        </SolvesProvider>
      </DeviceProvider>
    </BrowserRouter>
  </StrictMode>,
)
