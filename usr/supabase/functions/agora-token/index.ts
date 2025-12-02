// Follows the Supabase Edge Function structure (Deno)
// This file demonstrates how to implement the "Node.js to Agora" token generation
// You would deploy this to Supabase Functions or a Node.js server

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// In a real Node.js env, you would use: const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
// For Deno/Supabase, we can import from npm:
import { RtcTokenBuilder, RtcRole } from 'npm:agora-token@2.0.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { channelName, uid, role } = await req.json()

    if (!channelName) {
      throw new Error('channelName is required')
    }

    // Get these from your environment variables
    // In Supabase: supabase secrets set AGORA_APP_ID=...
    const appID = Deno.env.get('AGORA_APP_ID') ?? 'YOUR_APP_ID_PLACEHOLDER'
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE') ?? 'YOUR_APP_CERTIFICATE_PLACEHOLDER'

    if (appID === 'YOUR_APP_ID_PLACEHOLDER') {
       return new Response(
        JSON.stringify({ error: 'Agora credentials not set in environment variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // RtcRole: 1 for publisher (broadcaster), 2 for subscriber (audience)
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER
    
    // Token expiration time in seconds
    const expirationTimeInSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    // Build the token
    // If uid is 0, it allows any uid to join (not recommended for production but good for testing)
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      uid || 0,
      rtcRole,
      privilegeExpiredTs
    )

    return new Response(
      JSON.stringify({ token, channelName, uid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
