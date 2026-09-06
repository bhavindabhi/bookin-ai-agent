import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";

interface Business {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface AppSidebarProps {
  onBusinessSelect: (businessId: string, businessName: string) => void;
}

export function AppSidebar({ onBusinessSelect }: AppSidebarProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .order("category", { ascending: true });
    
    if (data) {
      setBusinesses(data);
    }
  };

  const handleSelect = (business: Business) => {
    setSelectedId(business.id);
    onBusinessSelect(business.id, business.name);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const groupedBusinesses = businesses.reduce((acc, business) => {
    if (!acc[business.category]) {
      acc[business.category] = [];
    }
    acc[business.category].push(business);
    return acc;
  }, {} as Record<string, Business[]>);

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="p-4">
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Business Types
          </h2>
        </div>

        {Object.entries(groupedBusinesses).map(([category, businessList]) => (
          <SidebarGroup key={category}>
            <SidebarGroupLabel className="capitalize">{category}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {businessList.map((business) => (
                  <SidebarMenuItem key={business.id}>
                    <SidebarMenuButton
                      onClick={() => handleSelect(business)}
                      isActive={selectedId === business.id}
                      className="w-full"
                    >
                      <span className="text-xl mr-2">{business.icon}</span>
                      <span>{business.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => navigate("/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
