import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscription from './pages/Subscription';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices/create" element={<CreateInvoice />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

