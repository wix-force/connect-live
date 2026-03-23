import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, clearError } from '@/store/slices/authSlice';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector(s => s.auth);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setValidationErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(clearError());

    const result = await dispatch(registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
    }));

    if (registerUser.fulfilled.match(result)) {
      setSuccess(true);
      toast.success('Account created successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      toast.error(result.payload as string || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MeetFlow</span>
          </Link>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <CheckCircle2 className="w-16 h-16 text-meet-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
                <p className="text-muted-foreground">Redirecting to dashboard...</p>
              </motion.div>
            ) : (
              <motion.div key="form">
                <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
                <p className="text-muted-foreground mb-8">Join MeetFlow and start connecting</p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {[
                    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
                  ].map(f => (
                    <div key={f.key} className="space-y-2">
                      <Label htmlFor={f.key}>{f.label}</Label>
                      <Input
                        id={f.key}
                        type={f.type}
                        placeholder={f.placeholder}
                        value={(form as any)[f.key]}
                        onChange={set(f.key)}
                        className={validationErrors[f.key] ? 'border-destructive' : ''}
                        aria-invalid={!!validationErrors[f.key]}
                      />
                      {validationErrors[f.key] && <p className="text-sm text-destructive">{validationErrors[f.key]}</p>}
                    </div>
                  ))}

                  {['password', 'confirm'].map(k => (
                    <div key={k} className="space-y-2">
                      <Label htmlFor={k}>{k === 'password' ? 'Password' : 'Confirm Password'}</Label>
                      <div className="relative">
                        <Input
                          id={k}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={(form as any)[k]}
                          onChange={set(k)}
                          className={validationErrors[k] ? 'border-destructive pr-10' : 'pr-10'}
                          aria-invalid={!!validationErrors[k]}
                        />
                        {k === 'password' && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      {validationErrors[k] && <p className="text-sm text-destructive">{validationErrors[k]}</p>}
                    </div>
                  ))}

                  <Button type="submit" className="w-full h-11 rounded-lg mt-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
            <Video className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground mb-3">Join the team</h2>
          <p className="text-primary-foreground/70 max-w-sm">
            Create your free account and start hosting meetings in seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
