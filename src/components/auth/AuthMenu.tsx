import { ChevronDown, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AuthMenuProps {
  /** `onDark` matches the configuration builder header. */
  tone?: 'onDark' | 'onLight';
}

const AuthMenu = ({ tone = 'onLight' }: AuthMenuProps) => {
  const auth = useAuth();

  if (!auth.ready || !auth.env.KEYCLOAK_URL) return null;

  const signIn = async () => {
    try {
      await auth.login();
    } catch (error) {
      console.error(error);
      toast.error('Sign-in is unavailable right now');
    }
  };

  const icon = (
    <User className="h-4 w-4 box-content rounded-full bg-white/15 p-1 text-white/80" />
  );

  if (!auth.authenticated) {
    if (tone === 'onDark') {
      return (
        <button
          type="button"
          onClick={() => { void signIn(); }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/90 hover:text-[#fbab18] transition-colors"
        >
          {icon}
          Login
        </button>
      );
    }
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => { void signIn(); }}>
        <User className="h-4 w-4 mr-2" />
        Login
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {tone === 'onDark' ? (
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/90 hover:text-[#fbab18] transition-colors"
          >
            {icon}
            {auth.user?.name ?? 'Account'}
            <ChevronDown className="h-3 w-3 text-white/60" />
          </button>
        ) : (
          <Button type="button" variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            {auth.user?.name ?? 'Account'}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => { void auth.accountManagement(); }}>
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { void auth.logout(); }}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthMenu;
