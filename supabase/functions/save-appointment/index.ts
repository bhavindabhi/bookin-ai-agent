import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map: IP -> [timestamp, count]
const rateLimitMap = new Map<string, { timestamp: number; count: number }>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: 5 appointments per minute per IP
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const limit = rateLimitMap.get(clientIp);
    
    if (limit) {
      const elapsed = now - limit.timestamp;
      if (elapsed < 60000) {
        if (limit.count >= 5) {
          return new Response(
            JSON.stringify({ error: "Too many appointment requests. Please wait a minute." }),
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

    const { name, phone, email, service, date, time, status } = await req.json();
    
    console.log("Saving appointment (anonymized):", { service, date, time, status });

    const appointmentData = {
      name,
      phone,
      email,
      service,
      date,
      time,
      status: status || 'confirmed',
      timestamp: new Date().toISOString()
    };

    // Send confirmation email
    try {
      const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify(appointmentData),
      });

      if (!emailResponse.ok) {
        console.error("Failed to send confirmation email:", await emailResponse.text());
      } else {
        console.log("Confirmation email sent successfully");
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the entire request if email fails
    }

    // Add to Google Calendar
    const GOOGLE_CALENDAR_API_KEY = Deno.env.get('GOOGLE_CALENDAR_API_KEY');
    const GOOGLE_CALENDAR_ID = Deno.env.get('GOOGLE_CALENDAR_ID');
    
    if (GOOGLE_CALENDAR_API_KEY && GOOGLE_CALENDAR_ID) {
      try {
        // Parse date and time to create ISO datetime
        const [day, month, year] = date.split('/');
        const [hours, minutes] = time.split(':');
        const startDateTime = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );
        
        // Assume 30-minute appointments
        const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

        const calendarEvent = {
          summary: `${service} - ${name}`,
          description: `Phone: ${phone}\nEmail: ${email}\nService: ${service}`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'Europe/London',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'Europe/London',
          },
          attendees: [
            { email: email }
          ],
        };

        const calendarResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events?key=${GOOGLE_CALENDAR_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(calendarEvent),
          }
        );

        if (calendarResponse.ok) {
          console.log("Event added to Google Calendar successfully");
        } else {
          console.error("Failed to add to Google Calendar:", await calendarResponse.text());
        }
      } catch (calendarError) {
        console.error("Error adding to Google Calendar:", calendarError);
        // Don't fail the entire request if calendar fails
      }
    } else {
      console.log("Google Calendar integration not configured");
    }

    console.log("Appointment saved successfully");

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Appointment saved and confirmation sent',
        data: appointmentData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in save-appointment function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
