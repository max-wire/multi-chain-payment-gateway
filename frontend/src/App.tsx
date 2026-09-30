import { BrowserRouter, Route, Routes } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import CreatePaymentPage from "./pages/CreatePaymentPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import InvoicesPage from "./pages/InvoicesPage";
import PaymentPage from "./pages/PaymentPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/create-payment" element={<CreatePaymentPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/pay/:paymentId" element={<PaymentPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
