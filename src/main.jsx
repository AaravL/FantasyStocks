import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './index.css'
import { AuthContextProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
    <h1>Hello World!</h1>
    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>
    </>
  </StrictMode>,
)
