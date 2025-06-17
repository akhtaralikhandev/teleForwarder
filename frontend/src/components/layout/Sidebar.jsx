import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  BarChart3,
  Zap,
  Crown,
  Settings,
  PieChart,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/app", icon: BarChart3 },
  { name: "Channels", href: "/app/channels", icon: MessageSquare },
  { name: "Forwarding Rules", href: "/app/rules", icon: Zap },
  { name: "Analytics", href: "/app/analytics", icon: PieChart },
  { name: "Subscription", href: "/app/subscription", icon: Crown },
];

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-card border-r border-border">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-border">
          <MessageSquare className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold">TeleForward</span>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.username}</p>
              <div className="flex items-center">
                {user?.subscription_active ? (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    <Crown className="mr-1 h-3 w-3" />
                    Premium
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Free
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
