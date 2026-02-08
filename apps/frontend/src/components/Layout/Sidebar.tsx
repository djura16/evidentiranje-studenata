import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  QrCode,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useLogout } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { UserRole } from '@evidentiranje/shared';

const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuthContext();
  const logout = useLogout();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Korisnici', icon: Users },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/subjects', label: 'Predmeti', icon: BookOpen },
    { to: '/teacher/classes', label: 'Časovi', icon: Calendar },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/enrollments', label: 'Upis na predmete', icon: BookOpen },
    { to: '/student/subjects', label: 'Moji predmeti', icon: BookOpen },
    { to: '/student/calendar', label: 'Kalendar', icon: Calendar },
    { to: '/student/attendance', label: 'Prisustvo', icon: ClipboardList },
    { to: '/student/scan', label: 'Skeniraj QR', icon: QrCode },
  ];

  const getLinks = () => {
    if (hasRole(UserRole.ADMIN)) return adminLinks;
    if (hasRole(UserRole.TEACHER)) return teacherLinks;
    if (hasRole(UserRole.STUDENT)) return studentLinks;
    return [];
  };

  const links = getLinks();

  const NavItem = ({ to, label, icon: Icon }: any) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`
      }
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : isMobileMenuOpen ? 0 : '-100%',
        }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg lg:shadow-none flex flex-col"
      >
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Evidentiranje
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {user?.role}
            </p>
          </div>

          <nav className="space-y-2">
            {links.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Odjavi se</span>
          </button>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
