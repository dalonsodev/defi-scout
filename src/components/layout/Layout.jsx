import { Outlet, useNavigation } from "react-router-dom"
import Navbar from "./Navbar"

export default function Layout() {
   const navigation = useNavigation()
   const isLoading = navigation.state === "loading"

   return (
      <div className="site-wrapper max-w-5xl mx-auto">
         <Navbar />
         <main className="min-h-screen p-0 sm:px-2 md:p-6">
            {isLoading && (
               <div className="fixed top-20 right-4 z-50">
                  <span className="loading loading-spinner loading-lg"></span>
               </div>
            )}
            <Outlet />
         </main>
      </div>
   )
}