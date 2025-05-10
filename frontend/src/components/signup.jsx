import axios from 'axios';
import React, { useState } from 'react'

const Signup = () => {

    const [formData, setFormData] = useState({
        username : "",
        email : "",
        password : ""
    });

    function handleChange(e){
        const {name,value} = e.target;
        setFormData((preData) => ({...preData, [name] : value}))
    }

    async function handleSubmit(){
        
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/signup`,formData,{validateStatus:false});    // validateStatus:false - makes sure for non 200 response, it doesn't throw error, as custom response is to be shown
            alert(res.data.message);
            
        } catch (error) {
            console.error(error);
            alert("Error signing Up!")
        }
    }

  return (
    <div
    className='border border-gray-500 h-80 w-full rounded-lg flex flex-col items-center justify-between p-4 '>
        <input
        name="username"
        value={formData.username} 
        onChange={handleChange}
        className='w-full h-12 px-4 py-2 placeholder:text-gray-500 border border-gray-400 rounded-lg' type="text" placeholder='username...' />
        <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        className='w-full h-12 px-4 py-2 placeholder:text-gray-500 border border-gray-400 rounded-lg' type="text" placeholder='email...' />
        <input
        name="password"
        value={formData.password} 
        onChange={handleChange}
        className='w-full h-12 px-4 py-2 placeholder:text-gray-500 border border-gray-400 rounded-lg' type="password" placeholder='password...' />
        <button 
        onClick={handleSubmit}
        className='w-full h-12 px-4 py-2 bg-gradient-to-br from-purple-500 to-orange-500 text-white font-semibold placeholder:text-gray-500 border border-gray-400 rounded-lg'>Submit</button>
        <p className='text-sm '>Already registered? <span className='text-blue-500 hover:underline cursor-pointer'>login</span></p>
    </div>
  )
}

export default Signup