import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Search, Shield, ShieldOff } from "lucide-react";

interface UserRow {
  user_id: string;
  email: string;
  full_name: string;
  roles: string[];
}

const UsersTab = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_all_users_for_admin");
    if (error) {
      toast.error("Failed to load users");
      console.error(error);
    } else {
      setUsers((data as unknown as UserRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    setToggling(userId);
    const { error } = await supabase.rpc("admin_set_user_role", {
      _target_user_id: userId,
      _role: "admin",
      _action: currentlyAdmin ? "revoke" : "grant",
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(currentlyAdmin ? "Admin access revoked" : "Admin access granted");
      await fetchUsers();
    }
    setToggling(null);
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading users...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          {search ? "No users match your search." : "No users found."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => {
            const isAdmin = u.roles.includes("admin");
            return (
              <div
                key={u.user_id}
                className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {u.full_name || "Unnamed"}
                    </span>
                    {isAdmin && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-1">
                        <Shield size={10} /> Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {isAdmin ? "Admin" : "User"}
                  </span>
                  <Switch
                    checked={isAdmin}
                    disabled={toggling === u.user_id}
                    onCheckedChange={() => toggleAdmin(u.user_id, isAdmin)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UsersTab;
