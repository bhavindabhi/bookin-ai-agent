import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Phone, Zap, Shield, Package, ChefHat, BedDouble, Coffee, Utensils, ShoppingBag } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Hospitrade AI</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button onClick={() => navigate("/voice")} className="bg-gradient-to-r from-primary to-secondary text-white">
              <Phone className="mr-2 h-4 w-4" />
              Talk to Alex
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-20 pb-16 px-6 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Phone className="h-4 w-4" />
            AI Voice Sales Agent — Available 24/7
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
            Meet Alex, Your Hospitrade AI Assistant
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Browse products, get instant quotes and place trade orders at{" "}
            <span className="text-primary font-medium">Hospitrade.co.uk</span>{" "}
            — just by talking. No hold music. No waiting. Available any time, day or night.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate("/voice")}
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
            >
              <Phone className="mr-2 h-5 w-5" />
              Start Voice Chat with Alex
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Business Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-shadow">
            <Phone className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Voice-First Ordering</h3>
            <p className="text-sm text-muted-foreground">
              Talk naturally with Alex to search products, check stock and place trade orders without touching a keyboard.
            </p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-card to-secondary/5 hover:shadow-lg transition-shadow">
            <Zap className="h-10 w-10 text-secondary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Instant Trade Quotes</h3>
            <p className="text-sm text-muted-foreground">
              Get trade pricing on the spot for any quantity. Alex knows every product category and can build you a quote in seconds.
            </p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-shadow">
            <Shield className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">24/7 Trade Support</h3>
            <p className="text-sm text-muted-foreground">
              Alex never sleeps. Place urgent orders, track deliveries or check availability at 2am if you need to.
            </p>
          </Card>
        </div>
      </section>

      {/* Product Categories */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Alex Can Help You With</h2>
          <p className="text-muted-foreground">
            All Hospitrade product categories — ask Alex about any of them
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Utensils className="h-7 w-7" />, name: "Tableware & Crockery" },
            { icon: <ChefHat className="h-7 w-7" />, name: "Kitchen Equipment" },
            { icon: <BedDouble className="h-7 w-7" />, name: "Linen & Bedding" },
            { icon: <Coffee className="h-7 w-7" />, name: "Bar & Beverage" },
            { icon: <ShoppingBag className="h-7 w-7" />, name: "Cleaning Supplies" },
            { icon: <Package className="h-7 w-7" />, name: "Disposables" },
            { icon: <Utensils className="h-7 w-7" />, name: "Catering Accessories" },
            { icon: <Shield className="h-7 w-7" />, name: "Food Safety" },
          ].map((cat) => (
            <Card
              key={cat.name}
              className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
              onClick={() => navigate("/voice")}
            >
              <div className="flex justify-center mb-2 text-primary">{cat.icon}</div>
              <p className="text-sm font-medium">{cat.name}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            { step: "1", title: "Click & Talk", desc: "Hit 'Start Call' and speak naturally to Alex about what your business needs." },
            { step: "2", title: "Alex Finds It", desc: "Alex searches Hospitrade's full catalogue, checks availability and builds a personalised quote." },
            { step: "3", title: "Order Confirmed", desc: "Confirm your order by voice. Alex captures your details and submits your inquiry to the trade team." },
          ].map((s) => (
            <div key={s.step} className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl mx-auto">
                {s.step}
              </div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Order the Smart Way?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join Hospitrade customers who use Alex to save time on every order.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/voice")}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white text-lg px-8 py-6"
          >
            <Phone className="mr-2 h-5 w-5" />
            Talk to Alex Now — It's Free
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Hospitrade.co.uk — AI Sales Assistant</p>
      </footer>
    </div>
  );
};

export default Index;
