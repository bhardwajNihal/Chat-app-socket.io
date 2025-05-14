
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { CiEdit, CiLogout, CiSearch } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { FaEye, FaPlus } from "react-icons/fa6";
import { MdGroupAdd } from "react-icons/md";
import { io } from "socket.io-client"
import { LiaCheckDoubleSolid } from "react-icons/lia";


const Chatpage = () => {

    const [user, setUser] = useState()
    const [search, setSearch] = useState("")
    const [userslist, setUserslist] = useState([]);
    const [chats, setChats] = useState([])
    const [addGroupModal, setAddGroupModal] = useState(false);
    const [groupUsers, setGroupUsers] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [iscreating, setIscreating] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null)
    const [chatDetailsModal, setChatDetailsModal] = useState(false);
    const [currentChatMessages, setCurrentChatMessages] = useState([]);
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    
    // declaring global variables to persist accross rerenders
    const socketRef = useRef(null);
    const selectedChatCompareRef = useRef();

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
        fetchChats()
    }, [])

    useEffect(() => {
        // eshtablish socket connection on mount
        socketRef.current = io("http://localhost:3001")
        // emit event to join user and assign it a private socket
        socketRef.current.emit("user-join", user)

    }, [user])

    useEffect(() => {
        if(!socketRef.current) return;
        socketRef.current.emit("join-chat", selectedChat);
    },[selectedChat])

    useEffect(() => {
        selectedChatCompareRef.current = selectedChat;
    },[selectedChat])

    useEffect(() => {
        if(!socketRef.current) return;
        socketRef.current.on("message-recieved",(newmessage) => {
            console.log("new message recieved : : : : : " , newmessage);
            // console.log(selectedChatCompareRef.current);
            

            if(selectedChat._id===newmessage.chat._id) setCurrentChatMessages(prev => [...prev,newmessage])
            else{
                alert("new notification!");
            }

        })
        
        // return old listener
        return () => {
            socketRef.current.off("message-recieved")
        }
    })


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



    // function to return a existing chat, if not, create a new one and return
    async function handleChat(id) {
        // console.log(id);

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
            setSelectedChat(res.data);
        } catch (error) {
            console.error("Error creating chat:", error.response?.data || error.message);
        }

    }

    function getChatName(chatItem) {
        if (chatItem.isGroupChat) {
            return chatItem.chatName
        }
        else {
            if (chatItem.users[0].username === user.username) return chatItem.users[1].username
            else return chatItem.users[0].username
        }
    }

    async function handleCreateGroup() {
        const userIds = JSON.stringify(groupUsers.map(user => user._id))
        if (!groupName) alert("group name is required!")

        // api call to create a group
        setIscreating(true);
        try {
            await axios.post("http://localhost:3001/api/create-group", {
                chatName: groupName,
                users: userIds
            }, {
                headers: {
                    authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            setIscreating(false);
            alert('group created successfully!')
            setAddGroupModal(false);
            setGroupUsers([]);
            setGroupName("")

        } catch (error) {
            console.error("error creating group", error);
            alert(error.response.data.message)
            setIscreating(false)
        }

    }


    // fetching messages for the selected chat
    useEffect(() => {
        async function fetchMessages() {
            if (selectedChat === null) return;
            const res = await axios.get(`http://localhost:3001/api/chat/messages/${selectedChat._id}`, {
                headers: {
                    authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            setCurrentChatMessages(res.data);
        }
        fetchMessages()
    
    // 
    }, [selectedChat])

    // function to send message 
    async function handleSendMessage() {
        try {
            setIsSending(true)
            const res = await axios.post("http://localhost:3001/api/chat/message", {
                chatId: selectedChat._id,
                message: message
            }, {
                headers: {
                    authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })

            // emit message to chatroom for broadcasting to all connected user in the room
            socketRef.current.emit("send-message", res.data);

            setIsSending(false);
            setCurrentChatMessages(prev => ([...prev, res.data]));
            setMessage("");
        } catch (error) {
            alert("Error sending message !");
            console.error("Error sending message : ", error);
            setMessage("")
            setIsSending(false)
        }

    }


    useEffect(() => {
        console.log("selected chat data : ", selectedChat);
        console.log(currentChatMessages);

    }, [selectedChat, currentChatMessages])


    function formatDateTime(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0'); // dd
        const month = String(date.getMonth() + 1).padStart(2, '0'); // mm
        const hours = String(date.getHours()).padStart(2, '0'); // HH
        const minutes = String(date.getMinutes()).padStart(2, '0'); // MM

        return `${day}/${month} ${hours}:${minutes}`;
    }

    const navigate = useNavigate();
    return <div className="h-screen w-full" onClick={() => setUserslist([])}>

        {/* navbar */}
        <div className="navbar h-12 w-full border-b border-gray-500 px-8 flex justify-between items-center">
            <div className="logo font-bold text-orange-600 text-2xl">chitChat</div>

            <div className="flex items-center gap-8">
                <button
                    onClick={() => {
                        setAddGroupModal(true)
                    }}
                    className="bg-orange-500 text-white py-1 h-8 w-fit px-4 flex items-center justify-center gap-1 rounded"><FaPlus size={"15px"} /> New Group
                </button>
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
        </div>

        <div className="h-full w-full flex">
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
                        <div className="border border-orange-500 max-h-[250px] overflow-hidden overflow-y-auto w-[95%] rounded-lg absolute p-2 top-11 left-2 backdrop-blur-xl">
                            {userslist.map(item =>
                                <div
                                    key={item._id}
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
                <div className="listitems h-110 w-full border rounded-lg border-gray-300 flex flex-col gap-1 p-2 overflow-hidden overflow-y-auto">
                    <h2 className="text-lg font-semibold mx-2 mb-2">My chats</h2>
                    {chats && chats.length > 0 && chats.map((chatItem) =>
                        <div key={chatItem._id}
                            onClick={() => { setSelectedChat(chatItem) }}
                            className={`border truncate w-full overflow-hidden border-gray-400 ${(selectedChat && selectedChat._id === chatItem._id) ? "border-orange-500 bg-orange-100" : ""} p-1 flex items-center gap-2 rounded-lg hover:shadow-sm hover:shadow-orange-500`}
                        >
                            <div className="min-h-7 min-w-7 bg-orange-500 text-white rounded-full flex items-center justify-center">
                                {(chatItem.isGroupChat) ? <MdGroupAdd /> : getChatName(chatItem).split("")[0].toUpperCase()}
                            </div>
                            <div className="w-full truncate max-w-[80%]">
                                {/* logic to dynamically render the chatname,  */}
                                <div>{getChatName(chatItem)}</div>
                                <div className="text-sm text-gray-400">
                                    {chatItem.latestMessage
                                        ? <div className="text-gray-500 flex items-center gap-1">
                                            <div className="font-semibold">{chatItem.latestMessage.sender._id === user._id ? <LiaCheckDoubleSolid size={"16px"} /> : null}  </div>
                                            <div className="truncate">{chatItem.latestMessage.content}</div>
                                        </div>
                                        : null}
                                </div>
                            </div>
                        </div>)}
                </div>

                <div className="flex gap-2 w-full">
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/")
                        }}
                        className="border border-orange-500 text-orange-500 py-1 w-32 flex items-center justify-center gap-1 rounded"><CiLogout />Logout
                    </button>
                </div>
            </div>

            {/* current chat */}
            <div className="curnent-chat h-screen w-3/4">
                {selectedChat !== null
                    ? <div>
                        <div className="top border-b border-gray-400 w-full h-12 bg-orange-100 flex items-center justify-between px-8 relative">
                            <div className="chatname text-xl font-semibold">{selectedChat && getChatName(selectedChat)}</div>
                            <div className="details" onClick={() => setChatDetailsModal(true)}><FaEye size={"18px"} /></div>
                            {chatDetailsModal && <div className="chatDetailsModal bg-white p-4 min-h-56 min-w-48 shadow-lg shadow-orange-400 absolute top-10 right-5"><span className="text-xl hover:bg-gray-200 px-2 rounded absolute top-0 right-0 m-2 mt-3 cursor-pointer" onClick={() => setChatDetailsModal(false)}>x</span>
                                {selectedChat && selectedChat.isGroupChat ? <h2 className="text-lg text-orange-500 text-center mt-2 ">Group details</h2> : <h2 className="text-lg text-orange-500 text-center mt-2 ">User details</h2>}

                                {selectedChat && selectedChat.isGroupChat === false
                                    ? <div className="flex items-center justify-center flex-col">
                                        <img className="w-32 " src={(selectedChat.users[0]._id === user._id) ? selectedChat.users[1].avatar : selectedChat.users[0].avatar} alt="" />
                                        <p className="text-2xl">{(selectedChat.users[0]._id === user._id) ? selectedChat.users[1].username : selectedChat.users[0].username}</p>
                                        <p className="text-gray-500">{(selectedChat.users[0]._id === user._id) ? selectedChat.users[1].email : selectedChat.users[0].email}</p>
                                    </div>
                                    : <div>
                                        <div className="flex gap-1 h-8"><input type="text" placeholder={getChatName(selectedChat)} className="border bg-gray-100 rounded border-gray-300 p-1 px-2" /><span><CiEdit size={'32px'} className="bg-orange-500 p-1 rounded text-white" /></span></div>

                                        {selectedChat.users.map(user => <div key={user._id}>{user.username}</div>)}
                                    </div>
                                }


                            </div>}
                        </div>

                        <div className="all-messages h-[90vh]">

                            <div className="h-[90%] flex flex-col gap-1 py-2 px-4 overflow-hidden overflow-y-auto pb-8">{
                                (currentChatMessages && currentChatMessages.length > 0 &&
                                    currentChatMessages.map(message =>
                                        <div className={`flex gap-2 ${(message.sender._id === user._id) ? "justify-end pl-12 md:pl-24 lg:pl-40" : "justify-start pr-12 md:pr-24 lg:pr-40"}`}>
                                            <div className="">
                                                <div className={`flex ${(message.sender._id === user._id) ? "justify-end" : "justify-start"} items-center gap-1`}><img className="h-4 rounded-full" src={message.sender.avatar} alt="" /><span className="text-sm text-gray-500">{message.sender.username}</span></div>
                                                <div
                                                    className={`border flex justify-between gap-2 items-end text-start text-normal border-orange-500 w-fit px-4 rounded-xl ${(message.sender._id === user._id) ? "rounded-br-none border border-orange-500 bg-green-500 text-white" : "rounded-tl-none"}`}
                                                    key={message._id}>
                                                    <span className="break-all">{message.content}</span>
                                                    <span className={`text-[10px] text-nowrap mb-1 ${(message.sender._id === user._id ? "text-gray-600" : "text-gray-500")}`}>
                                                        {formatDateTime(message.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                    )
                                )
                            }</div>
                            <div className="h-[10%] p-1 px-2 flex gap-2">
                                <input type="text" placeholder="type message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="h-full px-2 w-[90%] bg-gray-200 border border-gray-400 rounded-lg" />
                                <button
                                    disabled={isSending}
                                    onClick={handleSendMessage} className="text-white bg-orange-500 hover:bg-orange-600 cursor-pointer rounded-lg w-[10%] h-full ">{isSending ? "sending..." : "send"}</button>
                            </div>

                        </div>

                    </div>
                    : <div className="h-full w-full flex items-center justify-center text-2xl text-gray-400">Select user to start chatting!</div>}
            </div>
        </div>


        {/* add group modal */}
        {addGroupModal && <div className="absolute top-0 left-0 flex items-center justify-center bg-black/40 h-screen w-full backdrop-blur-xl">
            <div className="min-h-64 w-80 rounded-lg shadow-lg shadow-orange-500 absolute  bg-white p-4 pt-8">
                <h2 className="text-lg text-orange-500 font-semibold text-center mb-4">New Group Chat</h2>
                <input
                    onChange={(e) => setGroupName(e.target.value)}
                    type="text" placeholder="group name..." className="border border-gray-400 rounded w-full h-8 mb-3 px-3  " />
                <div className="relative">
                    <input
                        value={search}
                        onClick={() => {
                            setSearch("")
                            handleSearch()
                        }}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        className="border border-gray-400 w-full h-8 px-3 rounded" type="text" placeholder="search chats..." />
                    {userslist && userslist.length > 0 &&
                        <div className="border border-orange-500 max-h-[220px] overflow-hidden overflow-y-auto w-[95%] rounded-lg absolute z-50 p-2 top-11 left-2 bg-white">
                            {userslist.map(item =>
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setGroupUsers((prev) => {
                                            const aleadyExists = prev.some(i => i._id === item._id);
                                            if (aleadyExists) {
                                                alert("user already added!");
                                                return prev;
                                            }
                                            else return [...prev, item]
                                        })

                                    }}
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


                <button className="absolute top-0 right-0 mx-3 text-xl" onClick={() => setAddGroupModal(false)}>x</button>

                <div className="users h-fit w-full mt-1 p-1 flex gap-2 flex-wrap mb-8">
                    {groupUsers.length > 0 &&
                        groupUsers.map((item) =>
                            <span key={item._id} className="border border-orange-500 text-sm text-orange-500 rounded px-2">{item.username}
                                <span
                                    onClick={() => setGroupUsers((prev) => prev.filter(i => i._id !== item._id))}
                                    className="text-gray-400 cursor-pointer ml-2">x</span></span>)}
                </div>
                <button
                    disabled={iscreating}
                    onClick={handleCreateGroup}
                    className="bg-orange-500 text-white rounded p-1 px-4 absolute right-0 bottom-0 m-2">{iscreating ? "Creating..." : "Create"}</button>
            </div>
        </div>}

    </div>
}

export default Chatpage