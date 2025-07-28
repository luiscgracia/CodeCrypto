import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import {Homey} from './componentes/Homex'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homey></Homey>}>
          <Route path="/home" element={<h2>home principal</h2>} />
          <Route path="/productos" element={<h2>productos</h2>} />
          <Route path="/clientes" element={<h2>clientes</h2>} />
          <Route path="*" element={<h2>RUTA NO VÁLIDA</h2>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
