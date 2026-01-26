import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

// Create a context to hold authentication-related data and methods
const AuthContext = createContext(null);

// Fetch the current user's data from the API
const getCurrentUser = async () => {
  const { data } = await apiClient.get('/api/v1/auth/me/');
  return data;
};

// Log out the user by making a POST request to the API
const logoutUser = async () => {
  await apiClient.post('/api/v1/auth/logout/');
};

// Login the user by making a POST request to the API and refetching user data
const loginUser = async (credentials) => {
  const { data } = await apiClient.post('/api/v1/auth/login/', credentials);
  return data;
};

// AuthProvider component to provide authentication-related data and methods to the app
export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient(); // React Query client for managing server state

  // Fetch the current user's data using React Query
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['currentUser'], // Unique key for caching the query
    queryFn: getCurrentUser, // Function to fetch the data
    staleTime: 5 * 60 * 1000, // Cache the data for 5 minutes
    retry: false, // Disable retries on failure
    refetchOnWindowFocus: true, 
  });

  // Function to log out the user and clear the cache
  const logout = async () => {
    try {
      await logoutUser(); // Call the API to log out the user
      queryClient.clear(); // Clear the React Query cache
      window.location.href = '/'; // Redirect to the home page
    } catch (error) {
      queryClient.clear(); // Clear the cache even if an error occurs
      window.location.href = '/'; // Redirect to the home page
    }
  };

  // Function to log in the user and refetch user data
  const login = async (credentials) => {
    try {
      await loginUser(credentials); // Call the API to log in the user
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] }); // Refetch user data
      window.location.replace(window.location.origin + '/dashboard'); // Redirect to the dashboard
    } catch (error) {
      console.error('Login failed:', error); // Log the error for debugging
      throw error; // Re-throw the error to handle it elsewhere if needed
    }
  };

  // Value to be provided to the context consumers
  const value = {
    user: isError ? null : user, // Provide the user data or null if there's an error
    isLoading, // Indicate if the user data is still loading
    isAuthenticated: !!user && !isError, // Check if the user is authenticated
    isParticipant: user?.is_participant ?? false, // Check if the user is a participant
    isAdmin: user?.is_admin ?? false, // Check if the user is an admin
    logout, // Provide the logout function
    login, // Provide the login function
  };

  // Provide the authentication context
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext); // Access the AuthContext
  if (!context) throw new Error('useAuth must be used within AuthProvider'); // Ensure the hook is used within the provider
  return context; // Return the context value
};