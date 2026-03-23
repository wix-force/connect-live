import { Link } from 'react-router-dom';
import { Video, Keyboard, Shield, Users, Zap, Globe, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useTheme } from '@/hooks/useSocket';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { icon: Video, title: 'HD Video Calls', desc: 'Crystal clear video with adaptive quality' },
  { icon: Shield, title: 'End-to-End Encrypted', desc: 'Your meetings are private and secure' },
  { icon: Users, title: 'Up to 100 Participants', desc: 'Host large team meetings effortlessly' },
  { icon: Zap, title: 'Instant Meetings', desc: 'Start a meeting in one click' },
  { icon: Keyboard, title: 'Keyboard Shortcuts', desc: 'Stay productive with quick controls' },
  { icon: Globe, title: 'Works Everywhere', desc: 'Desktop, tablet, and mobile ready' },
];

export default function LandingPage() {
  const [meetingCode, setMeetingCode] = useState('');
  const { toggle } = useTheme();
  const [isDark, setIsDark] = useState(false);

  const handleThemeToggle = () => {
    const theme = toggle();
    setIsDark(theme === 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 meet-glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MeetFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.h1
              custom={0}
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance"
            >
              Premium video meetings.
              <br />
              <span className="text-primary">Now free for everyone.</span>
            </motion.h1>
            <motion.p
              custom={1}
              variants={fadeUp}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Secure, high-quality video conferencing for teams of all sizes. Connect, collaborate, and create from anywhere.
            </motion.p>
            <motion.div
              custom={2}
              variants={fadeUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/meeting/new">
                <Button size="lg" className="gap-2 px-8 h-12 text-base rounded-full">
                  <Video className="w-5 h-5" />
                  New Meeting
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter a code"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="w-56 h-12 rounded-full px-5"
                  aria-label="Meeting code"
                />
                <Link to={meetingCode ? `/join/${meetingCode}` : '#'}>
                  <Button
                    variant="ghost"
                    size="lg"
                    disabled={!meetingCode}
                    className="h-12 rounded-full text-primary hover:text-primary"
                  >
                    Join
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>

          {/* Preview */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-16 rounded-2xl overflow-hidden border border-border shadow-2xl bg-meet-video-bg aspect-video flex items-center justify-center"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-6 w-full max-w-3xl">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="meet-tile aspect-video flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-meet-surface">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Everything you need to connect
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Built for modern teams with security and simplicity in mind.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">MeetFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 MeetFlow. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
