import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Bell, Shield, Database } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Only admins can access settings
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "")) {
    redirect("/dashboard");
  }

  const settingsSections = [
    {
      title: "Company Settings",
      description: "Configure company name, logo, and basic information",
      icon: Building2,
      status: "Coming Soon",
    },
    {
      title: "Notifications",
      description: "Email and notification preferences",
      icon: Bell,
      status: "Coming Soon",
    },
    {
      title: "Security",
      description: "Password policies and access control",
      icon: Shield,
      status: "Coming Soon",
    },
    {
      title: "Data Management",
      description: "Backup, export, and data retention settings",
      icon: Database,
      status: "Coming Soon",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Card key={section.title} className="relative">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <section.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                {section.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment</span>
            <span>{process.env.NODE_ENV}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database</span>
            <span>PostgreSQL (Neon)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
