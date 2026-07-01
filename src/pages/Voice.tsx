import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft } from "lucide-react";
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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Hospitrade AI — Alex</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Agent intro */}
        <div className="text-center mb-10 space-y-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto text-white text-3xl font-bold shadow-lg">
            A
          </div>
          <h1 className="text-2xl font-bold">Hi, I'm Alex</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Your Hospitrade AI sales assistant. I can help you find products, get trade quotes,
            check availability and submit orders — just by talking.
          </p>
        </div>

        {/* Visualiser */}
        <div className="flex justify-center mb-8">
          <VoiceVisualizer isActive={isSpeaking} />
        </div>

        {/* Voice Interface */}
        <VoiceInterface onSpeakingChange={setIsSpeaking} />

        {/* Tips */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground text-center">
          {[
            { tip: "\"I need 50 dinner plates for my restaurant — what do you have?\"" },
            { tip: "\"Can I get a quote for commercial linen in bulk?\"" },
            { tip: "\"What kitchen equipment do you stock for professional kitchens?\"" },
          ].map((t, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border italic">
              {t.tip}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Voice;
