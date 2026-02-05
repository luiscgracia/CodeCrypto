import {Outlet, Link} from 'react-router-dom'
import { Header } from './Header'

export function Homey() {
  return <div>
    <Header></Header>
    <Outlet></Outlet>
  </div>
}