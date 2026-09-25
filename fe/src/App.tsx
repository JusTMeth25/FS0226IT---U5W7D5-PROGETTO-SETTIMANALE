import { useState, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import Accedi from '@/pages/Accedi'
import Admin from '@/pages/Admin'
import AutoDettaglio from '@/pages/AutoDettaglio'
import Avvisi from '@/pages/Avvisi'
import Catalogo from '@/pages/Catalogo'
import Disattiva from '@/pages/Disattiva'
import Gara from '@/pages/Gara'
import Home from '@/pages/Home'
import { Cookie, Privacy } from '@/pages/Legale'
import NonTrovata from '@/pages/NonTrovata'
import Preferiti from '@/pages/Preferiti'
import Profilo from '@/pages/Profilo'

/**
 * Pagine riservate. E' solo comodita' per l'interfaccia: la vera protezione
 * sta nel backend, che risponde 401/403 a prescindere da cosa mostra il FE.
 */
function Riservata({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { utente, pronto } = useAuth()
  // Il percorso si fissa al primo render: durante l'animazione di uscita la
  // pagina viene ridisegnata con il nuovo URL e il ritorno punterebbe a /accedi.
  const [da] = useState(useLocation().pathname)
  if (!pronto) return <div className="min-h-dvh" />
  if (!utente) return <Navigate to={`/accedi?da=${encodeURIComponent(da)}`} replace />
  if (admin && utente.ruolo !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/catalogo', element: <Catalogo /> },
      { path: '/auto/:id', element: <AutoDettaglio /> },
      { path: '/gara', element: <Gara /> },
      { path: '/accedi', element: <Accedi /> },
      { path: '/avvisi/disattiva', element: <Disattiva /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/cookie', element: <Cookie /> },
      { path: '/preferiti', element: <Riservata><Preferiti /></Riservata> },
      { path: '/avvisi', element: <Riservata><Avvisi /></Riservata> },
      { path: '/profilo', element: <Riservata><Profilo /></Riservata> },
      { path: '/admin', element: <Riservata admin><Admin /></Riservata> },
      { path: '*', element: <NonTrovata /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
