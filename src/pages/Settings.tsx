import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Key } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { HelpChatbot } from "@/components/HelpChatbot";
import { z } from "zod";

const settingsSchema = z.object({
  twilio_account_sid: z.string().regex(/^AC[a-zA-Z0-9]{32}$/, "Invalid Twilio Account SID format").or(z.literal("")),
  twilio_auth_token: z.string().min(32, "Auth token too short").or(z.literal("")),
  google_calendar_id: z.string().email("Invalid calendar ID format").or(z.literal("")),
  google_calendar_api_key: z.string().min(20, "API key too short").or(z.literal("")),
  openai_api_key: z.string().regex(/^sk-[a-zA-Z0-9-_]+$/, "Invalid OpenAI API key format").or(z.literal("")),
  confirmation_email_template: z.string().max(5000, "Email template too long"),
  confirmation_sms_template: z.string().max(160, "SMS template must be 160 characters or less"),
});

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    twilio_account_sid: "",
    twilio_auth_token: "",
    google_calendar_id: "",
    google_calendar_api_key: "",
    openai_api_key: "",
    send_confirmation_email: true,
    send_confirmation_sms: true,
    confirmation_email_template: "",
    confirmation_sms_template: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadSettings(session.user.id);
      }
    });
  }, [navigate]);

  const loadSettings = async (userId: string) => {
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      const customSettings = data.custom_settings as any || {};
      setSettings({
        twilio_account_sid: data.twilio_account_sid || "",
        twilio_auth_token: data.twilio_auth_token || "",
        google_calendar_id: data.google_calendar_id || "",
        google_calendar_api_key: data.google_calendar_api_key || "",
        openai_api_key: data.openai_api_key || "",
        send_confirmation_email: customSettings.send_confirmation_email ?? true,
        send_confirmation_sms: customSettings.send_confirmation_sms ?? true,
        confirmation_email_template: customSettings.confirmation_email_template || "",
        confirmation_sms_template: customSettings.confirmation_sms_template || "",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Validate inputs
      const validationResult = settingsSchema.safeParse({
        twilio_account_sid: settings.twilio_account_sid,
        twilio_auth_token: settings.twilio_auth_token,
        google_calendar_id: settings.google_calendar_id,
        google_calendar_api_key: settings.google_calendar_api_key,
        openai_api_key: settings.openai_api_key,
        confirmation_email_template: settings.confirmation_email_template,
        confirmation_sms_template: settings.confirmation_sms_template,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      // Sanitize templates to prevent XSS
      const sanitizedEmailTemplate = settings.confirmation_email_template
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const sanitizedSmsTemplate = settings.confirmation_sms_template
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        twilio_account_sid: settings.twilio_account_sid.trim(),
        twilio_auth_token: settings.twilio_auth_token.trim(),
        google_calendar_id: settings.google_calendar_id.trim(),
        google_calendar_api_key: settings.google_calendar_api_key.trim(),
        openai_api_key: settings.openai_api_key.trim(),
        custom_settings: {
          send_confirmation_email: settings.send_confirmation_email,
          send_confirmation_sms: settings.send_confirmation_sms,
          confirmation_email_template: sanitizedEmailTemplate,
          confirmation_sms_template: sanitizedSmsTemplate,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully (API keys encrypted)",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container max-w-4xl mx-auto py-4 md:py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-4 md:space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Key className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              API Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure your API keys and credentials for your booking agents
            </p>
          </div>

          <Card className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Twilio Configuration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional: Add your Twilio credentials if you want to use your own account for SMS
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twilio_account_sid">Account SID (Optional)</Label>
                <Input
                  id="twilio_account_sid"
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={settings.twilio_account_sid}
                  onChange={(e) =>
                    setSettings({ ...settings, twilio_account_sid: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio_auth_token">Auth Token (Optional)</Label>
                <Input
                  id="twilio_auth_token"
                  type="password"
                  placeholder="Your Twilio auth token"
                  value={settings.twilio_auth_token}
                  onChange={(e) =>
                    setSettings({ ...settings, twilio_auth_token: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Google Calendar Configuration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional: Connect your Google Calendar for appointment scheduling
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="google_calendar_id">Calendar ID (Optional)</Label>
                <Input
                  id="google_calendar_id"
                  type="text"
                  placeholder="your-calendar-id@group.calendar.google.com"
                  value={settings.google_calendar_id}
                  onChange={(e) =>
                    setSettings({ ...settings, google_calendar_id: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_calendar_api_key">API Key (Optional)</Label>
                <Input
                  id="google_calendar_api_key"
                  type="password"
                  placeholder="Your Google Calendar API key"
                  value={settings.google_calendar_api_key}
                  onChange={(e) =>
                    setSettings({ ...settings, google_calendar_api_key: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">OpenAI Configuration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional: Use your own OpenAI API key for AI features
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="openai_api_key">API Key (Optional)</Label>
                <Input
                  id="openai_api_key"
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={settings.openai_api_key}
                  onChange={(e) =>
                    setSettings({ ...settings, openai_api_key: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Booking Confirmation Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Customize how customers receive booking confirmations
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="send_email">Send Email Confirmations</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send emails when bookings are confirmed
                  </p>
                </div>
                <Switch
                  id="send_email"
                  checked={settings.send_confirmation_email}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, send_confirmation_email: checked })
                  }
                />
              </div>

              {settings.send_confirmation_email && (
                <div className="space-y-2">
                  <Label htmlFor="email_template">Email Template</Label>
                  <Textarea
                    id="email_template"
                    placeholder="Hi {name}, your appointment is confirmed for {date} at {time}. Looking forward to seeing you!"
                    value={settings.confirmation_email_template}
                    onChange={(e) =>
                      setSettings({ ...settings, confirmation_email_template: e.target.value })
                    }
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{name}"}, {"{date}"}, {"{time}"} as placeholders
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="send_sms">Send SMS Confirmations</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send SMS when bookings are confirmed
                  </p>
                </div>
                <Switch
                  id="send_sms"
                  checked={settings.send_confirmation_sms}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, send_confirmation_sms: checked })
                  }
                />
              </div>

              {settings.send_confirmation_sms && (
                <div className="space-y-2">
                  <Label htmlFor="sms_template">SMS Template</Label>
                  <Textarea
                    id="sms_template"
                    placeholder="Hi {name}, your appointment is confirmed for {date} at {time}."
                    value={settings.confirmation_sms_template}
                    onChange={(e) =>
                      setSettings({ ...settings, confirmation_sms_template: e.target.value })
                    }
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{name}"}, {"{date}"}, {"{time}"} as placeholders (max 160 characters)
                  </p>
                </div>
              )}
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </Card>
        </div>
      </div>
      <HelpChatbot />
    </div>
  );
};

export default Settings;
