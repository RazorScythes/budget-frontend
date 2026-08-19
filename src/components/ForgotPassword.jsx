import React, { useState, useEffect } from 'react'

import { Link, useNavigate  } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import heroBackgroundImage from '../assets/hero-bg.jpg';

const ForgotPassword = ({ path, setUser }) => {

    const navigate  = useNavigate()
    const dispatch = useDispatch()

    const auth = useSelector((state) => state.auth)
    const user = JSON.parse(localStorage.getItem('profile'))

    const [form, setForm] = useState({
        username: '',
        password: ''
    })

    useEffect(() => {
        document.title = "Login"
        if(!user) return

        setUser(user)
        navigate(`${path}/`)
    }, [user])

    const handleSubmit = () => {
        return true
    }

    return (
        <div className="flex items-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            {
                !user &&
                <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800">
                    <div className="flex flex-col overflow-y-auto sm:flex-row">
                        <div className="h-48 sm:h-auto sm:w-1/2">
                            <img
                            aria-hidden="true"
                            className="object-cover w-full h-full dark:hidden"
                            src={heroBackgroundImage}
                            alt="Image"
                            />
                            <img
                            aria-hidden="true"
                            className="hidden object-cover w-full h-full dark:block"
                            src={heroBackgroundImage}
                            alt="Image"
                            />
                        </div>
                        <div className="flex items-center justify-center p-6 sm:p-12 sm:w-1/2">
                            <div className="w-full">
                                <h1 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">
                                    Forgot Password
                                </h1>
                                {
                                    auth.error && <span className="text-red-600 font-semibold text-sm">Email not found</span>
                                }
                                <form onSubmit={handleSubmit}>
                                    <label for="website-admin" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white mt-2">Email Address</label>
                                    <div class="flex">
                                        <span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope" viewBox="0 0 16 16">
                                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                                            </svg>
                                        </span>
                                        <input 
                                            type="email" 
                                            id="email"
                                            name="email"
                                            autoComplete="email"
                                            className="focus:outline-none rounded-none rounded-r-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                                            placeholder="Recovery Email"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="block w-full px-4 py-2 mt-4 text-sm font-medium leading-5 text-center text-white transition-colors duration-150 bg-blue-600 border border-transparent rounded-lg active:bg-blue-600 hover:bg-blue-700 focus:outline-none focus:shadow-outline-purple"
                                    >
                                        Recover Password
                                    </button>
                                </form>

                                <p className="mt-4">
                                <Link
                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                    to="/login"
                                >
                                    Return to Login page
                                </Link>
                                </p>
                            </div>
                        </div>
                    </div>  
                </div>
            }
        </div>
    )
}

export default ForgotPassword