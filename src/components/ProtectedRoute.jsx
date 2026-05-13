import React from 'react';
import { Navigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAppStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
