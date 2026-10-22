import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Portao from './Portao.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Portao />
  </StrictMode>,
)
