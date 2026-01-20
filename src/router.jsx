import { 
   createBrowserRouter,
   createRoutesFromElements,
   Route
} from "react-router-dom"
import Pools from "./pages/Pools"
import Watchlist from "./pages/Watchlist"
import { Layout } from "./components/layout/Layout"
import { PoolDetail } from "./components/pool-detail/PoolDetail"
import { Error } from "./components/common/Error"
import { poolsLoader } from "./loaders/poolsLoader"
import { poolDetailLoader } from "./loaders/poolDetailLoader"
import { watchlistLoader } from "./loaders/watchlistLoader"

export const router = createBrowserRouter(createRoutesFromElements(
   <Route path="/" element={<Layout />}>
      <Route
         path="pools/:poolId"
         element={<PoolDetail />}
         loader={poolDetailLoader}
         errorElement={<Error />}
      />
      <Route 
         index 
         element={<Pools />}
         loader={poolsLoader}
      />
      <Route 
         path="watchlist" 
         element={<Watchlist />} 
         loader={watchlistLoader}
      />
   </Route>
))