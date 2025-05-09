import { createClient } from '@/libs/db/server'
import { Resend } from 'resend'

// Email template component
const InvitationEmail = ({
  organizationName,
  invitationLink,
}: { organizationName: string; invitationLink: string }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Organization Invitation</title>
      </head>
      <body>
        <h1>You've been invited to join ${organizationName}</h1>
        <p>You have been invited to join ${organizationName} on Liam.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${invitationLink}">Accept Invitation</a>
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
      </body>
    </html>
  `
}

type SendInvitationEmailParams = {
  email: string
  organizationId: string
  invitationToken: string
}

export const sendInvitationEmail = async ({
  email,
  organizationId,
  invitationToken,
}: SendInvitationEmailParams) => {
  if (!process.env.RESEND_API_KEY) {
    return { success: true, error: null }
  }

  const supabase = await createClient()

  // Get organization name for the email
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  if (orgError) {
    console.error('Error fetching organization:', orgError)
    return {
      success: false,
      error: 'Failed to fetch organization details.',
    } as const
  }

  let baseUrl: string | undefined = undefined
  switch (process.env.NEXT_PUBLIC_ENV_NAME) {
    case 'production':
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL // NEXT_PUBLIC_BASE_URL includes "https://"
      break
    case 'preview':
      baseUrl = `https://${process.env.VERCEL_BRANCH_URL}` // VERCEL_BRANCH_URL does not include "https://"
      break
    default:
      baseUrl = 'http://localhost:3001'
      break
  }

  // Construct invitation link
  const invitationLink = `${baseUrl || ''}/app/invitations/tokens/${invitationToken}`

  // Send email
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddress = process.env.RESEND_EMAIL_FROM_ADDRESS || 'liam@resend.dev'
  const { error: emailError } = await resend.emails.send({
    from: `Liam<${fromAddress}>`,
    to: email,
    subject: `Invitation to join ${orgData.name} on Liam`,
    html: InvitationEmail({
      organizationName: orgData.name,
      invitationLink,
    }),
  })

  if (emailError) {
    console.error('Error sending invitation email:', emailError)
    return {
      success: false,
      error: 'Failed to send invitation email.',
    } as const
  }

  return { success: true, error: null } as const
}
