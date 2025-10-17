import React from "react";
import { sendEmail } from "@/api/integrations/emailService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, CheckCircle } from "lucide-react";

export default function InvitationDialog({ player, open, onClose }) {
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState(null);

  const sendInvitation = async () => {
    setSending(true);
    setError(null);
    
    try {
      const portalUrl = `${window.location.origin}/PlayerPortalAccess?code=${player.inviteCode}`;
      
      await sendEmail({
        from_name: "O7C Hub",
        to: player.emailAddress,
        subject: "Welcome to O7C Hub - Your Player Portal Access",
        body: `
Hi ${player.firstName},

Welcome to the Ohio 7 on 7 Collective! We're excited to have you as part of our program.

You now have access to your personalized O7C Player Portal where you can:
• View your player profile
• Access your recruitment information
• Stay connected with the team
• And much more!

Your unique invitation code is: ${player.inviteCode}

Click the link below to access your portal:
${portalUrl}

Or visit ${window.location.origin}/PlayerPortalAccess and enter your invitation code: ${player.inviteCode}

If you have any questions, please don't hesitate to reach out to your O7C representative.

Welcome to the team!

- The O7C Team
        `
      });
      
      setSent(true);
      setTimeout(() => {
        onClose();
        setSent(false);
      }, 2000);
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError("Failed to send invitation email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {sent ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Invitation Sent!
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 text-blue-600" />
                Send Player Invitation
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {sent ? (
              <span className="text-green-600">
                The invitation email has been sent to {player.emailAddress}
              </span>
            ) : (
              <>
                Would you like to send an invitation email to <strong>{player.firstName} {player.lastName}</strong> at <strong>{player.emailAddress}</strong>?
                <br /><br />
                The email will include their unique portal access code: <span className="font-mono font-bold">{player.inviteCode}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {!sent && (
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={sending}
            >
              Not Now
            </Button>
            <Button
              onClick={sendInvitation}
              disabled={sending}
              className="bg-gradient-to-r from-blue-900 to-blue-700"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}