import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting map: IP -> [timestamp, count]
const rateLimitMap = new Map<string, { timestamp: number; count: number }>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: 10 requests per minute per IP
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const limit = rateLimitMap.get(clientIp);
    
    if (limit) {
      const elapsed = now - limit.timestamp;
      if (elapsed < 60000) {
        if (limit.count >= 10) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please wait a minute." }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        limit.count++;
      } else {
        rateLimitMap.set(clientIp, { timestamp: now, count: 1 });
      }
    } else {
      rateLimitMap.set(clientIp, { timestamp: now, count: 1 });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful AI assistant for BookingAI Pro, an AI-powered booking system. Help users with:

1. **Setting up AI Agents**: Guide them through creating prompts, selecting voice types, and configuring their booking agent for their specific business.

2. **API Integrations**: 
   - Twilio: For phone calls and SMS (optional - they can use our default service)
   - Google Calendar: For appointment scheduling (optional)
   - OpenAI: For AI features (optional - we provide default AI)

3. **License Types**:
   - Starter ($49/month): 1 agent, basic features
   - Professional ($99/month): 3 agents, custom integrations, priority support
   - Enterprise ($199/month): Unlimited agents, API access, on-premise deployment

4. **Booking Confirmations**: Help configure email/SMS templates with placeholders like {name}, {date}, {time}

5. **Voice Selection**: Explain the different voice options (Alloy, Echo, Fable, Onyx, Nova, Shimmer)

6. **Troubleshooting**: Help with common issues like connection problems, API errors, or configuration issues

Be concise, friendly, and provide actionable steps. If they need technical support beyond your knowledge, suggest they contact support.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat-help function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
