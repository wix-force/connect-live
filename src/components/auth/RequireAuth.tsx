import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchProfile, setInitialized } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isInitialized, isLoading } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      if (authService.isAuthenticated()) {
        dispatch(fetchProfile());
      } else {
        dispatch(setInitialized());
      }
    }
  }, [isInitialized, isLoading, dispatch]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function RedirectIfAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isInitialized } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isInitialized) {
      if (authService.isAuthenticated()) {
        dispatch(fetchProfile());
      } else {
        dispatch(setInitialized());
      }
    }
  }, [isInitialized, dispatch]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
