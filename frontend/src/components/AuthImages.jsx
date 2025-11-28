import React from 'react'

const AuthImages = () => {
  return (
      <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-radial from-[#0f0f0f] to-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {/* Subtle geometric pattern */}
          <div className="absolute top-10 left-10 w-32 h-32 border border-[#2a2a2a] rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-[#2a2a2a] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 border border-[#2a2a2a] rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        <img
          src="/logo.svg"
          alt="Veda AI"
          className="w-3/4 max-w-md animate-float relative z-10"
          style={{filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.5))'}}
        />
      </div>
  )
}

export default AuthImages
