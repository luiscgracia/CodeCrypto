import {useMutation} from 'react-query'

export function Txx() {
//  const mutation = useMutation(() => {
//    console.log("Ejecuté la función")
//    console.log(JSON.stringify(mutation))
//  })

const {mutate, isLoading, isError} = useMutation (() => {
  console.log("Ejecute la función")
})

const {mutate:m1, isLoading:isL2, isError:isE2} = useMutation (() => {
  console.log("Ejecute la función")
})

const funcion3 = useMutation (() => {
  console.log("Ejecute la función 3")
})

//return <div>
//  <button onClick={() => mutation.mutate()}>LLamar</button>
//</div>

return <div>
    <button onClick={() => mutate()}>LLamar</button>
    <button onClick={() => funcion3.mutate()}>LLamar 3</button>
</div>
}