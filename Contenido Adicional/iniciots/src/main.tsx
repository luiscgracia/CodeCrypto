/*
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
*/
import { memo, useCallback, useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
interface IRegistro {
  id: string
  nombre: string
}

var root = document.getElementById("root") as HTMLElement

interface IItemProps {
  item: IRegistro
  deleteRegistro: (id:string) => void
}

const Item: React.FC<IItemProps> = memo(({item, deleteRegistro}) => {
  useEffect(() => {
    console.log("item", item)
  })

  return <li>{item.id} {item.nombre} <button onClick={() => deleteRegistro(item.id)}>Delete</button></li>
})

interface IListaProps {
  registros: IRegistro[]
  deleteRegistro: (id:string) => void
}

const Lista: React.FC<IListaProps> = memo(({deleteRegistro, registros}) => {
  useEffect(() => {
    console.log("lista")
  })

  return <ul>
    {
      registros.map ((item: IRegistro, index: number) =>
        <Item key = {item.id} deleteRegistro={deleteRegistro} item={item} ></Item>
      )
    }
  </ul>
})

const valoresIniciales: IRegistro[] = [
  { id: "1", nombre: "producto1" },
  { id: "2", nombre: "producto2" },
  { id: "3", nombre: "producto3" },
  { id: "4", nombre: "producto4" },
  { id: "5", nombre: "producto5" },
]

const App = () => {
  const [texto, setTexto] = useState("")
  const [productos, setProductos] = useState<IRegistro[]>(valoresIniciales)
  useEffect(() => {
    console.log("App")
  })

  const addRegistro = () => {
    const nuevo: IRegistro = {
      id: new Date().getTime().toString(),
      nombre: texto
    }
    setProductos ([...productos, nuevo])
  }

  const deleteRegistro = useCallback((id:string) => {
    setProductos(productos.filter(item => item.id != id))
  },[productos])

  return <div>
    <input type="text" value={texto} onChange={(e) => setTexto(e.target.value)}></input>
    <button onClick={() => addRegistro()}>ADD</button>
    <Lista registros={productos} deleteRegistro={deleteRegistro}/></div>
}

ReactDOM.createRoot(root).render(
  <App />
)