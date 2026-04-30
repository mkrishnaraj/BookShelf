import Stripe from 'stripe'

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '', {
  apiVersion: '2024-06-20',
})

/**
 * Create a Stripe Connect Express account for a new seller.
 * Returns the Stripe account ID to be stored in SellerAccount.stripeConnectId.
 */
export async function createConnectAccount(userId: string, email: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    metadata: { userId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
  return account.id
}

/**
 * Generate an Account Link URL so the seller can complete Express onboarding.
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  })
  return link.url
}

/**
 * Transfer funds to a connected seller account after a sale.
 * `amount` is in cents.
 * `platformFee` is retained by the platform (already deducted from `amount`).
 */
export async function createTransfer(
  amount: number,
  connectedAccountId: string,
  platformFee: number
): Promise<Stripe.Transfer> {
  // The amount sent to the seller is amount minus platformFee
  const sellerAmount = amount - platformFee

  return stripe.transfers.create({
    amount: sellerAmount,
    currency: 'usd',
    destination: connectedAccountId,
  })
}

/**
 * Retrieve a Connect account to check onboarding status.
 */
export async function getConnectAccount(accountId: string): Promise<Stripe.Account> {
  return stripe.accounts.retrieve(accountId)
}

/**
 * Create a Stripe Checkout session for a marketplace purchase.
 * The platform fee is separated as an application_fee_amount.
 */
export async function createMarketplaceCheckout(opts: {
  listingId: string
  buyerUserId: string
  sellerConnectId: string
  amountCents: number
  platformFeeCents: number
  bookTitle: string
  shippingAddress?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: opts.amountCents,
          product_data: { name: opts.bookTitle },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: opts.platformFeeCents,
      transfer_data: {
        destination: opts.sellerConnectId,
      },
    },
    success_url: `${process.env['WEB_URL'] ?? 'http://localhost:5173'}/marketplace/orders?success=1`,
    cancel_url: `${process.env['WEB_URL'] ?? 'http://localhost:5173'}/marketplace/listings/${opts.listingId}?cancelled=1`,
    metadata: {
      listingId: opts.listingId,
      buyerUserId: opts.buyerUserId,
    },
  })
  return session
}
