import { useState } from 'react';
import { MessageCircle, Mail, Lock, Store, Chrome, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Link, useNavigate } from 'react-router';
import { WhapflowLogo } from './WhapflowLogo';
import logo from 'figma:asset/9ad57f78ffcb8b81f228eb1f033e9199d9c738a7.png';

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    shopifyStoreUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Shopify store URL validation
    if (!formData.shopifyStoreUrl) {
      newErrors.shopifyStoreUrl = 'Store URL is required';
    } else if (!/^https?:\/\/.+\..+/.test(formData.shopifyStoreUrl) && !formData.shopifyStoreUrl.includes('.myshopify.com')) {
      newErrors.shopifyStoreUrl = 'Please enter a valid store URL (e.g., yourstore.myshopify.com)';
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSocialSignup = (provider: string) => {
    // Mock social signup
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
            <WhapflowLogo size="lg" variant="full" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Create your account</h2>
          <p className="text-gray-600 text-lg">Start recovering abandoned carts today</p>
        </div>

        {/* Signup Card */}
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

            {/* Shopify Store URL */}
            <div className="space-y-3">
              <Label htmlFor="shopifyStoreUrl" className="text-gray-900">Shopify Store URL</Label>
              <div className="relative group">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#25D366] transition-colors duration-200" />
                <Input
                  id="shopifyStoreUrl"
                  name="shopifyStoreUrl"
                  type="text"
                  placeholder="yourstore.myshopify.com"
                  value={formData.shopifyStoreUrl}
                  onChange={handleChange}
                  className={`pl-12 h-12 rounded-xl border-gray-200 focus:border-[#25D366] transition-colors duration-200 ${errors.shopifyStoreUrl ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.shopifyStoreUrl && (
                <p className="text-sm text-red-600 animate-slide-up">{errors.shopifyStoreUrl}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-gray-900">Password</Label>
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

            {/* Confirm Password Field */}
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-gray-900">Confirm Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#25D366] transition-colors duration-200" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-12 h-12 rounded-xl border-gray-200 focus:border-[#25D366] transition-colors duration-200 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 animate-slide-up">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 leading-relaxed">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-[#25D366] hover:text-[#20BD5A] transition-colors duration-200">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-[#25D366] hover:text-[#20BD5A] transition-colors duration-200">Privacy Policy</a>
            </p>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#20BD5A] hover:to-[#1BA84E] text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-base font-semibold mt-8 group"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
              {!isLoading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          {/* Social Signup Buttons */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              onClick={() => handleSocialSignup('shopify')}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.337 2.59c-.413.203-4.116 3.48-5.02 4.285-.19.171-.372.223-.63.223-.257 0-2.17-.07-3.022-.07-.905 0-1.029.09-1.339.508l-4.26 6.08c-.275.396-.275.542 0 .938l4.26 6.08c.31.418.434.508 1.34.508.851 0 2.764-.07 3.021-.07.258 0 .44.052.63.223.904.805 4.607 4.082 5.02 4.285.31.154.543.154.853 0l6.68-3.24c.31-.154.43-.258.43-.612V6.442c0-.354-.12-.458-.43-.612l-6.68-3.24c-.31-.154-.543-.154-.853 0z"/>
              </svg>
              Sign up with Shopify
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              onClick={() => handleSocialSignup('google')}
            >
              <Chrome className="w-5 h-5 mr-3" />
              Sign up with Google
            </Button>
          </div>
        </div>

        {/* Login Link */}
        <p className="text-center mt-8 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-[#25D366] hover:text-[#20BD5A] font-semibold transition-colors duration-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}