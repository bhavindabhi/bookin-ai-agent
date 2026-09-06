import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft } from "lucide-react";

const License = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePurchase = async (licenseType: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase a license",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (licenseType === "custom") {
      window.location.href = "mailto:bhavindabhi30@gmail.com?subject=Custom License Inquiry";
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("licenses").insert({
        user_id: session.user.id,
        license_type: licenseType,
        status: "pending",
      });

      if (error) throw error;

      // Send email notification to admin
      await supabase.functions.invoke("send-confirmation-email", {
        body: {
          name: session.user.email,
          email: "bhavindabhi30@gmail.com",
        },
      });

      toast({
        title: "License Request Submitted",
        description: "We'll contact you shortly to complete the setup",
      });
      
      navigate("/dashboard");
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

  const licenses = [
    {
      type: "individual",
      title: "Individual License",
      price: "Contact for pricing",
      features: [
        "1 AI Booking Agent",
        "Unlimited calls",
        "Email support",
        "Basic analytics",
        "Standard integration",
        "Custom voice selection",
        "Email notifications",
        "Calendar sync",
      ],
    },
    {
      type: "3-5-connections",
      title: "3-5 Connections License",
      price: "Contact for pricing",
      features: [
        "3-5 AI Booking Agents",
        "Unlimited calls per agent",
        "Priority email support",
        "Advanced analytics",
        "Multi-location support",
        "Custom integrations",
        "API access",
        "Webhook support",
        "Custom voice selection",
        "White-label branding",
        "Priority updates",
      ],
    },
    {
      type: "custom",
      title: "Custom Enterprise",
      price: "Custom pricing",
      features: [
        "Unlimited AI Booking Agents",
        "White-label solution",
        "24/7 dedicated support",
        "Custom features development",
        "Full API access",
        "On-premise deployment option",
        "Custom integrations",
        "Advanced security features",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom voice training",
        "Multi-language support",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Choose Your License
          </h1>
          <p className="text-xl text-muted-foreground">
            Select the perfect plan for your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {licenses.map((license) => (
            <Card
              key={license.type}
              className="p-8 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-bold mb-2">{license.title}</h3>
              <p className="text-3xl font-bold text-primary mb-6">
                {license.price}
              </p>
              
              <ul className="space-y-3 mb-8">
                {license.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePurchase(license.type)}
                disabled={loading}
                className="w-full"
                variant={license.type === "3-5-connections" ? "default" : "outline"}
              >
                {license.type === "custom" ? "Contact Us" : "Get Started"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default License;
