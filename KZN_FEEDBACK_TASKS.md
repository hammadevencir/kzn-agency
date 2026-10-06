# KZN Feedback — Task List

Source: `KZN Feedback.docx` (client WhatsApp messages + 51 screenshots, received 2026-09-28).
`imgNN` = `word/media/imageNN.png` inside the docx (unzip it to view).

Legend: `[ ]` todo · `[~]` code for this already exists — verify on staging/mobile before touching · `❓` blocked on client input

---

## Open questions for client (blockers)

- ❓ **Discord**: the current invite has expired, and the client said they'll send a new one.
- ❓ **Slash USD bank details**: not provided. Only the Wise EUR details were sent (see B15).
- ❓ **KAZAN Scale fee**: the first message says **2.3%**, the pricing text says **2.2%**. Which one is right?
- ❓ **Prices for the other platforms** (TikTok, Google, etc.): the client said "I'll send later".
- ❓ **Pricing page "stuff below"**: the ad-guardians-style section, which the client said "I'll come with it soon".
- ❓ **Deadline**: the text says "before 21st Sept", but the messages are dated 28 Sept. Confirm the real date.
- ❓ **Help-center PDFs**: coming later. For now "Know more about it" should go to Messages (F8).

---

# PART 1 — FRONTEND ONLY (easy → hard) — implemented 2026-09-30, except F20 and the Discord link

No API, Firestore or rules changes needed.

### F1. Affiliate landing copy — img16
File: `components/sections/website/affiliates/AffiliatesBanner.jsx` (~L87, L90, L211)
- [x] "Thousands of affiliates…" → "**Hundreds** of affiliates…"
- [x] Change "25% discount on their first month" to **10%**.
- [x] Change "First Month 25% Off." in the referral card to **10%**.
- Tip: render `REFEREE_DISCOUNT_PERCENT` from `lib/affiliates/constants.js` (already 10) instead of hardcoding.

### F2. "25% off" in the subscription platform modal → 10% — img19
- [x] The "You got a discount on your first month because you were referred" box shows 25%. The checkout page already charges 10% correctly, so this is a **text-only** fix. Find the hardcoded 25 and use the constant.

### F3. Footer social icons — img13
Files: `components/footer/SocialLinks.jsx`, `Footer.jsx`
- [x] Remove the **TikTok** icon.
- [x] Add a **Telegram** icon linking to `https://t.me/kazansolutions`.
- [x] Link Instagram to the real IG account. All the entries are currently `href: "#"`. Also check the X, Discord, WhatsApp and Messenger entries.

### F4. Sidebar logo → dashboard — img39
- [x] Wrap the logo in `components/common-admin-manager/sidebar.jsx` (~L204) in a `Link`. It should go to `/user/dashboard` for users and `/admin/dashboard` for admins.

### F5. Header name/avatar → settings — img18
- [x] Make the avatar/name in `components/common-admin-manager/header.jsx` link to `/user/settings` (or `/admin/settings`).

### F6. Sign-up "User Notice" / "Privacy Policy" links — img10
- [x] Both links in `components/User/UserSignup.jsx` (~L229-237) are `href="#"`. Create simple static pages (e.g. `/user-notice`, `/privacy-policy`) or open them in a modal. Right now clicking does nothing.

### F7. Payment reference field + important note — img14
- [x] Change the Payment Reference placeholder to **"ENTER YOUR DASHBOARD ACCOUNT ID"**.
- [x] Add this note under the bank details, on **both** the EUR and USD views:
  > ⚠️ Important Notes: Please do not include words like "fb", "ad", "top-up", "order", or your name in the payment reference, this may cause issues with the bank and we can't process your top-up. You can simply write your Dashboard Account ID.
- Files: `components/payments/bank-details-card.jsx`, `pay-now-modal.jsx`, `top-up-upload-modal.jsx`

### F8. Services "Know more about it" → Messages
- [x] On the Services cards, "Know more about it" currently goes to the Help Center. Point it to **Messages** (`/user/chat`) until the PDFs exist.

### F9. "Paused" status badge in yellow — img38, img37
- [x] **Top-up table** (user): the status column shows green "Active" while the action column says "Paused". When the account is paused, show a **yellow "Paused"** badge in the status column.
- [x] **Subscriptions table** (user): same fix. Show a yellow "Paused" badge when paused.
- Files: `components/common-admin-manager/data-table.jsx` (status cells), `lib/user/map-user-subscription-row.js`

### F10. "Request Balance" → "Refresh balance" — img24, img26
File: `components/User/ad-accounts/ad-account-detail-sheet.jsx` (~L268)
- [x] Rename the button to **"Refresh balance"** and add the refresh icon (img24).
- [x] Add a small refresh icon next to the **Balance** value in the Top-up table rows (img25, blue circles).
- [x] On click, show a pop-up: **"In 5 minutes your balance will show up."**
- It keeps using the existing request-balance API. Only the wording and UX change, so it feels like a real-time tracker.

### F11. Affiliate "Claim Reward" anti-spam — img4
File: `components/User/affiliates/affiliates.jsx`
- [x] `hasPendingClaim` already disables the button. Verify it.
- [x] While a claim is pending, show **"Your request is pending"** in the spot marked by the green line (next to the balance).
- [x] Put "Minimum $100 balance required to claim." on **one line**.

### F12. Landing hero dashboard mockup numbers — img36
The dashboard preview on the home page (it may be a static image, in which case it needs re-exporting):
- [x] Change the red "Expired" status badge to a green **"Active"**.
- [x] Set **Active Referrals = 12** and **Top-ups this Month = 205**.
- [x] Set the leaderboard to #1 **$9.000.000+/spend**, #2 **$7.650.000+/spend**, #3 **$6.980.000+/spend**.

### F13. Contact popup ("Contact Us Now!") — mobile + links — img48, img49, img22
- [x] **Mobile alignment**: the "Get in Touch" and "Contact Us Now" contents aren't centred, and the rows overflow on the right.
- [x] **WhatsApp**: sometimes shows "invalid number". Use the `https://wa.me/31402291682` format (no `+` or spaces). The client also mentioned the `@kazansolutions` tag.
- [x] **Telegram**: t.me opens, but "Send message" says "address is invalid". Use `https://t.me/kazansolutions`, and check that any `tg://` link is formed correctly.
- [ ] **Discord**: ❓ waiting for the new invite link.
- [x] **Website (Submit a Contact Request)**: sometimes clicking does nothing and it goes back to the dashboard. That part is a frontend fix (handler/navigation). The send failure itself is B2.
- Files: `components/sections/website/ContactDialog.jsx`, `ContactForm.jsx`

### F14. Trustpilot reviews clickable — img6
- [x] In `components/sections/website/common/ClientReviews.jsx`, make each review card open the KAZAN Trustpilot page in a new tab. The auto-sync part is B17.

### F15. Show the plan name next to the platform — img47, first message
- [x] `top-up-upload-modal.jsx` already renders `data.planLabel`. Check it shows e.g. "Meta · White Hat · SILVER" in the top-up modal header.
- [x] Anywhere a "META" label appears, add " – (Subscription plan)" after it: dashboard top-up rows, top-up table, invoices.

### F16. Admin dashboard stat cards clickable — img20, innovation form
- [x] On `app/admin/dashboard`, link each card: Total Top ups → `/admin/top-ups`, Total Subscriptions → `/admin/subscriptions`, Total Users → `/admin/user-management`, Total ad accounts → `/admin/ad-accounts`.
- [x] Do the same for the user dashboard overview tiles (Total ad accounts, Active referrals, Top-ups this month, Total subscriptions).

### F17. Clickable notifications → deep link — img5, img35
- [x] Each notification in the bell dropdown should navigate to the related item:
  - top-up approved/rejected → that ad account / top-up
  - new ad account request, subscription request or reward claim → the matching admin page
- Check whether the notification payload already has type and id (`lib/notifications/*`). If it does, this stays frontend-only. If not, a small API change is needed.

### F18. Top-ups date range filter (admin + client) — img43, img29
- [x] Add a **From / To** date picker to the Top-ups page, plus presets: **Last 7 days**, **This Month**, and custom days.
- [x] Add it on both the admin (`components/common-admin-manager/top-ups/top-up.jsx`) and user (`components/User/top-ups/top-ups.jsx`) pages.
- It's frontend-only if the list is fully loaded on the client. If the API paginates on the server, add `from`/`to` query params (backend).

### F19. Affiliate page — new "earnings" block — img11
Fill the empty space above "Total Referrals" (blue box in img11):
- [x] **"Earn 15% of monthly fees passively."**, in large text.
- [x] **$17.470**, also large.
- [x] **"Reclaim your money"**, with the options: Crypto · Top-up your ad-account · Send to bank.

### F20. Full mobile QA pass (still open: contact popups, dialogs and new pages are fixed, but no device pass has been done)
- [ ] The client says "a lot of things seem bugging on site and on the dashboard" on phones. Check every public page and every dashboard page at 375px: tables, modals, sheets, sidebars and popups.

### F21. Public Pricing page (new) — img21, img27, pricing text
- [x] Create a new `/pricing` route, **English only** (no EN/NL toggle like the img21 reference). Use img21 and https://ad-guardians.com/pricing/ as layout references ("similar but way better").
- [x] Show **two clearly separated tracks**, so people see the difference:
  - **Agency Ad Accounts (general)**: START €199/mo + 2.8%, SCALE €599/mo + ❓2.2 or 2.3%, ELITE €899/mo + 1.8%. Include the copy from the doc ("Starting out or still testing? Start here." etc.).
  - **Supplements Agency Ad Accounts**: Essential €399/mo + 4%, Advanced €699/mo + 2.8%, Ultimate €1499/mo + 1.8%. Include the copy and the "Why Work With Us?" checklist (17 ✅ items in the doc).
- [x] Add a **LEGENDARY PACKAGE** card with an "APPLY FOR PRIVATE PRICING" button that opens the form (form backend is B19).
- [x] Add a Pricing link to the site nav.
- ❓ There is an extra "stuff below" section the client will send later.

### Already done in code — verify only
- [x] **Invoice download button** (img44): `DownloadInvoiceButton` exists in `components/User/invoices/invoices.jsx`. Check it's visible on the Top ups and Subscription tabs.
- [x] **Ad accounts grouped by plan** (img32, img26): the "All plans / Meta · White Hat · PLATINUM / …" chips exist in `components/User/ad-accounts/ad-accounts.jsx`. Check they're hidden when the user has only one plan.
- [x] **Plan label on ad account cards** (img7, "which one is VIP vs Silver"): cards show "White Hat · PLATINUM" (img26). Verify.
- [x] **Last Login column** in admin User Management (img45): it's in `user-management.jsx`, and `lastLoginAt` is written in `app/api/auth/session`. Verify it shows real values.

---

# PART 2 — BACKEND INVOLVED (easy → hard)

These need API routes, Firestore, rules, Firebase config, or pricing constants that the API also reads.

### B1. Google sign-in not enabled — img33, img41 (code fixed 2026-09-30; the two Firebase Console steps are still yours)
- [ ] Enable the Google provider in **Firebase Console → Authentication → Sign-in method**. The login page shows "Google sign-in is not enabled. Contact support."
- [ ] Add the Vercel domain (`kzn-agency-three.vercel.app` plus the prod domain) to **Authorized domains**.
- [x] Sign-up with Google shows "Something went wrong". Check the signup flow creates the `users/{uid}` doc with `role:"user"` even though no phone number was entered (phone is required on normal signup). Also add the case of an existing email/password user linking a Google account.

### B2. Website contact request fails — img28
- [x] Submitting the contact form gives "Something went wrong. Please try again." Debug `app/api/contact` (validation? missing env? the Country/Gender/request-type values?). Reproduce with the img28 values: Philippines, Prefer not to say, META Assets, "Profiles".

### B3. Admin top-up detail: fee + package — img30
- [x] In the admin top-up View Details sheet, add a **Top-up fee ($)** row (the profit on that payment), below the top-up amount.
- [x] Next to the Ad Account ID, show the **package/plan name**, so admins can recalculate the fee by hand ("we work with tiny margins").
- [x] Store `feePct`, `feeAmount` and `planLabel` on the `top-ups` doc when it's created, so the numbers are exact later. This is also needed for B21 Financial.

### B4. Ad-account request form: new fields — img42
- [x] Add a **Page URL** field after "Your Website link".
- [x] Add a **Creatives (Google Drive link)** field before "Can you tell me more about what you advertise?".
- [x] Update the field config in `lib/ad-accounts/platform-request-config.js`, check the request API saves the answers, and show them in the admin ad-account detail.

### B5. File upload broken in subscription / ad-account request — img34
- [x] Customers can't upload creatives in the "VIP – PLATINUM (SUBSCRIPTION)" request modal ("Upload here, Png, Jpeg").
  - Check whether the input is wired at all. The code map found **no file input in the request modal**.
  - Also check `storage.rules` and the upload API route.
- If the Google Drive link field (B4) replaces the upload, confirm with the client and remove the upload box.

### B6. Wrong ad-account count per subscription — img15, img7 (fixed 2026-09-30)
> Root cause of B6, B7, B8 and B9: subscription checks were per *platform* ("newest Meta doc wins"). A new ad account could be stamped with the other Meta plan's tier and fee, and the gate, pay popup and expiry pause used the wrong plan. Everything is now per plan: `subscriptionsForAdAccountScope` in `lib/user/plan-scope.js`, the Meta request page has a plan picker, and admins can re-link a wrongly-linked account via Ad Accounts → View Details → Plan.
- [x] The user has 1 White Hat SILVER account and 1 VIP PLATINUM account. Both subscription rows say **2**, and the VIP detail lists both accounts.
- [x] Count and list ad accounts by the **subscription/plan they belong to**, not by platform. Check the link field on `ad-accounts` (subscriptionId / planKey) and the subscriptions API mapping.

### B7. Top-up fee % calculating wrong — img47
- [x] A friend took Silver (3%) and Gold (2%), and both show **0%** in the Request top-up modal.
  - The fee comes from `data.topUpFee` on the ad account. The pricing snapshot is probably missing or wrong at approval time.
  - Fix the snapshot, and give the fallback the right plan fee instead of 0%.
  - Backfill the existing accounts.
- [x] Enforce the fee on the server in the top-up API. Don't trust the client's number.

### B8. Top-up possible from the dashboard while the subscription is unpaid — img46, img2
- [x] `app/user/dashboard/page.jsx` imports `topUpBlockReason`. Verify that the dashboard "Top-up →" action is blocked when the subscription is expired or unpaid. The ad-account page already blocks it (img2).
- [x] Add a **server-side** check in the top-up create API, so it can't be bypassed from any page.

### B9. "Pay subscription" popup appears too early — img31
- [x] After the first top-up is confirmed, the second top-up asks the user to pay the subscription even though it's brand new ("Your subscription has expired…").
- [x] Billing cycle = **28 days from purchase/approval**. Show the pay popup only when that 28-day period is due. Check how expiry is set in the subscription approve route, `lib/subscriptions/expiry-worker.js` and `functions/expiry-worker.cjs` (keep both in sync).
- [x] While there, fix "**$€499/mo**" in the Complete subscription payment modal, which shows both currency signs (ties in with B15).

### B10. Block new ad-account requests while the subscription is unpaid — img1
- [x] Apply the same rule as for top-ups to "Request New Account": disable it with a message, and reject it server-side, when the subscription isn't settled.

### B11. Top-up approved/rejected pop-up for customers — img35
- [x] Show a live toast/pop-up when an admin approves or rejects a top-up, so the customer doesn't have to open the bell.
- Notifications are derived on the fly, so this needs polling, an `onSnapshot` listener, or a push via the existing FCM setup (`lib/push/*`).
- Clicking the toast goes to that ad account (see F17).

### B12. "Payment not received" top-up status + receipt — img17, innovation forms
- [x] Add a new top-up status, **"Payment Not Received"** (red badge), that admins can set.
- [x] In the user Actions column, replace "In review" with **"Check Receipt"**, which opens the receipt they uploaded.
- [x] **Rule**: a user can't submit a new top-up while a previous one is "payment not received" or unsettled.
- [x] Admin: add a filter or tab for unsettled payments.

### B13. New users see only Subscriptions until payment is confirmed — img23
- [x] After sign-up, the sidebar shows only **Subscriptions** (and Messages/Settings). Once an admin confirms the first subscription payment, unlock Ad Accounts, Top-up, Invoices, Services, Affiliates, etc. ("feels more exclusive").
- [x] Enforce it in the user layout/sidebar **and** in `proxy.js`/API guards, based on a flag like `users/{uid}.hasActiveSubscription`.

### B14. Region choice on ad-account request (HK / Europe)
- [x] On "Request New Account", let users choose **Hong Kong 🇭🇰** or **Europe 🇪🇺**.
- [x] Show the notes **"HK = USD only"** and **"EU = EUR only"**.
- [x] Store the region on the request and ad account. Region then decides the top-up currency and bank details (see B15).

### B15. Currency choice for the monthly fee: EUR (Wise) / USD (Slash) — done 2026-10-02. The existing USD account (Column N.A.) is assumed to be Slash; confirm with the client.
Currently `lib/payments/bank-details.js` has only one USD wire account.
- [x] Customers choose the currency for the monthly fee. EUR shows the Wise details and USD shows the Slash details (❓ Slash details still needed).
- [x] Conversion: **€1 = $1.22**. Keep it as one constant, e.g. €499 → $609 (rounded).
- [x] **Wise EUR details** (from the doc):
  - **Option 1, bank transfer**
    - Beneficiary: KZ Digital Media Group LLC
    - IBAN: BE27 9059 1606 4973
    - Routing: 121145307
    - SWIFT/BIC: TRWIBEB1XXX (outside SEPA)
    - Beneficiary address: 30 N Gould St Ste R Sheridan, WY 82801-6317, US
    - Bank: Wise, Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium
  - **Option 2, Wise to Wise (preferred)**
    - Tag: @kzdigitalmediagroupllc
    - Link: https://wise.com/pay/business/kzdigitalmediagroupllc
    - QR code: img50. Save it to `/public`.
- [x] Store the chosen currency and amount on the subscription payment. Admin sees which account the money should arrive in.
- [x] Show the F7 "Important Notes" text in both views.

### B16. New pricing packages + automatic fee calculation — done 2026-10-02. White Hat → Agency (Start/Scale/Elite), VIP → Supplements (Essential/Advanced/Ultimate), Scale = 2.2%. Old tiers keep their price and fee until renewal, then move: Silver→Start, Gold→Scale, Platinum/Platinum Excl.→Elite, VIP Gold→Essential, Diamond→Advanced, Platinum→Ultimate.
- [x] Replace the Meta plan catalog (`lib/meta/meta-plan-catalog.js`, `platform-request-config.js`, `platform-subscription-pricing.js`) with the new packages:
  - **General**: START €199 / 2.8% · SCALE €599 / ❓2.2 or 2.3% · ELITE €899 / 1.8%
  - **Supplements**: Essential €399 / 4% · Advanced €699 / 2.8% · Ultimate €1499 / 1.8%
- [x] The dashboard and all flows use these packages, and the **top-up fee % is calculated automatically from the package** (after the B7 fix).
- [x] Decide what happens to existing White Hat / VIP subscribers: keep them grandfathered or migrate them.
- Other platforms: ❓ the client will send their prices.

### B17. Trustpilot reviews auto-sync — already built; set TRUSTPILOT_API_KEY and TRUSTPILOT_BUSINESS_UNIT_ID to switch on the live feed
- [ ] "Put an automation with all of our Trustpilot reviews that get added." Check `app/api/reviews/trustpilot` and `lib/reviews/trustpilot.js`. If they're static or seeded, add a scheduled fetch and cache, via the Trustpilot API or a scrape.

### B18. Admin sub-roles: Manager vs Customer Service
- [x] Add roles next to `admin`, e.g. `admin_manager` (sees everything) and `admin_support`.
- [x] Customer Service **can't see**: Settings, Affiliate Requests, Contact Requests, Financial (B21).
- [x] Touch points:
  - the `users/{uid}.role` values and the custom claim in `app/api/auth/session`
  - the `proxy.js` redirects
  - the admin sidebar items
  - **every** `app/api/admin/*` guard for those sections
  - `scripts/seed-admin.cjs` (or an admin UI) to create these logins

### B19. Legendary Package — private pricing application
- [x] Form fields (* = required):
  - Full Name*
  - Business Email*
  - Phone/WhatsApp*
  - Company/Brand*
  - Website
  - Niche*
  - Current Monthly Ad Spend* (dropdown: $500K–1M, 2M, 5M, 10M, $10M+)
  - Expected Monthly Spend with KAZAN*
  - **Upload last 30–90 days of ad spend*** (files)
  - "What are you looking for from KAZAN?"
- [x] Button text: "REQUEST MY PRIVATE QUOTATION". Include the confidentiality footer text from the doc.
- [x] Add a new `private-pricing-requests` collection, a Storage upload, an admin list/detail view (it could sit under Contact Requests), and an admin notification.

### B20. Satisfaction smileys → auto-message support + stats — img8
- [x] Add a 3- or 5-level smiley rating (img8 scale), used on orders (B22) and services.
- [x] Clicking a smiley sends an automatic chat message to support:
  - Happy: "I am happy about the service and the quality"
  - Average: no message
  - Poor: "Hi, I am not happy with the service and quality"
- [x] When the user is happy, show a Trustpilot review prompt.
- [x] Admin: show the average and distribution of smileys per service ("see how people feel about certain services").

### B21. Admin "Financial" section (new) — done 2026-10-02. Totals are calculated from existing records when the report is opened. Renewals overwrite the same subscription, so only each subscription's latest payment is counted; a per-payment ledger is a follow-up.
- [x] Track revenue and profit **per day**: subscription income and top-up fees (from B3's stored `feeAmount`), plus totals by period.
- [x] Track **money sent out** to Wise / Slash (payouts), so you can see net position ("financial strength").
- [x] Needs a new `financial-ledger` (or similar) collection written on each approval, plus manual payout entries. Add an admin page with charts and date filters.
- [x] Visible to Managers only (B18).

### B22. Shop + Orders system (largest) — img51, img9, img3, img40, img12, img8 — done 2026-10-02 with placeholder products in lib/shop/catalog.js
Replace "Services" with a **Shop**.
- **User side**
  - [x] The Shop lists all products and prices. Each category (e.g. Assets, img3) opens its product list.
  - [x] Clicking a product opens a "**Proceed with the order**" pop-up, then a "**Buy the item**" pop-up.
  - [x] Payment is **USD only**, via the Slash/USD account. Add the note: "services other than agency ad-accounts can't be sent to Wise". The user uploads a payment screenshot.
  - [x] New sidebar item **"Manage Orders"** (img12, under Help Center):
    - order status (pending / delivered)
    - cancel a subscription
    - **complaint**, which redirects to Messages
    - **"Great job"** button that marks the order delivered successfully
    - smiley rating (B20)
  - [x] When an order is delivered, notify the user: **"Hi friend, your (service) is delivered!"**
- **Admin side**
  - [x] New sidebar item **"Orders"** (img40, under Create KZN article), with tabs **New orders / Pending orders / Delivered orders** and count badges.
  - [x] Every order lands here. The admin fills in the delivery details and marks it delivered, which triggers the user pop-up.
  - [x] Show the average smiley score.
- **Data**: add `products` (or a constants catalog to start), `orders`, and a Storage path for payment proofs. Orders feed into Financial (B21).

---

## Suggested order of work
✅ Points 1 and 2 were done on 2026-09-30, and points 3–5 on 2026-10-02. Still open: Discord link, mobile device QA, Firebase Console steps, Trustpilot API keys.

1. **Blocker bugs the client is testing right now**: B1, B2, F13, B5, B6, B7, B8, B9.
2. **All the quick frontend items**: F1–F12, F14–F17.
3. **Payment rules**: B10, B12, B13, B3, B11.
4. **Pricing and currency**: B16, B15, B14, F21, B19 (needs the ❓ answers).
5. **New modules**: B18 → B21 → B20 → B22.
