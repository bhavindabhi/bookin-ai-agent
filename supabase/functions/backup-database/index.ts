import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Starting database backup...");
    
    // Backup all tables
    const backupData: any = {
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    // Backup user_settings
    const { data: settings } = await supabase.from('user_settings').select('*');
    backupData.tables.user_settings = settings;
    
    // Backup prompts
    const { data: prompts } = await supabase.from('prompts').select('*');
    backupData.tables.prompts = prompts;
    
    // Backup profiles
    const { data: profiles } = await supabase.from('profiles').select('*');
    backupData.tables.profiles = profiles;
    
    // Backup user_roles
    const { data: roles } = await supabase.from('user_roles').select('*');
    backupData.tables.user_roles = roles;
    
    // Backup licenses
    const { data: licenses } = await supabase.from('licenses').select('*');
    backupData.tables.licenses = licenses;
    
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupSize = (backupJson.length / 1024).toFixed(2);
    
    console.log(`Backup created: ${backupSize} KB`);
    
    // Get admin email from profiles
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('is_admin', true)
      .single();
    
    if (!adminProfile?.email) {
      throw new Error("Admin email not found");
    }
    
    // Send backup via email using Resend API
    const emailPayload = {
      from: 'BookingAI Backup <onboarding@resend.dev>',
      to: [adminProfile.email],
      subject: `BookingAI Database Backup - ${new Date().toLocaleDateString()}`,
      html: `
        <h1>Database Backup Completed</h1>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Backup Size:</strong> ${backupSize} KB</p>
        <p><strong>Tables Backed Up:</strong></p>
        <ul>
          <li>user_settings (${backupData.tables.user_settings?.length || 0} records)</li>
          <li>prompts (${backupData.tables.prompts?.length || 0} records)</li>
          <li>profiles (${backupData.tables.profiles?.length || 0} records)</li>
          <li>user_roles (${backupData.tables.user_roles?.length || 0} records)</li>
          <li>licenses (${backupData.tables.licenses?.length || 0} records)</li>
        </ul>
        <p>The backup data is attached to this email as a JSON file.</p>
        <p><strong>Security Note:</strong> Store this backup securely. It contains sensitive data.</p>
      `,
      attachments: [
        {
          filename: `backup-${new Date().toISOString().split('T')[0]}.json`,
          content: btoa(backupJson),
        },
      ],
    };

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send backup email: ${errorText}`);
    }
    
    console.log("Backup email sent successfully to:", adminProfile.email);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Backup completed and sent',
        backupSize: `${backupSize} KB`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Backup error:', error);
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