import React from "react"
import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"

export default function Layout() {
   return (
      <div className="site-wrapper">
         <Navbar />
         <main className="min-h-screen flex-col items-center justify-center p-6 md:p-8">
            <Outlet />
         </main>
      </div>
   )
}