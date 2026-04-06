import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Dummydata from './Component/Dummydata.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Dummydata/>
  </StrictMode>,
)
