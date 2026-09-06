import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Phone, Clock, Globe, Shield, Star, CalendarCheck, Sparkles } from "lucide-react";

const SERVICES = [
  { icon: "🦷", name: "General Check-up", desc: "Routine examinations & X-rays" },
  { icon: "🧹", name: "Hygiene Cleaning", desc: "Scale, polish & preventive care" },
  { icon: "😁", name: "Invisalign", desc: "Clear aligner consultations" },
  { icon: "🔩", name: "Dental Implants", desc: "Permanent tooth replacement" },
  { icon: "✨", name: "Teeth Whitening", desc: "Professional whitening treatments" },
  { icon: "🚨", name: "Emergency Care", desc: "Same-day urgent appointments" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦷</span>
            <div>
              <p className="font-bold text-foreground leading-tight">Complete Smiles</p>
              <p className="text-xs text-muted-foreground">Dental Practice, Harrow</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <a href="https://www.completesmiles.co.uk" target="_blank" rel="noreferrer"
               className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
              completesmiles.co.uk
            </a>
            <Button
              onClick={() => navigate("/voice")}
              className="bg-gradient-to-r from-primary to-secondary text-white shadow-md"
            >
              <Phone className="mr-2 h-4 w-4" />
              Book by Voice
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-20 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            AI Receptionist Demo — Powered by OpenAI Realtime
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent leading-tight">
            Book Your Dental Appointment<br />by Voice — 24/7
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Meet <strong className="text-foreground">Sofia</strong>, the AI receptionist for Complete Smiles, Harrow.
            Call any time, speak naturally, and have your appointment booked in under two minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/voice")}
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-lg"
            >
              <Phone className="mr-2 h-5 w-5" />
              Start Call with Sofia
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
              Practice Dashboard
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> Available 24/7</span>
            <span className="flex items-center gap-1"><Globe className="h-4 w-4 text-primary" /> 8 Languages</span>
            <span className="flex items-center gap-1"><Shield className="h-4 w-4 text-primary" /> GDPR Compliant</span>
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-primary" /> No Hold Music</span>
          </div>
        </div>
      </header>

      {/* Services Sofia can book */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Sofia Can Book All Our Services</h2>
          <p className="text-muted-foreground">Just tell her what you need — she'll find the right slot</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SERVICES.map((s) => (
            <Card
              key={s.name}
              onClick={() => navigate("/voice")}
              className="p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{s.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">How the Demo Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            { step: "1", icon: <Phone className="h-6 w-6" />, title: "Click & Speak", desc: "Hit 'Start Call' — Sofia answers immediately. No waiting, no hold music." },
            { step: "2", icon: <CalendarCheck className="h-6 w-6" />, title: "Sofia Collects Details", desc: "She asks for your name, contact details, preferred service and appointment time." },
            { step: "3", icon: <Sparkles className="h-6 w-6" />, title: "Appointment Confirmed", desc: "Sofia reads back every detail and submits the booking. Email confirmation follows." },
          ].map((s) => (
            <div key={s.step} className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white mx-auto shadow-md">
                {s.icon}
              </div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Languages */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 text-center">
          <Globe className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Sofia Speaks 8 Languages</h3>
          <p className="text-muted-foreground mb-4">
            Serving Harrow's diverse community — switch language any time during the call
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {["🇬🇧 English", "🇵🇹 Portuguese", "🇪🇸 Spanish", "🇫🇷 French", "🇮🇹 Italian", "🇩🇪 German", "🇵🇱 Polish", "🇷🇴 Romanian"].map(lang => (
              <span key={lang} className="px-3 py-1 bg-background rounded-full border border-border font-medium">{lang}</span>
            ))}
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <h2 className="text-3xl font-bold mb-4">Ready to See Sofia in Action?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            This is a live demo — speak with Sofia right now and experience the future of dental receptions.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/voice")}
            className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 text-lg px-10 py-6 shadow-lg"
          >
            <Phone className="mr-2 h-5 w-5" />
            Call Sofia Now — It's Free
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>
          Complete Smiles Dental Practice, Harrow |{" "}
          <a href="https://www.completesmiles.co.uk" target="_blank" rel="noreferrer" className="hover:text-foreground underline underline-offset-2">
            completesmiles.co.uk
          </a>{" "}
          | AI Demo by <span className="text-primary font-medium">Dograh Voice AI</span>
        </p>
      </footer>
    </div>
  );
};

export default Index;
