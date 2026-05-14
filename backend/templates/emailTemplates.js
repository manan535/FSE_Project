/**
 * Email Templates — Modern responsive HTML email templates
 *
 * All templates share a common base layout with:
 * - Gradient header with ScaleNest branding
 * - Clean content body
 * - CTA buttons
 * - Footer with unsubscribe placeholder
 * - Dark/light compatible inline styling
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Base layout wrapper ────────────────────────────────────────────────────────
const baseLayout = (content, preheader = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ScaleNest</title>
  <!--[if mso]>
  <style>table,td,div,p,a{font-family:Arial,sans-serif;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                ScaleNest
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:400;">
                Multi-Tenant SaaS Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
                © ${new Date().getFullYear()} ScaleNest. All rights reserved.<br/>
                You received this email because you have an account with ScaleNest.<br/>
                <a href="${FRONTEND_URL}" style="color:#6366f1;text-decoration:none;">Visit Dashboard</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── CTA Button helper ──────────────────────────────────────────────────────────
const ctaButton = (text, url, color = '#6366f1') => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="background:${color};border-radius:10px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

// ─── Divider ────────────────────────────────────────────────────────────────────
const divider = `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`;

// ═════════════════════════════════════════════════════════════════════════════════
// Template Functions
// ═════════════════════════════════════════════════════════════════════════════════

/**
 * 1. Welcome Email — sent after user registration
 */
export const welcomeEmail = (userName) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
      Welcome aboard, ${userName}! 🎉
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Your account has been created successfully. You're now part of the ScaleNest community — a powerful platform to manage your projects, teams, and workflows.
    </p>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 8px;">
      Here's what you can do next:
    </p>
    <ul style="color:#6b7280;font-size:15px;line-height:2;padding-left:20px;margin:0 0 16px;">
      <li>Create or join a workspace</li>
      <li>Set up your first project</li>
      <li>Invite your team members</li>
      <li>Start tracking tasks with Kanban boards</li>
    </ul>
    ${ctaButton('Go to Dashboard', `${FRONTEND_URL}/dashboard`)}
    ${divider}
    <p style="color:#9ca3af;font-size:13px;margin:0;">
      If you didn't create this account, please ignore this email.
    </p>
  `;
  return baseLayout(content, `Welcome to ScaleNest, ${userName}!`);
};

/**
 * 2. Workspace Created Email
 */
export const workspaceCreatedEmail = (userName, workspaceName) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
      Workspace Created! 🏢
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi ${userName}, your new workspace <strong style="color:#111827;">"${workspaceName}"</strong> is ready to go!
    </p>
    <div style="background:#f0f0ff;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0;color:#4f46e5;font-size:14px;font-weight:600;">Workspace Details</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Name: <strong>${workspaceName}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Created: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
    </div>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Start by creating projects and inviting your team members.
    </p>
    ${ctaButton('Open Workspace', `${FRONTEND_URL}/dashboard`)}
  `;
  return baseLayout(content, `Workspace "${workspaceName}" has been created`);
};

/**
 * 3. Password Reset Email
 */
export const passwordResetEmail = (userName, resetLink) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
      Reset Your Password 🔐
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi ${userName}, we received a request to reset your password. Click the button below to create a new password.
    </p>
    ${ctaButton('Reset Password', resetLink, '#dc2626')}
    <div style="background:#fef2f2;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">
        ⚠️ This link expires in 1 hour. If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
    ${divider}
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetLink}" style="color:#6366f1;word-break:break-all;">${resetLink}</a>
    </p>
  `;
  return baseLayout(content, 'Reset your ScaleNest password');
};

/**
 * 4. Login Alert Email
 */
export const loginAlertEmail = (userName, loginTime) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
      New Login Detected 🔔
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi ${userName}, a new login to your ScaleNest account was detected.
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">Login Details</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Time: <strong>${loginTime}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Platform: ScaleNest Web App</p>
    </div>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      If this was you, no further action is needed. If you did not log in, please change your password immediately.
    </p>
    ${ctaButton('Review Account', `${FRONTEND_URL}/dashboard/settings`)}
  `;
  return baseLayout(content, 'New login to your ScaleNest account');
};

/**
 * 5. Subscription Expiry Warning Email
 */
export const subscriptionExpiryEmail = (userName, workspaceName, expiresAt) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
      Subscription Expiring Soon ⏰
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi ${userName}, the subscription for workspace <strong style="color:#111827;">"${workspaceName}"</strong> is expiring soon.
    </p>
    <div style="background:#fffbeb;border-radius:12px;padding:20px;margin:16px 0;border:1px solid #fde68a;">
      <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">⚠️ Expiry Date</p>
      <p style="margin:8px 0 0;color:#92400e;font-size:18px;font-weight:700;">${expiresAt}</p>
    </div>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Renew your subscription to avoid any disruption to your workspace and team.
    </p>
    ${ctaButton('Renew Subscription', `${FRONTEND_URL}/dashboard/billing`, '#f59e0b')}
  `;
  return baseLayout(content, `Your subscription for "${workspaceName}" is expiring soon`);
};

/**
 * 6. User Invitation Email
 */
export const invitationEmail = (inviterName, workspaceName, inviteCode) => {
  const inviteLink = `${FRONTEND_URL}/workspace-setup?invite=${inviteCode}`;
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
      You've Been Invited! 🤝
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#111827;">${inviterName}</strong> has invited you to join the workspace 
      <strong style="color:#111827;">"${workspaceName}"</strong> on ScaleNest.
    </p>
    <div style="background:#f0f0ff;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0;color:#4f46e5;font-size:14px;font-weight:600;">Invitation Details</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Workspace: <strong>${workspaceName}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Invited by: <strong>${inviterName}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Invite Code: <code style="background:#e0e7ff;padding:2px 8px;border-radius:4px;font-size:13px;">${inviteCode}</code></p>
    </div>
    ${ctaButton('Accept Invitation', inviteLink)}
    ${divider}
    <p style="color:#9ca3af;font-size:13px;margin:0;">
      If you don't have a ScaleNest account, you'll be prompted to create one first.
    </p>
  `;
  return baseLayout(content, `${inviterName} invited you to join "${workspaceName}"`);
};

/**
 * 7. Task Deadline Reminder Email (due tomorrow)
 */
export const taskDeadlineEmail = (userName, taskTitle, dueDate, projectName) => {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
      Task Due Tomorrow ⚡
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi ${userName}, just a friendly reminder that the following task is due soon.
    </p>
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 12px 12px 0;padding:20px;margin:16px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">📋 Task Details</p>
      <p style="margin:10px 0 4px;color:#111827;font-size:16px;font-weight:700;">${taskTitle}</p>
      ${projectName ? `<p style="margin:0 0 4px;color:#6b7280;font-size:14px;">Project: <strong>${projectName}</strong></p>` : ''}
      <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">📅 Due: ${formattedDate}</p>
    </div>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Make sure to complete it before the deadline to keep your project on track!
    </p>
    ${ctaButton('View Task', `${FRONTEND_URL}/dashboard/tasks`, '#f59e0b')}
  `;
  return baseLayout(content, `Reminder: "${taskTitle}" is due tomorrow`);
};

/**
 * 8. Task Overdue Warning Email
 */
export const taskOverdueEmail = (userName, taskTitle, dueDate, projectName) => {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const content = `
    <h2 style="margin:0 0 8px;color:#dc2626;font-size:22px;font-weight:700;">
      Task Overdue! 🚨
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hi ${userName}, the following task has passed its deadline and needs immediate attention.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 12px 12px 0;padding:20px;margin:16px 0;">
      <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">🚫 Overdue Task</p>
      <p style="margin:10px 0 4px;color:#111827;font-size:16px;font-weight:700;">${taskTitle}</p>
      ${projectName ? `<p style="margin:0 0 4px;color:#6b7280;font-size:14px;">Project: <strong>${projectName}</strong></p>` : ''}
      <p style="margin:0;color:#dc2626;font-size:14px;font-weight:600;">📅 Was due: ${formattedDate}</p>
    </div>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Please complete this task as soon as possible or update its status.
    </p>
    ${ctaButton('View Task', `${FRONTEND_URL}/dashboard/tasks`, '#dc2626')}
  `;
  return baseLayout(content, `OVERDUE: "${taskTitle}" has passed its deadline`);
};

/**
 * 9. Project Invitation Email — sent when admin invites a user to a specific project
 */
export const projectInvitationEmail = (inviterName, projectName, workspaceName, inviteLink) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">
      Project Invitation 📋
    </h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#111827;">${inviterName}</strong> has invited you to join the project
      <strong style="color:#111827;">"${projectName}"</strong> in workspace
      <strong style="color:#111827;">"${workspaceName}"</strong>.
    </p>
    <div style="background:#f0f0ff;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0;color:#4f46e5;font-size:14px;font-weight:600;">📋 Project Invitation Details</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Project: <strong>${projectName}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Workspace: <strong>${workspaceName}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Invited by: <strong>${inviterName}</strong></p>
    </div>
    ${ctaButton('Accept Invitation', inviteLink)}
    <div style="background:#fffbeb;border-radius:12px;padding:16px;margin:16px 0;border:1px solid #fde68a;">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
        ⏰ This invitation expires in <strong>48 hours</strong>. Please accept it before then to join the project.
      </p>
    </div>
    ${divider}
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${inviteLink}" style="color:#6366f1;word-break:break-all;">${inviteLink}</a>
    </p>
  `;
  return baseLayout(content, `${inviterName} invited you to join project "${projectName}"`);
};

export default {
  welcomeEmail,
  workspaceCreatedEmail,
  passwordResetEmail,
  loginAlertEmail,
  subscriptionExpiryEmail,
  invitationEmail,
  taskDeadlineEmail,
  taskOverdueEmail,
  projectInvitationEmail,
};
