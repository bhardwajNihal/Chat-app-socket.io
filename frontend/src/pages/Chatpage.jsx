
import axios from "axios";
import { useEffect, useState } from "react";
import { CiLogout, CiSearch } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa6";
import { MdGroupAdd } from "react-icons/md";


const Chatpage = () => {

    const [user, setUser] = useState()
    const [search, setSearch] = useState("")
    const [userslist, setUserslist] = useState([]);
    const [chats, setChats] = useState([])
    const [addGroupModal, setAddGroupModal] = useState(false);
    const [groupUsers, setGroupUsers] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [iscreating, setIscreating] = useState(false);
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

    function getChatName(chatItem) {
        if (chatItem.isGroupChat) {
            return chatItem.chatName
        }
        else {
            if (chatItem.users[0].username === user.username) return chatItem.users[1].username
            else return chatItem.users[0].username
        }
    }

    async function handleCreateGroup(){
        const userIds = JSON.stringify(groupUsers.map(user => user._id))
        if(!groupName) alert("group name is required!")
        
        // api call to create a group
        setIscreating(true);
        try {
            await axios.post("http://localhost:3001/api/create-group", {
                chatName : groupName,
                users : userIds
            },{
                headers : {
                    authorization : `Bearer ${localStorage.getItem("token")}`
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

    useEffect(() => {
        console.log(groupUsers);

    }, [groupUsers])

    const navigate = useNavigate();
    return <div className="h-screen w-full" onClick={() => setUserslist("")}>

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
                        <div className="border border-orange-500 max-h-[250px] overflow-hidden overflow-y-auto w-[95%] rounded-lg absolute p-2 top-11 left-2 backdrop-blur-xl">
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
                <div className="listitems h-110 w-full border rounded-lg border-gray-300 flex flex-col gap-1 p-2 overflow-hidden overflow-y-auto">
                    <h2 className="text-lg font-semibold mx-2 mb-2">My chats</h2>
                    {chats && chats.length > 0 && chats.map((chatItem) =>
                        <div key={chatItem._id}
                            className="border border-gray-400 p-1 flex items-center gap-2 rounded-lg hover:shadow-sm hover:shadow-orange-500"
                        >
                            <div className="h-7 w-7 bg-orange-500 text-white rounded-full flex items-center justify-center">
                                {(chatItem.isGroupChat) ? <MdGroupAdd /> : getChatName(chatItem).split("")[0].toUpperCase()}
                            </div>
                            <div>
                                {/* logic to dynamically render the chatname,  */}
                                <div>{getChatName(chatItem)}</div>
                                <div className="text-sm text-gray-400">{chatItem.latestMessage ? chatItem.latestMessage : "hello there"}</div>
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
            <div className="chat ">

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
                                            const aleadyExists = prev.some(i => i._id ===item._id);
                                            if(aleadyExists){
                                                alert("user already added!");
                                                return prev;
                                            }
                                            else return [...prev,item]
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
                    {groupUsers.length>0 && 
                    groupUsers.map((item) => 
                    <span key={item._id} className="border border-orange-500 text-sm text-orange-500 rounded px-2">{item.username}
                    <span 
                    onClick={() => setGroupUsers((prev) => prev.filter(i => i._id!==item._id) )}
                    className="text-gray-400 cursor-pointer ml-2">x</span></span> )}
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