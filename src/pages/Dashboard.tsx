import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Package, Phone, Settings, LogOut, Users, ShoppingBag } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      {/* Header */}
      <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Hospitrade AI — Dashboard</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/voice")}>
            <Phone className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Launch Alex</h3>
            <p className="text-sm text-muted-foreground">Start a voice conversation with your Hospitrade AI agent</p>
            <Button className="mt-4 w-full bg-gradient-to-r from-primary to-secondary text-white">
              Open Voice Agent
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <ShoppingBag className="h-10 w-10 text-secondary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Recent Inquiries</h3>
            <p className="text-sm text-muted-foreground">View and manage trade inquiries submitted by Alex</p>
            <Button variant="outline" className="mt-4 w-full">
              View Inquiries
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Call Logs</h3>
            <p className="text-sm text-muted-foreground">Review all customer conversations and AI call transcripts</p>
            <Button variant="outline" className="mt-4 w-full">
              View Logs
            </Button>
          </Card>
        </div>

        <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              A
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Alex is ready to serve your customers</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Your Hospitrade AI sales agent is configured and online. Customers can talk to Alex
                via the voice widget on your website, or you can share the direct link below.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/voice")} className="bg-gradient-to-r from-primary to-secondary text-white">
                  <Phone className="mr-2 h-4 w-4" />
                  Test Alex Now
                </Button>
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/voice');
                  toast({ title: "Link copied!", description: "Share this link with your customers." });
                }}>
                  Copy Customer Link
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
