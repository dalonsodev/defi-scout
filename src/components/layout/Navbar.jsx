import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <header className="navbar bg-base-100 shadow px-0 sm:px-2 md:px-2">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">Defi Scout</Link>
      </div>
      <div className="flex-none">
        <Link to="/" className="btn btn-ghost">Pools</Link>
        <Link to="/watchlist" className="btn btn-ghost">Watchlist</Link>
      </div>
    </header>
  );
}