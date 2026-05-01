import Stripe from 'stripe'
import { prisma } from '../lib/prisma.js'
import type { Plan } from 'shared'

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '', {
  apiVersion: '2024-06-20',
})

// Commission rates by seller plan
export const COMMISSION_RATES: Record<Plan, number> = {
  FREE: 0,
  READER: 0.15,
  COLLECTOR: 0.12,
  BIBLIOPHILE: 0.10,
}

/**
 * Create a Stripe Checkout session for a subscription upgrade.
 */
export async function createCheckoutSession(
  userId: string,
  clerkId: string,
  priceId: string,
  planName: Plan
): Promise<Stripe.Checkout.Session> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true, email: true } })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: user?.stripeCustomerId ?? undefined,
    customer_email: user?.stripeCustomerId ? undefined : (user?.email ?? undefined),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env['WEB_URL'] ?? 'http://localhost:5173'}/settings/billing?success=1`,
    cancel_url: `${process.env['WEB_URL'] ?? 'http://localhost:5173'}/settings/billing?cancelled=1`,
    metadata: {
      userId,
      clerkId,
      planName,
    },
    subscription_data: {
      metadata: { userId, clerkId, planName },
    },
  })

  return session
}

/**
 * Create a Stripe Billing Portal session so the user can manage their subscription.
 */
export async function createPortalSession(customerId: string): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env['WEB_URL'] ?? 'http://localhost:5173'}/settings/billing`,
  })
}

/**
 * Verify and parse a Stripe webhook event.
 */
export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const secret = process.env['STRIPE_WEBHOOK_SECRET'] ?? ''
  return stripe.webhooks.constructEvent(rawBody, signature, secret)
}

// Connect webhooks use a separate signing secret issued by Stripe for Connect endpoints
export function constructConnectWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const secret = process.env['STRIPE_CONNECT_WEBHOOK_SECRET'] ?? ''
  return stripe.webhooks.constructEvent(rawBody, signature, secret)
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutComplete(session)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdated(sub)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(sub)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentFailed(invoice)
      break
    }
    default:
      break
  }
}

// Handles Stripe Connect account lifecycle events (seller onboarding status)
export async function handleConnectWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      await handleConnectAccountUpdated(account)
      break
    }
    default:
      break
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.['userId']
  const planName = session.metadata?.['planName'] as Plan | undefined
  if (!userId || !planName) return

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planName,
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscriptionId ?? undefined,
      subscriptionStatus: 'active',
    },
  })
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.['userId']
  if (!userId) return

  const planName = sub.metadata?.['planName'] as Plan | undefined

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planName ?? undefined,
      subscriptionStatus: sub.status,
      stripeSubscriptionId: sub.id,
    },
  })
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.['userId']
  if (!userId) return

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: 'FREE',
      subscriptionStatus: 'cancelled',
      stripeSubscriptionId: null,
    },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { subscriptionStatus: 'past_due' },
  })
}

async function handleConnectAccountUpdated(account: Stripe.Account): Promise<void> {
  const sellerAccount = await prisma.sellerAccount.findUnique({
    where: { stripeConnectId: account.id },
  })
  if (!sellerAccount) return

  const onboardingComplete =
    account.details_submitted === true && account.charges_enabled === true

  await prisma.sellerAccount.update({
    where: { id: sellerAccount.id },
    data: { onboardingComplete },
  })
}
