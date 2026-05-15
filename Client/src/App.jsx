import {Routes, Route} from 'react-router-dom'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/home' element={<h1>Hello World! from Co-Mind Client</h1>} />
      </Routes>
    </div>
  )
}

export default App