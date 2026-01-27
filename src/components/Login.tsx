import { useState } from 'react';
import { MessageCircle, Mail, Lock, Chrome, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Link, useNavigate } from 'react-router';
import { WhapflowLogo } from './WhapflowLogo';
import { supabase } from '../utils/supabase/client';
import { toast } from "sonner@2.0.3";

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      // Navigate to dashboard
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
      setErrors(prev => ({ ...prev, form: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'shopify') => {
    if (provider === 'shopify') {
      toast.info('Shopify login coming soon');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        }
      });

      if (error) throw error;
      
      // Note: This will redirect the user away from the page
    } catch (error: any) {
      console.error('Social login error:', error);
      toast.error(error.message || 'Failed to initiate social login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
            <WhapflowLogo size="lg" variant="full" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Welcome back</h2>
          <p className="text-gray-600 text-lg">Sign in to your account to continue</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Supabase Auth integration pending
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 hover:shadow-md transition-shadow duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-gray-900">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#25D366] transition-colors duration-200" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-12 h-12 rounded-xl border-gray-200 focus:border-[#25D366] transition-colors duration-200 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 animate-slide-up">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-900">Password</Label>
                <a href="#" className="text-sm text-[#25D366] hover:text-[#20BD5A] transition-colors duration-200">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#25D366] transition-colors duration-200" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-12 h-12 rounded-xl border-gray-200 focus:border-[#25D366] transition-colors duration-200 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 animate-slide-up">{errors.password}</p>
              )}
            </div>

            {/* Global Error */}
            {errors.form && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {errors.form}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#20BD5A] hover:to-[#1BA84E] text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-base font-semibold mt-8 group"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              onClick={() => handleSocialLogin('shopify')}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.337 2.59c-.413.203-4.116 3.48-5.02 4.285-.19.171-.372.223-.63.223-.257 0-2.17-.07-3.022-.07-.905 0-1.029.09-1.339.508l-4.26 6.08c-.275.396-.275.542 0 .938l4.26 6.08c.31.418.434.508 1.34.508.851 0 2.764-.07 3.021-.07.258 0 .44.052.63.223.904.805 4.607 4.082 5.02 4.285.31.154.543.154.853 0l6.68-3.24c.31-.154.43-.258.43-.612V6.442c0-.354-.12-.458-.43-.612l-6.68-3.24c-.31-.154-.543-.154-.853 0z"/>
              </svg>
              Sign in with Shopify
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              onClick={() => handleSocialLogin('google')}
            >
              <Chrome className="w-5 h-5 mr-3" />
              Sign in with Google
            </Button>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-8 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#25D366] hover:text-[#20BD5A] font-semibold transition-colors duration-200">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}