import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const trades = [
  {
    id: "hvac",
    name: "HVAC",
    description: "Heating, ventilation, and air conditioning systems",
    icon: "🌡️",
  },
  {
    id: "solar",
    name: "Solar",
    description: "Photovoltaic systems and renewable energy",
    icon: "☀️",
  },
  {
    id: "plumbing",
    name: "Plumbing",
    description: "Water systems, drainage, and fixtures",
    icon: "🚰",
  },
  {
    id: "electrical",
    name: "Electrical",
    description: "Power systems, wiring, and panels",
    icon: "⚡",
  },
  {
    id: "fire-protection",
    name: "Fire Protection",
    description: "Sprinkler systems and fire safety equipment",
    icon: "🔥",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Contractor Command Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select your trade to access templates, forms, and tools designed for MEP contractors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {trades.map((trade) => (
            <Link key={trade.id} href={`/dashboard?trade=${trade.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{trade.icon}</span>
                    <CardTitle className="text-2xl">{trade.name}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {trade.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            Powered by Coperniq MEP Templates | Built for contractors, by contractors
          </p>
        </div>
      </div>
    </div>
  );
}
