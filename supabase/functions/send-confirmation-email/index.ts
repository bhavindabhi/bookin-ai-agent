import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentData {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appointmentData: AppointmentData = await req.json();
    
    console.log("Sending appointment confirmation email to:", appointmentData.email);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #0EA5E9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { background-color: #0EA5E9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed</h1>
            </div>
            <div class="content">
              <p>Dear ${appointmentData.name},</p>
              
              <p>Thank you for booking your appointment with Complete Smiles Dental Practice in Harrow. This email confirms your appointment details:</p>
              
              <div class="appointment-details">
                <div class="detail-row">
                  <span class="detail-label">Service:</span> ${appointmentData.service}
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span> ${appointmentData.date}
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span> ${appointmentData.time}
                </div>
                <div class="detail-row">
                  <span class="detail-label">Contact Number:</span> ${appointmentData.phone}
                </div>
              </div>
              
              <p><strong>Important Information:</strong></p>
              <ul>
                <li>Please arrive 10 minutes before your appointment time</li>
                <li>If you need to cancel or reschedule, please call us at least 24 hours in advance</li>
                <li>Bring your insurance card if applicable</li>
              </ul>
              
              <p>If you have any questions or need to make changes to your appointment, please don't hesitate to contact us.</p>
              
              <p>We look forward to seeing you!</p>
              
              <p>Best regards,<br>
              <strong>Complete Smiles Dental Practice</strong><br>
              Harrow</p>
            </div>
            <div class="footer">
              <p>This is an automated confirmation email. Please do not reply to this email.</p>
              <p>Complete Smiles Dental Practice, Harrow | Phone: [Your Phone Number]</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailPayload = {
      from: "Complete Smiles <onboarding@resend.dev>",
      to: [appointmentData.email],
      subject: "Appointment Confirmation - Complete Smiles Dental",
      html: emailHtml,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in send-confirmation-email function:", error);
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
