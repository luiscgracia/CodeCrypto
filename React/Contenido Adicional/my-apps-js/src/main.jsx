import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import {Homey} from './componentes/Homex'
import {Listac} from './componentes/Listax'
import {Txx} from './componentes/Txc'
import {Fproducto} from './componentes/Productox'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client = {queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homey></Homey>}>
            <Route index element={<h2>Inicio</h2>}></Route>
            <Route path="/productos" element={<Fproducto />}></Route>
            <Route path="/clientes" element={<h2>clientes</h2>}></Route>
            <Route path="/lista" element={<Listac />}></Route>
            <Route path="/tx" element={<Txx />}></Route>
            <Route path="*" element={<h2>RUTA NO VÁLIDA</h2>}></Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
