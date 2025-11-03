import ReactDOM from 'react-dom/client'
import {BrowserRouter, Routes, Route, Outlet, Link} from 'react-router-dom'
import React from 'react'
import '../public/estilos.css';

const root = document.getElementById('root') as HTMLElement

const Layout = () => {
  return <div className="my-div">
    <table className='header'>
      <tr>
        <td className='col1'>
          <Link to="contacto">Contacto</Link>
         </td>
        <td className='col2'>
          <Link to="quienes">Quienes&nbsp;Somos</Link>
        </td>
        <td className='col3'>
          <Link to="servicios">Servicios</Link>
        </td>
      </tr>
    </table>
    <Outlet />
  </div>
}

const Servicios = () => {
  return <div>
    <table className='body'>
      <tr><td><p>Servicios de la empresa</p></td></tr>
      <tr>
        <td className='col1'>
          <Link to="servmuni">Municipio</Link>
        </td>
        <td className='col2'>
          <Link to="servciudad">Ciudad</Link>
        </td>
        <td className='col3'>
          <Link to="servpais">Pais</Link>
        </td>
      </tr>
      <Outlet />
</table>
  </div>
}

const App = () => {
  return <BrowserRouter>
    <Routes>
      <Route path = "/" element={<Layout />}>
        <Route path="contacto" element="contactooooo" />
        <Route path="quienes" element="quienesqqqq" />
        <Route path="servicios" element={<Servicios />}>
          <Route index element="Servicio por defecto" />
          <Route path="servmuni" element="Municipal" />
          <Route path="servciudad" element="Citadino" />
          <Route path="servpais" element="Todo el país" />
        </Route>
        <Route path="*" element="La ruta no existe - 404" />
      </Route>
    </Routes>
    </BrowserRouter>
}

ReactDOM.createRoot(root).render(<App />)