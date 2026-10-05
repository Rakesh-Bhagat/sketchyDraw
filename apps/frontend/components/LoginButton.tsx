import React from 'react'

interface buttonProps{
    onclick: () => void;
    text: string
}
const LoginButton = ({ onclick , text}: buttonProps) => {
  return (
    <button onClick={onclick} className='cursor-pointer text-sm px-4 py-2 bg-white text-black rounded-lg font-medium hover:opacity-90 transition-opacity'>{text}</button>
  )
}

export default LoginButton
