import React, { useEffect, useState } from 'react'
import axios from "axios";

const Chatpage = () => {

    const [chats, setchats] = useState([]);

    async function fetchChats() {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/messages`)
        setchats(res.data);
        
    }

    useEffect(() => {
        fetchChats();
    },[])


  return (
    <div>
        <h2>Chats : </h2>
        <div>
            {chats.map((chat) => (<div key={chat.id}><span>{chat.sender} :  </span><span> {chat.message}</span></div>))}
        </div>
    </div>
  )
}

export default Chatpage