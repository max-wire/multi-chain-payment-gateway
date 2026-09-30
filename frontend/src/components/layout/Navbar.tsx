import { Link } from "react-router-dom";

import ConnectWallet from "../wallet/ConnectWallet";
import NetworkStatus from "../wallet/NetworkStatus";

function Navbar() {
    return (
        <header className="border-b border-gray-200 bg-white">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
                    Multi<span className="text-indigo-600">Pay</span>
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    <Link
                        to="/"
                        className="text-sm font-medium text-gray-700 transition hover:text-indigo-600"
                    >
                        Home
                    </Link>

                    <Link
                        to="/dashboard"
                        className="text-sm font-medium text-gray-700 transition hover:text-indigo-600"
                    >
                        Dashboard
                    </Link>

                    <Link
                        to="/transactions"
                        className="text-sm font-medium text-gray-700 transition hover:text-indigo-600"
                    >
                        Transactions
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <NetworkStatus />
                    <ConnectWallet />
                </div>
            </nav>
        </header>
    );
}

export default Navbar;
