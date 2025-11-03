import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
const root = document.getElementById('root') as HTMLElement

interface IAppProps {
  id: number
}

const App:React.FC<IAppProps> = ({id}) => {
  const {isLoading, data} = useQuery (["post"], async () => {
    const datos = (await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)).json()
    return datos
  })

  if (isLoading) return <p>Está cargando</p>

  return <div>{JSON.stringify(data)}</div>
}

const queryClient = new QueryClient()

ReactDOM.createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <App id={10} />
  </QueryClientProvider>
)
