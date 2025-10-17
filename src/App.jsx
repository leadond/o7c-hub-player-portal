import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@o7c/shared';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Recruiting from './pages/Recruiting';
import Calendar from './pages/Calendar';
import Messages from './pages/Messages';
import Players from './pages/Players';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Protected routes with Player Portal access */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/recruiting" element={
              <ProtectedRoute>
                <Layout>
                  <Recruiting />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Layout>
                  <Calendar />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Layout>
                  <Messages />
                </Layout>
              </ProtectedRoute>
            } />
            {/* Parent-only routes */}
            <Route path="/players" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <Layout>
                  <Players />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;