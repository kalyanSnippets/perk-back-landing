/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://bhczknuriaxvgmvbtzzo.supabase.co/storage/v1/object/public/email-assets/perkback-logo.png'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join PerkBack</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="PerkBack" width="140" height="auto" style={logo} />
        <Heading style={h1}>You've been invited!</Heading>
        <Text style={text}>
          You've been invited to join PerkBack — the smart loyalty rewards platform. Click below to accept and create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0a1f5c', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#5a6073', lineHeight: '1.6', margin: '0 0 25px' }
const button = { backgroundColor: '#0a1f5c', color: '#ffffff', fontSize: '15px', borderRadius: '12px', padding: '14px 24px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
