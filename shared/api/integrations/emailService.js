/**
 * Email service using Brevo (formerly Sendinblue) via Vercel proxy for sending emails
 */

/**
 * Send an email using Brevo
 * @param {Object} params - Email parameters
 * @param {string} params.from - Sender email address (must be verified in Brevo)
 * @param {string} params.from_name - Sender name
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body content (HTML)
 * @param {string} [params.text] - Plain text version of the email
 * @returns {Promise<Object>} Email send response
 */
export async function sendEmail(params) {
  try {
    // Validate required parameters
    if (!params.to || !params.subject || !params.body) {
      throw new Error('Missing required email parameters: to, subject, body');
    }


    // Prepare email payload for Brevo API
    const payload = {
      sender: {
        email: params.from || 'noreply@o7chub.com',
        name: params.from_name || 'O7C Hub'
      },
      to: [
        {
          email: params.to
        }
      ],
      subject: params.subject,
      htmlContent: params.body,
      ...(params.text && { textContent: params.text })
    };

    // Send email via Vercel proxy
    const response = await fetch('/api/brevo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint: '/v3/smtp/email', payload })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      messageId: result.messageId || `brevo_${Date.now()}`,
      to: params.to,
      subject: params.subject,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

  } catch (error) {
    console.error('Email send failed:', error);

    // Return error response
    return {
      success: false,
      error: error.message,
      to: params.to,
      subject: params.subject,
      sentAt: new Date().toISOString(),
      status: 'failed'
    };
  }
}

/**
 * Send an invitation email with a secure registration link
 * @param {Object} params - Invitation parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.invitationToken - Secure token for registration
 * @param {string} params.inviterName - Name of the person sending the invitation
 * @param {string} [params.role] - Role being invited to (e.g., 'coach', 'player')
 * @param {string} [params.customMessage] - Custom message to include in the email
 * @returns {Promise<Object>} Email send response
 */
export async function sendInvitationEmail(params) {
  try {
    // Validate required parameters
    if (!params.email || !params.invitationToken || !params.inviterName) {
      throw new Error('Missing required invitation parameters: email, invitationToken, inviterName');
    }

    // Generate registration link (assuming frontend route for registration)
    const registrationLink = `${window.location.origin}/register?token=${encodeURIComponent(params.invitationToken)}&email=${encodeURIComponent(params.email)}`;

    // Prepare email content
    const subject = `You're invited to join O7C Hub${params.role ? ` as a ${params.role}` : ''}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to O7C Hub!</h2>

        <p>Hi there,</p>

        <p><strong>${params.inviterName}</strong> has invited you to join O7C Hub${params.role ? ` as a <strong>${params.role}</strong>` : ''}.</p>

        ${params.customMessage ? `<p>${params.customMessage}</p>` : ''}

        <p>To get started, please click the button below to complete your registration:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${registrationLink}"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Registration
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can copy and paste this link into your browser:<br>
          <a href="${registrationLink}" style="color: #007bff;">${registrationLink}</a>
        </p>

        <p style="color: #666; font-size: 14px;">
          This invitation link will expire in 7 days for security reasons.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #999; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>

        <p style="color: #999; font-size: 12px;">
          O7C Hub - Connecting athletes with opportunities
        </p>
      </div>
    `;

    const textBody = `
Welcome to O7C Hub!

${params.inviterName} has invited you to join O7C Hub${params.role ? ` as a ${params.role}` : ''}.

${params.customMessage ? `${params.customMessage}\n\n` : ''}

To complete your registration, visit: ${registrationLink}

This invitation link will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

O7C Hub - Connecting athletes with opportunities
    `;

    // Send the email
    return await sendEmail({
      to: params.email,
      subject: subject,
      body: htmlBody,
      text: textBody,
      from_name: 'O7C Hub Team'
    });

  } catch (error) {
    console.error('Invitation email send failed:', error);

    return {
      success: false,
      error: error.message,
      to: params.email,
      sentAt: new Date().toISOString(),
      status: 'failed'
    };
  }
}

/**
 * Send admin notification email for new user signup
 * @param {Object} params - Notification parameters
 * @param {string} params.newUserEmail - Email of the newly registered user
 * @param {string} params.newUserRole - Role of the newly registered user
 * @param {string} params.adminEmail - Email address of the admin to notify
 * @returns {Promise<Object>} Email send response
 */
export async function sendAdminSignupNotificationEmail(params) {
  try {
    // Validate required parameters
    if (!params.newUserEmail || !params.newUserRole || !params.adminEmail) {
      throw new Error('Missing required notification parameters: newUserEmail, newUserRole, adminEmail');
    }

    const subject = `New User Registration: ${params.newUserRole} joined O7C Hub`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New User Registration</h2>

        <p>A new user has successfully registered on O7C Hub:</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${params.newUserEmail}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${params.newUserRole}</p>
          <p style="margin: 5px 0;"><strong>Registered At:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>You can manage this user and view their profile in the admin dashboard.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/admin/users"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View User Management
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #999; font-size: 12px;">
          This is an automated notification from O7C Hub.
        </p>

        <p style="color: #999; font-size: 12px;">
          O7C Hub - Connecting athletes with opportunities
        </p>
      </div>
    `;

    const textBody = `
New User Registration

A new user has successfully registered on O7C Hub:

Email: ${params.newUserEmail}
Role: ${params.newUserRole}
Registered At: ${new Date().toLocaleString()}

You can manage this user in the admin dashboard.

View User Management: ${window.location.origin}/admin/users

This is an automated notification from O7C Hub.
O7C Hub - Connecting athletes with opportunities
    `;

    // Send the email
    return await sendEmail({
      to: params.adminEmail,
      subject: subject,
      body: htmlBody,
      text: textBody,
      from_name: 'O7C Hub Admin'
    });

  } catch (error) {
    console.error('Admin signup notification email send failed:', error);

    return {
      success: false,
      error: error.message,
      to: params.adminEmail,
      sentAt: new Date().toISOString(),
      status: 'failed'
    };
  }
}

/**
 * Create in-app notification for admins about new user signup
 * @param {Object} params - Notification parameters
 * @param {string} params.newUserEmail - Email of the newly registered user
 * @param {string} params.newUserRole - Role of the newly registered user
 * @param {string} params.newUserId - ID of the newly registered user
 * @param {Array<string>} params.adminIds - Array of admin user IDs to notify
 * @returns {Promise<Array<Object>>} Array of created notification responses
 */
export async function createAdminSignupNotifications(params) {
  try {
    // Validate required parameters
    if (!params.newUserEmail || !params.newUserRole || !params.newUserId || !params.adminIds || !Array.isArray(params.adminIds)) {
      throw new Error('Missing required notification parameters: newUserEmail, newUserRole, newUserId, adminIds');
    }

    const { create } = await import('../entities/Notification.js');
    const notifications = [];

    for (const adminId of params.adminIds) {
      const notificationData = {
        type: 'user_signup',
        title: 'New User Registration',
        message: `A new ${params.newUserRole} has registered: ${params.newUserEmail}`,
        recipientId: adminId,
        relatedUserId: params.newUserId,
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          newUserEmail: params.newUserEmail,
          newUserRole: params.newUserRole,
          actionUrl: '/admin/users'
        }
      };

      const result = await create(notificationData);
      notifications.push(result);
    }

    return notifications;

  } catch (error) {
    console.error('Failed to create admin signup notifications:', error);
    throw error;
  }
}

/**
 * Send approval confirmation email to user after admin approval
 * @param {Object} params - Approval parameters
 * @param {string} params.email - Email address of the approved user
 * @param {string} params.role - Role of the approved user
 * @param {string} params.approvedBy - Name/email of the admin who approved
 * @returns {Promise<Object>} Email send response
 */
export async function sendApprovalConfirmationEmail(params) {
  try {
    // Validate required parameters
    if (!params.email || !params.role || !params.approvedBy) {
      throw new Error('Missing required approval parameters: email, role, approvedBy');
    }

    const subject = 'Your O7C Hub Account Has Been Approved!';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Welcome to O7C Hub!</h2>

        <p>Great news! Your account has been approved and you can now access O7C Hub.</p>

        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 5px 0;"><strong>Role:</strong> ${params.role}</p>
          <p style="margin: 5px 0;"><strong>Approved By:</strong> ${params.approvedBy}</p>
          <p style="margin: 5px 0;"><strong>Approved At:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>You can now log in to your account and start exploring all the features available to you.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/login"
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Log In to Your Account
          </a>
        </div>

        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #999; font-size: 12px;">
          This is an automated confirmation from O7C Hub.
        </p>

        <p style="color: #999; font-size: 12px;">
          O7C Hub - Connecting athletes with opportunities
        </p>
      </div>
    `;

    const textBody = `
Welcome to O7C Hub!

Great news! Your account has been approved and you can now access O7C Hub.

Role: ${params.role}
Approved By: ${params.approvedBy}
Approved At: ${new Date().toLocaleString()}

You can now log in to your account and start exploring all the features available to you.

Log in here: ${window.location.origin}/login

If you have any questions or need assistance, feel free to reach out to our support team.

This is an automated confirmation from O7C Hub.
O7C Hub - Connecting athletes with opportunities
    `;

    // Send the email
    return await sendEmail({
      to: params.email,
      subject: subject,
      body: htmlBody,
      text: textBody,
      from_name: 'O7C Hub Team'
    });

  } catch (error) {
    console.error('Approval confirmation email send failed:', error);

    return {
      success: false,
      error: error.message,
      to: params.email,
      sentAt: new Date().toISOString(),
      status: 'failed'
    };
  }
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}