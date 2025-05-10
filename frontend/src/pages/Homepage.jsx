import React, { useState } from 'react'
import Signin from '../components/signin'
import Signup from '../components/signup'

const Homepage = () => {

    const [currentTab, setCurrentTab] = useState("signin")

    return (
        <div className='w-full h-screen md:flex relative '>
            <div className="hero-section h-full w-3/5 relative flex justify-center items-center">
                <img className='w-full h-full object-cover absolute top-0 left-0 z-[-10]' src="/chat-bg.png" alt="" />
                <div className="overlay bg-black/30 backdrop-blur-xs absolute top-0 left-0 w-full h-full z-[-5]"></div>
                <div className="logo p-2 absolute top-0 left-0 text-3xl font-black text-transparent bg-gradient-to-br from-purple-500 to-orange-500 bg-clip-text ml-6 mt-10">
                    chitChat
                </div>

                <div className='text-white font-black text-7xl'>Join. <br />Chat. <br />Collaborate. <br />Repeat.</div>

            </div>

            <div className="auth-section h-full w-2/5 p-4 py-8 flex flex-col justify-center items-center gap-4">
                <h2 className='text-xl font-semibold'>Login/Register to start chatting...</h2>
                <div className="tabs border border-orange-500 rounded-lg h-12 w-full flex gap-2 p-1">
                    <div className={`${currentTab == "signin" ? "bg-gradient-to-br from-purple-500 to-orange-500 text-white" : ""} h-full w-1/2 rounded-lg font-semibold flex items-center justify-center duration-400 cursor-pointer`} onClick={() => setCurrentTab("signin")}>Login</div>
                    <div className={`${currentTab == "signup" ? "bg-gradient-to-br from-purple-500 to-orange-500 text-white" : ""} h-full w-1/2 rounded-lg font-semibold flex items-center justify-center duration-400 cursor-pointer`} onClick={() => setCurrentTab("signup")}>Register</div>
                </div>

                {
                    currentTab == "signin"
                        ? <Signin />
                        : <Signup />
                }
            </div>
        </div>
    )
}

export default Homepage