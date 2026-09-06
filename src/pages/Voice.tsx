import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceInterface from "@/components/VoiceInterface";
import VoiceVisualizer from "@/components/VoiceVisualizer";

const Voice = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      {/* Header */}
      <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xl">🦷</span>
            <div className="text-center">
              <p className="font-bold leading-tight text-sm">Complete Smiles — AI Receptionist</p>
              <p className="text-xs text-muted-foreground">Harrow Dental Practice</p>
            </div>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Sofia intro card */}
        <div className="text-center mb-8 space-y-3">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto text-white text-4xl shadow-xl">
              😊
            </div>
            {isSpeaking && (
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            )}
          </div>
          <h1 className="text-2xl font-bold">Hi, I'm Sofia!</h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            I'm the AI receptionist for <strong>Complete Smiles, Harrow</strong>. I can book, reschedule or
            cancel your appointment — just speak naturally and I'll take care of everything.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {["General Check-up", "Hygiene Cleaning", "Invisalign", "Implants", "Whitening", "Emergency"].map(s => (
              <span key={s} className="px-2 py-1 bg-primary/10 text-primary rounded-full">{s}</span>
            ))}
          </div>
        </div>

        {/* Visualiser */}
        <div className="flex justify-center mb-6">
          <VoiceVisualizer isActive={isSpeaking} />
        </div>

        {/* Voice interface */}
        <VoiceInterface onSpeakingChange={setIsSpeaking} />

        {/* Example phrases */}
        <div className="mt-10 space-y-3">
          <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Try saying something like…
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground text-center">
            {[
              "\"I'd like to book a check-up appointment for next week please\"",
              "\"I have tooth pain — do you have any emergency slots today?\"",
              "\"Can you tell me about your Invisalign consultations?\"",
            ].map((t, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border italic leading-relaxed">
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Practice info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-center">
          {[
            { icon: "📍", label: "Location", value: "Harrow, London" },
            { icon: "🌐", label: "Website", value: "completesmiles.co.uk" },
            { icon: "🕐", label: "AI Available", value: "24 hours / 7 days" },
          ].map((info) => (
            <div key={info.label} className="bg-card rounded-xl p-4 border border-border">
              <div className="text-2xl mb-1">{info.icon}</div>
              <div className="text-xs text-muted-foreground">{info.label}</div>
              <div className="font-medium">{info.value}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Voice;
