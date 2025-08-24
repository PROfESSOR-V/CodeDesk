import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Verifying...</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we verify your account.
        </p>
      </div>
    </div>
  );
}
