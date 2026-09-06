import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Phone, Settings, LogOut, CalendarCheck, Users, Sparkles } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🦷</span>
            <span className="font-bold">Complete Smiles — Practice Dashboard</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />Settings
            </Button>
            <Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Good day!</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/voice")}>
            <Phone className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Test Sofia</h3>
            <p className="text-sm text-muted-foreground mb-4">Have a live conversation with your AI receptionist</p>
            <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white">
              Open Voice Demo
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CalendarCheck className="h-10 w-10 text-secondary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Appointments</h3>
            <p className="text-sm text-muted-foreground mb-4">View bookings captured by Sofia</p>
            <Button variant="outline" className="w-full">View Bookings</Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Call Transcripts</h3>
            <p className="text-sm text-muted-foreground mb-4">Review all AI receptionist conversations</p>
            <Button variant="outline" className="w-full">View Transcripts</Button>
          </Card>
        </div>

        <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl flex-shrink-0">😊</div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Sofia is live and ready</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your AI receptionist is online 24/7 — booking appointments, handling cancellations and answering patient queries in 8 languages.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/voice")} className="bg-gradient-to-r from-primary to-secondary text-white">
                  <Phone className="mr-2 h-4 w-4" />Test Live Demo
                </Button>
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/voice');
                  toast({ title: "Link copied!", description: "Share this demo link with the practice." });
                }}>
                  <Sparkles className="mr-2 h-4 w-4" />Copy Demo Link
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
