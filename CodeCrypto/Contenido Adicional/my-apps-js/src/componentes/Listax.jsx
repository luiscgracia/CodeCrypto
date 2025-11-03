import {useQuery} from 'react-query'

export function Listac () {

  const {data, isLoading, isError} = useQuery(["query1"], () => {
    return ["juan", "pedro", "jorge"]
  })

  if (isError) {
    return <div>Error ... </div>
  }

  if (isLoading) {
    return <div>Cargando ... </div>
  }

//  return <p>{JSON.stringify(data)}</p>
  return <p>
    <ul>
      {
        data.map((item, index) =>
          <li key = {index}>{item}</li>
        )
      }
    </ul>
  </p>
}