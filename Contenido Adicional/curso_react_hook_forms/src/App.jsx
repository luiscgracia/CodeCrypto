import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useForm } from 'react-hook-form'

function App() {
  const {register, handleSubmit, watch, getValues, setValue, formState:{errors}} = useForm();
  function onSubmit(data) {
    console.log(data)
  }

  useEffect(() => {
    console.log('Los valores actuales son: ', getValues())
  },
    [watch(getValues())]
)

useEffect(() => {
  console.log("Cambió el campo 2 !!!")
},
  [watch("campo2")]
)

const onBlur = (e) => {
  setValue("campo3", e.target.value)
}

return (
    <div className='App'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register("campo1", {onBlur: (e) => onBlur(e)})} /><br></br>
        <input {...register("campo2", {required:true})} /><br></br>
        <input {...register("campo3")} /><br></br>
        {errors.campo2 && <span>El campo 2 es requerido<br></br></span>}
        <input type="submit" />
      </form>
      {JSON.stringify(getValues())}
    </div>
  )
}

export default App
