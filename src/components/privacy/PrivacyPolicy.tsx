import { Shield, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function PrivacyPolicy() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          Privacy Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-green-500" />
            Privacy Policy
          </DialogTitle>
          <DialogDescription>
            Your privacy is paramount. Here's exactly what we collect and what we don't.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* What We Collect */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              What We Collect
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Anonymous Usage Statistics</p>
                <p className="text-muted-foreground">
                  We collect basic, anonymous analytics using self-hosted Umami analytics to understand
                  how the tool is being used. This includes:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-2">
                  <li>Page views and tab switches</li>
                  <li>Which features are used (CSV upload, example profiles, manual entry)</li>
                  <li>Configuration selections (rounded battery/solar capacities)</li>
                  <li>Whether configurations are shared</li>
                </ul>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Anonymized Configuration Data</p>
                <p className="text-muted-foreground">
                  When you interact with the tool, we track rounded values to prevent identification:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-2">
                  <li>Battery capacity (rounded to nearest 5 kWh: e.g., 10.5 kWh → 10 kWh)</li>
                  <li>Solar capacity (rounded to nearest 1 kWp: e.g., 4.2 kWp → 4 kWp)</li>
                  <li>Annual consumption (rounded to nearest 100 kWh: e.g., 3542 kWh → 3500 kWh)</li>
                </ul>
                <p className="text-muted-foreground mt-2 text-xs">
                  These rounded values help us understand typical use cases without identifying individuals.
                </p>
              </div>
            </div>
          </section>

          {/* What We DON'T Collect */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              What We DON'T Collect
            </h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>No Personal Data:</strong> We do not collect names, email addresses, or any personally identifiable information.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>No Raw Consumption Data:</strong> Your actual energy consumption data never leaves your device. It's processed entirely in your browser.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>No IP Address Tracking:</strong> Our analytics do not log IP addresses or other network identifiers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>No Cookies:</strong> We don't use tracking cookies or third-party analytics services.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>No Cross-Site Tracking:</strong> We don't track you across websites or build behavioral profiles.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span><strong>No Data Sales:</strong> We will never sell your data because we don't collect anything worth selling.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h3 className="text-lg font-semibold mb-3">How It Works</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                  100% Client-Side Processing
                </p>
                <p>
                  SPARK runs entirely in your web browser. When you upload a CSV file or enter consumption data:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>All calculations happen on your device</li>
                  <li>No data is uploaded to any server</li>
                  <li>You can even use this tool offline after the initial page load</li>
                  <li>Your browser's local storage is used to remember your preferences (dark mode, etc.)</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Self-Hosted Analytics
                </p>
                <p>
                  We use Umami, a privacy-focused, open-source analytics platform that we host ourselves:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>GDPR, CCPA, and PECR compliant</li>
                  <li>No cookies or persistent identifiers</li>
                  <li>Aggregated statistics only</li>
                  <li>You can block it with ad blockers without affecting functionality</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Shared Configurations */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Shared Configurations</h3>
            <div className="text-sm text-muted-foreground">
              <p>
                When you click "Share Configuration," a URL is generated that contains:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                <li>Your tariff rate periods and export rates</li>
                <li>Battery and solar configuration settings</li>
                <li>Anonymized consumption summary (average daily usage, date range)</li>
              </ul>
              <p className="mt-2">
                This data is encoded in the URL itself (not stored on our servers) so you can share
                your analysis with others. Anyone with the URL can see these settings.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Your Rights</h3>
            <div className="text-sm text-muted-foreground">
              <p>
                Since we don't collect any personal data or track individuals, there's nothing to delete,
                export, or modify. You have complete control:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                <li>Use browser ad blockers to prevent analytics (the tool will still work)</li>
                <li>Clear your browser's local storage to remove saved preferences</li>
                <li>Use private/incognito mode for a completely ephemeral session</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Questions?</h3>
            <p className="text-sm text-muted-foreground">
              If you have questions about this privacy policy or how SPARK handles your data,
              please open an issue on our{' '}
              <a
                href="https://github.com/neoKushan/SPARK"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub repository
              </a>
              .
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Last updated: January 2026
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
