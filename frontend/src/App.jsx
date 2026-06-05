import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Udhaar from './pages/Udhaar';
import Staff from './pages/Staff';
import AiChat from './pages/AiChat';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
      } />
      <Route path="/products" element={
        <PrivateRoute><Layout><Products /></Layout></PrivateRoute>
      } />
      <Route path="/sales" element={
        <PrivateRoute><Layout><Sales /></Layout></PrivateRoute>
      } />
      <Route path="/udhaar" element={
        <PrivateRoute><Layout><Udhaar /></Layout></PrivateRoute>
      } />
      <Route path="/staff" element={
        <PrivateRoute><Layout><Staff /></Layout></PrivateRoute>
      } />
      <Route path="/ai-chat" element={
        <PrivateRoute><Layout><AiChat /></Layout></PrivateRoute>
      } />
    </Routes>
  );
}

export default App;