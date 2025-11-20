import React from "react"
import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"

export default function Layout() {
   return (
      <div className="site-wrapper max-w-5xl mx-auto">
         <Navbar />
         <main className="min-h-screen flex-col items-center justify-center p-0 sm:px-2 md:p-6">
            <Outlet />
         </main>
      </div>
   )
}