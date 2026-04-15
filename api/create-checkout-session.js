import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCT_CATALOG = {
  "obsidian-travel-set": { name: "Obsidian Travel Set", unit_amount: 24000 },
  "atlas-weekender": { name: "Atlas Weekender", unit_amount: 32000 },
  "velour-signature-case": { name: "Velour Signature Case", unit_amount: 18000 },
  "eclipse-carry-wallet": { name: "Eclipse Carry Wallet", unit_amount: 9500 },
  "luxe-station-desk-set": { name: "Luxe Station Desk Set", unit_amount: 21000 },
  "noir-essence-kit": { name: "Noir Essence Kit", unit_amount: 15000 }
};

export async function POST(request) {
  try {
    const body = await request.json();
    const cart = Array.isArray(body.cart) ? body.cart : [];

    if (!cart.length) {
      return Response.json({ error: "Cart is empty." }, { status: 400 });
    }

    const line_items = cart.map((item) => {
      const product = PRODUCT_CATALOG[item.id];
      if (!product) throw new Error(`Invalid product: ${item.id}`);

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error(`Invalid quantity for product: ${item.id}`);
      }

      return {
        quantity,
        price_data: {
          currency: "usd",
          product_data: { name: product.name },
          unit_amount: product.unit_amount
        }
      };
    });

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "hosted",
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"]
      },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: "Standard Shipping",
            type: "fixed_amount",
            fixed_amount: { amount: 1200, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 5 }
            }
          }
        },
        {
          shipping_rate_data: {
            display_name: "Express Shipping",
            type: "fixed_amount",
            fixed_amount: { amount: 2500, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 2 }
            }
          }
        }
      ],
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return Response.json(
      { error: error.message || "Unable to create checkout session." },
      { status: 500 }
    );
  }
}
