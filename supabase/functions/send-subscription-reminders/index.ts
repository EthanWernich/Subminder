// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Subscription {
  id: string
  user_id: string
  name: string
  cost: number
  currency: string
  billing_cycle: 'monthly' | 'yearly'
  first_charge_date: string
}

interface User {
  id: string
  email: string
}

// Function to calculate next payment date (same logic as in your Angular app)
function getNextPaymentDate(subscription: Subscription): Date {
  const firstCharge = new Date(subscription.first_charge_date)
  const today = new Date()
  let nextPayment = new Date(firstCharge)

  // If the first charge is in the future, that's the next payment
  if (nextPayment > today) {
    return nextPayment
  }

  // If the first charge is today, the next payment should be the next cycle
  if (
    nextPayment.getFullYear() === today.getFullYear() &&
    nextPayment.getMonth() === today.getMonth() &&
    nextPayment.getDate() === today.getDate()
  ) {
    switch (subscription.billing_cycle?.toLowerCase()) {
      case 'monthly':
        nextPayment.setMonth(nextPayment.getMonth() + 1)
        break
      case 'yearly':
        nextPayment.setFullYear(nextPayment.getFullYear() + 1)
        break
      default:
        return nextPayment
    }
    return nextPayment
  }

  // Otherwise, increment until we find the next payment after today
  while (nextPayment <= today) {
    switch (subscription.billing_cycle?.toLowerCase()) {
      case 'monthly':
        nextPayment.setMonth(nextPayment.getMonth() + 1)
        break
      case 'yearly':
        nextPayment.setFullYear(nextPayment.getFullYear() + 1)
        break
      default:
        return nextPayment
    }
  }
  return nextPayment
}

// Function to send email using Resend API
async function sendEmail(to: string, subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SubMinder <noreply@resend.dev>', // You can change this to your domain
      to: [to],
      subject: subject,
      html: html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Error sending email:', error)
    throw new Error(`Failed to send email: ${error}`)
  }

  const result = await response.json()
  console.log('Email sent successfully:', result)
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get tomorrow's date at 9 AM in user's timezone (we'll use UTC for now)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    // Get all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')

    if (subError) {
      throw subError
    }

    if (!subscriptions) {
      return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Filter subscriptions due tomorrow
    const dueTomorrow = subscriptions.filter(sub => {
      const nextPayment = getNextPaymentDate(sub)
      const nextPaymentDate = new Date(nextPayment)
      nextPaymentDate.setHours(9, 0, 0, 0) // Set to 9 AM for comparison
      
      return nextPaymentDate.getTime() === tomorrow.getTime()
    })

    if (dueTomorrow.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions due tomorrow' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get unique user IDs
    const userIds = [...new Set(dueTomorrow.map(sub => sub.user_id))]

    // Get user emails
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      throw userError
    }

    // Send emails to each user
    const emailPromises = userIds.map(async (userId) => {
      const user = users.users.find(u => u.id === userId)
      if (!user?.email) return

      // Get user's subscriptions due tomorrow
      const userSubscriptions = dueTomorrow.filter(sub => sub.user_id === userId)
      
      // Create email content
      const subscriptionList = userSubscriptions.map(sub => 
        `• ${sub.name}: ${sub.cost} ${sub.currency} (${sub.billing_cycle})`
      ).join('\n')

      const subject = `🔔 Subscription Reminder: ${userSubscriptions.length} payment(s) due tomorrow`
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Subscription Payment Reminder</h2>
          <p>Hello,</p>
          <p>This is a friendly reminder that you have <strong>${userSubscriptions.length} subscription payment(s)</strong> due tomorrow:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${subscriptionList.split('\n').map(item => `<div style="margin: 5px 0;">${item}</div>`).join('')}
          </div>
          <p>Total amount due: <strong>${userSubscriptions.reduce((sum, sub) => sum + sub.cost, 0)} ${userSubscriptions[0]?.currency}</strong></p>
          <p>Please ensure you have sufficient funds in your account to avoid any service interruptions.</p>
          <p>Best regards,<br>The SubMinder Team</p>
        </div>
      `

      await sendEmail(user.email, subject, html)
      console.log(`Email sent to ${user.email} for ${userSubscriptions.length} subscription(s)`)
    })

    await Promise.all(emailPromises)

    return new Response(JSON.stringify({ 
      message: `Reminders sent for ${dueTomorrow.length} subscription(s) to ${userIds.length} user(s)` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-subscription-reminders' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
