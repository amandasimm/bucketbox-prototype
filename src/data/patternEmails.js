// "Add pattern emails" in the facilitator menu (brief items 2 and 6; Amanda, 2026-11-22): many
// emails from one sender, so the auto-archive suggestion (PRD F15) can be triggered on demand.
// PLACEHOLDERS drafted by Claude: generic bank notices, nothing real. Edit freely (not generated).
// 35 in all: 4 arrive today (to archive in Declutter) and 31 are spread over the past weeks,
// matching the PRD's "the other 31 emails from Chase".
export const patternSender = {
  sender: 'Chase',
  senderEmail: 'no.reply.alerts@chase.com',
}

export const patternTodayCount = 4
export const patternTotal = 35

// Cycled through for the 35 emails
export const patternTemplates = [
  {
    subject: 'Your Chase statement is ready',
    category: 'Updates',
    preview: 'Your monthly statement for your account ending in 0000 is now available to view...',
    body: 'Your monthly statement for your account ending in 0000 is now available to view online.',
  },
  {
    subject: 'Chase Alert: a purchase over $50',
    category: 'Updates',
    preview: 'A purchase of $64.20 was made with your card ending in 0000. If this was you, no action is needed...',
    body: 'A purchase of $64.20 was made with your card ending in 0000. If this was you, no action is needed.',
  },
  {
    subject: 'New Chase Offers added to your card',
    category: 'Promotions',
    preview: 'Earn cash back at stores you already shop at. Add the offers you like...',
    body: 'Earn cash back at stores you already shop at. Add the offers you like before they expire.',
  },
  {
    subject: 'Your payment is due soon',
    category: 'Updates',
    preview: 'A reminder that your card payment is due in 5 days. Your minimum payment is $25.00...',
    body: 'A reminder that your card payment is due in 5 days. Your minimum payment is $25.00.',
  },
  {
    subject: 'Your rewards summary for this month',
    category: 'Promotions',
    preview: "Here's how many points you earned this month and ways to use them...",
    body: "Here's how many points you earned this month and ways to use them.",
  },
]
