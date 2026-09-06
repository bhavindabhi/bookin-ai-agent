import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const TwilioSetup = () => {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  const webhookUrl = 'https://lpbmunhxvudnyddzaeuu.supabase.co/functions/v1/twilio-voice';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Twilio Phone Setup
          </h1>
          <p className="text-muted-foreground">
            Connect your Twilio phone number to Sofia
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Copy the Webhook URL</h3>
                <p className="text-muted-foreground mb-4">
                  This is the URL Twilio will call when someone dials your number
                </p>
                <div className="bg-muted p-4 rounded-lg flex items-center gap-2 mb-2">
                  <code className="flex-1 text-sm break-all">{webhookUrl}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Configure Your Twilio Number</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Go to your Twilio Console</li>
                  <li>Click on "Phone Numbers" → "Manage" → "Active numbers"</li>
                  <li>Select your USA phone number</li>
                  <li>Scroll down to "Voice Configuration"</li>
                  <li>Under "A CALL COMES IN", select "Webhook"</li>
                  <li>Paste the webhook URL from Step 1</li>
                  <li>Make sure "HTTP POST" is selected</li>
                  <li>Click "Save configuration"</li>
                </ol>
                <Button asChild variant="outline">
                  <a 
                    href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    Open Twilio Console
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Test Your Setup</h3>
                <p className="text-muted-foreground mb-4">
                  Once configured, call your Twilio number from any phone:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>You'll hear a brief greeting</li>
                  <li>Sofia will then answer and greet you</li>
                  <li>Speak naturally to book appointments</li>
                  <li>Sofia will collect all necessary information</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-secondary/10 border-secondary">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-secondary">
              <Check className="w-5 h-5" />
              What Sofia Can Do
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Book new appointments</li>
              <li>✓ Cancel existing appointments</li>
              <li>✓ Reschedule appointments</li>
              <li>✓ Check appointment availability</li>
              <li>✓ Handle emergency requests</li>
              <li>✓ Provide service information</li>
            </ul>
          </Card>

          <div className="text-center pt-6">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:shadow-glow">
              <a href="/">Back to Web Interface</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwilioSetup;
