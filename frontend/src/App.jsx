
import { Route, Routes } from "react-router-dom"
import Homepage from "./pages/Homepage"
import Chatpage from "./pages/Chatpage"

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage/>}/>
        <Route path="/chat" element={<Chatpage/>}/>
      </Routes>
    </>
  )
}

export default App
