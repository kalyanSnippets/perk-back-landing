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
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://bhczknuriaxvgmvbtzzo.supabase.co/storage/v1/object/public/email-assets/perkback-logo.png'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to PerkBack — confirm your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="PerkBack" width="140" height="auto" style={logo} />
        <Heading style={h1}>Welcome to PerkBack!</Heading>
        <Text style={text}>
          Thanks for signing up! Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) to get started with your rewards.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Get Started
        </Button>
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
const link = { color: '#4d8fd6', textDecoration: 'underline' }
const button = { backgroundColor: '#0a1f5c', color: '#ffffff', fontSize: '15px', borderRadius: '12px', padding: '14px 24px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
