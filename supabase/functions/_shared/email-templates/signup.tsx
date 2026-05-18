/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://bhczknuriaxvgmvbtzzo.supabase.co/storage/v1/object/public/email-assets/perkback-logo.png'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  recipient,
  token,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your PerkBack verification code{token ? `: ${token}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="PerkBack" width="140" height="auto" style={logo} />
        <Heading style={h1}>Welcome to PerkBack!</Heading>
        <Text style={text}>
          Thanks for signing up{recipient ? ` (${recipient})` : ''}. Use the 6-digit code
          below to verify your email and finish creating your account.
        </Text>
        <Text style={codeStyle}>{token ?? '------'}</Text>
        <Text style={hint}>
          Enter this code in the PerkBack app to verify your email. It expires in 1 hour.
        </Text>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0a1f5c', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#5a6073', lineHeight: '1.6', margin: '0 0 25px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '34px',
  fontWeight: 'bold' as const,
  color: '#0a1f5c',
  letterSpacing: '8px',
  textAlign: 'center' as const,
  backgroundColor: '#f4f7fb',
  borderRadius: '12px',
  padding: '18px 0',
  margin: '0 0 20px',
}
const hint = { fontSize: '13px', color: '#5a6073', lineHeight: '1.5', margin: '0 0 30px', textAlign: 'center' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
