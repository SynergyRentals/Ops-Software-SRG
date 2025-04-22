import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useState(false);

  const handleSaveAccount = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  const handleSaveWebhooks = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  return (
    <MainLayout title="Settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Integration</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={user?.name || ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue={user?.username || ""} disabled />
                <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue={user?.role || ""} disabled />
                <p className="text-xs text-muted-foreground mt-1">Contact an administrator to change your role</p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-1">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAccount} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-mode">Dark Mode</Label>
                  <Switch 
                    id="theme-mode" 
                    checked={theme === "dark"} 
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Toggle between light and dark mode</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Integration</CardTitle>
              <CardDescription>
                Configure webhooks for HostAI and SuiteOp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="hostai-url">HostAI Webhook URL</Label>
                <Input id="hostai-url" defaultValue="https://your-app-url.com/api/webhooks/hostai" readOnly />
                <p className="text-xs text-muted-foreground mt-1">Provide this URL to HostAI to send maintenance requests</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="hostai-secret">HostAI Webhook Secret</Label>
                <Input id="hostai-secret" type="password" defaultValue="••••••••••••••••" />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-1">
                <Label htmlFor="suiteop-url">SuiteOp Webhook URL</Label>
                <Input id="suiteop-url" defaultValue="https://your-app-url.com/api/webhooks/suiteop" readOnly />
                <p className="text-xs text-muted-foreground mt-1">Provide this URL to SuiteOp to send maintenance requests</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="suiteop-secret">SuiteOp Webhook Secret</Label>
                <Input id="suiteop-secret" type="password" defaultValue="••••••••••••••••" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveWebhooks} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Webhook Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input id="openai-key" type="password" defaultValue="sk-•••••••••••••••••••••••••••••••••••••••••••••" />
                <p className="text-xs text-muted-foreground mt-1">API key for AI-powered scheduling suggestions</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-ai">Enable AI Features</Label>
                  <Switch id="enable-ai" defaultChecked />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Enable or disable AI-powered features</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveWebhooks} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save API Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
