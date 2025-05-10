
import axios from "axios";
import { useEffect, useState } from "react";
import { CiLogout, CiSearch } from "react-icons/ci";
import { useAsyncError, useNavigate } from "react-router-dom";

const Chatpage = () => {

    const [user, setUser] = useState()
    const [search, setSearch] = useState("")
    const [userslist, setUserslist] = useState([]);
    const [chats, setChats] = useState([])
    // fetch current userdata, feed it to state
    async function fetchUser() {
        const res = await axios.get("http://localhost:3001/api/user", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        setUser(res.data.user)
    }
    useEffect(() => {
        fetchUser()
    }, [])

    // search chat functionality
    async function handleSearch() {

        const res = await axios.get(`http://localhost:3001/api/users?search=${search}`, {
            headers: {
                authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        setUserslist(res.data.users)
    }


    // fetch chats, feed it to state
    async function fetchChats() {
        const res = await axios.get("http://localhost:3001/api/chats", {
            headers: {
                authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        setChats(res.data.chats)
    }

    useEffect(() => {
        fetchChats()
    }, [])


    // function to return a existing chat, if not, create a new one and return
    async function handleChat(id) {
        console.log(id);

        try {
            const res = await axios.post("http://localhost:3001/api/chat",
                {
                    userId: id
                },
                {
                    headers: {
                        authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                }
            );
            console.log(res.data);
        } catch (error) {
            console.error("Error creating chat:", error.response?.data || error.message);
        }

    }

    const navigate = useNavigate();
    return <div className="h-screen w-full" onClick={() => setUserslist("")}>

        {/* navbar */}
        <div className="navbar h-12 w-full border-b border-gray-500 px-8 flex justify-between items-center">
            <div className="logo font-bold text-orange-600 text-2xl">chitChat</div>
            <div className="profile">
                <div className="flex items-center gap-2">
                    <div>
                        <span  >{user && user.username}</span><br />
                        <span className="text-sm text-gray-400">{user && user.email}</span>
                    </div>
                    <span className="h-6 w-6">
                        <img src="https://imgs.search.brave.com/UoEGoEVhpqRO83GQUva4-8Xw_r1PhAGKGtCKmb9aaDA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA4Lzc1LzQ1Lzk3/LzM2MF9GXzg3NTQ1/OTcxOV84aTdKM2F0/R2JzRG9SUFQwWlcw/RGpCcGdBRlZUcktB/ZS5qcGc" alt="" />
                    </span>
                </div>
            </div>
        </div>

        <div className="h-full w-full">
            {/* list of chats of the current user */}
            <div className="chatlist h-full w-1/4 border-r border-gray-500 p-3 flex flex-col gap-2">

                {/* search user */}
                <div className="searchbar h-10 w-full relative flex gap-1">
                    <input
                        value={search}
                        onClick={() => {
                            setSearch("")
                            handleSearch()
                        }}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        className="bg-gray-200 w-full h-full px-9 rounded-full" type="text" placeholder="search chats..." />
                    <button
                        onClick={handleSearch}
                        className="bg-orange-500 text-white px-3 rounded-full"><CiSearch size={"20px"} />
                    </button>
                    {/* search results */}
                    {userslist && userslist.length > 0 &&
                        <div className="border border-orange-500 max-h-[250px] overflow-hidden overflow-y-auto w-[95%] rounded-lg absolute p-2 top-11 left-2 backdrop-blur">
                            {userslist.map(item =>
                                <div
                                    key={item.id}
                                    onClick={() => handleChat(item._id)}
                                    className="border flex items-center justify-start gap-2 mb-1 rounded-lg p-1 border-gray-300 hover:shadow-sm hover:shadow-orange-500">
                                    <div className="h-7 w-7 bg-orange-500 text-white rounded-full flex items-center justify-center">
                                        {item.username.split("")[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div>{item.username}</div>
                                        <div className="text-sm text-gray-500">{item.email}</div>
                                    </div>
                                </div>)}
                        </div>}
                </div>

                {/* chats list */}
                <div className="listitems h-110 w-full border rounded-lg border-gray-300 flex flex-col gap-1 p-2">
                    {chats && chats.length > 0 && chats.map((chat) =>
                        <div key={chat._id}
                            className="border border-gray-400 p-1 flex items-center gap-2 rounded-lg hover:shadow-sm hover:shadow-orange-500"
                        >
                            <div className="h-7 w-7 bg-orange-500 text-white rounded-full flex items-center justify-center">
                                {chat.chatName.split("")[0].toUpperCase()}
                            </div>
                            <div>
                                <div>{chat.chatName}</div>
                                <div className="text-sm text-gray-400">{chat.latestMessage ? chat.latestMessage : "hello there"}</div>
                            </div>
                        </div>)}
                </div>

                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/")
                    }}
                    className="bg-orange-500 text-white py-1 w-28 flex items-center justify-center gap-1 rounded"><CiLogout />Logout</button>
            </div>

            {/* current chat */}
            <div className="chat ">

            </div>
        </div>

    </div>
}

export default Chatpage