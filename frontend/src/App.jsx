
import axios from "axios"
import { useState } from "react";
import { messages } from "../../backend/data/messages";

function App() {

  const [messages, setMessages] = useState([]);

  async function fetchMessages() {

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/messages`)
      setMessages(res.data)
      console.log(res.data);
      
    } catch (error) {
      console.error("error fetching data!", error);
    }

  }
  return (
    <>
      <h2>Hello world</h2>
      <button onClick={fetchMessages}>fetchMessages</button>

      <h2>Messages : </h2>
      <div className="messages">
        {messages.map(message => (<div key={message.id}><span>{message.sender} : </span><p>{message.message}</p></div>))}
      </div>

    </>
  )
}

export default App
