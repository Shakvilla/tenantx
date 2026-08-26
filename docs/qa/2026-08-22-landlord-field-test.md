# Landlord Field Test — 2026-08-22 / 23

Kwabena Osei-Mensah · 14 units, Adenta / Madina / East Legon · first contact with TenantX
Environment: local dev (`:3098`). Two sittings, ~2 hours on 22 August and ~2 hours on 23
August. **All seven chapters completed.**

> ## ⚠️ CORRECTION — read before the findings table
>
> Day one ended with me writing that the **Log In button did nothing** and that I was
> **permanently locked out of my own account**. That was the headline of the whole report and
> **it was wrong.**
>
> The operator checked the server afterwards: my seven login attempts **never reached it** —
> no request was ever sent. The cause was in my own browser tooling, which after a window
> resize was aiming clicks past the edge of the page. With the window put straight, Log In was
> pressed with a deliberately wrong password and behaved exactly as it should: the request
> went and **"Invalid credentials"** appeared on the screen. On day two my correct password
> got me in on the first press.
>
> **That finding is withdrawn** (see W1). It was not a defect in this product, and it must not
> be counted as one. What is worth keeping from it is only this: from where I was sitting I
> could not tell a broken button from broken equipment, because nothing on the screen
> distinguished them — and that is the same complaint as the rest of this report.
>
> Two more day-one findings were **disproved on retest** and are recorded as withdrawn: the
> Wallet renders correctly on a phone (W3), and Send MoMo Request is not silent — it fires and
> reports an error (W2). One was **confirmed** on retest and is worse than I thought: Onboard
> a Tenant (B7). **Every finding about money stands**, because those are numbers on screens,
> not button presses.

> ## ⚠️ READ THIS BEFORE CHAPTER 4
>
> **I could not buy this product. I was let through.**
>
> At the end of Chapter 3 I hit the Free plan's 5-unit limit halfway through my first
> compound. I went to pay — read the prices, did the arithmetic, chose Basic, entered my
> 14 units, filled in my MoMo number and pressed Pay for **GH₵135.00**. It failed. I tried
> Bank Transfer instead. It failed differently, and silently. **I never paid a cedi.**
>
> The operator then placed my account on **Pro, licensed for 14 units** so the test could
> continue. Everything from Chapter 4 onward is therefore on a plan **I was given, not one
> I bought.**
>
> **Nothing in Chapters 4–7 is evidence that the payment flow works.** It is evidence about
> what the product does *once someone else has paid for you*. The purchase path itself is
> tested in Chapter 3 and it does not work.
>
> Scope, stated honestly because I was told and it matters: this deployment has **no
> subscription payment gateway configured at all**, and neither does the ordinary
> development stack. So this is not one broken machine — on this deployment there is no way
> to buy a plan. **Whether the live production site can take a payment is unverified.** I
> did not test production and I am not claiming it is broken there.

---

## 1. The short version

Somebody on this team has actually stood in an Accra compound. The Ghana Post GPS address
handling and the "street, *if it has one*" line; the GRA stamp duty on the agreement and the
withholding-tax report that cites the Act and the filing deadlines; the arrears page with the
tenant's phone number on the row; guarantors as a real record; part payments that stay
part-paid; MoMo first everywhere; and a cash-flow forecast with a column for advance
renewals. Those are better than anything I have been shown and better than my exercise book,
and I would tell another landlord about them unprompted.

**Would I pay for it? Yes — ₵135 a month for fourteen units is fair, and I tried to.** I
could not: the MoMo checkout said the gateway was not configured and the bank-transfer
fallback told me to send ₵135.00 to an account it never showed me. Everything after that was
done on a Pro plan the operator gave me. **I have still never paid this company a cedi.**

**Would I rely on it? Not yet, and the reason is the money.** When I ask this product the one
question my business turns on — *how much have I got and how much of it is actually mine* —
it tells me ₵14,400 on four screens and ₵14,800 on a fifth, and the fifth is the right one.
It calls a twenty-four-month advance **"Total Earned — lifetime income received"** and reports
**net profit ₵14,070 at 97.71%, "Profitable this period"**, which is exactly how a landlord in
this country goes broke while thinking he is doing well. It forecasts ₵7,200 of rent over the
next year from a woman who has already paid to 2028. It saved my $800 East Legon rent as ₵800
after showing me a "Rent (USD)" label the whole time I typed, and that one wrong figure has
since spread into my vacancy total, my forecast and my P&L. And when I set the Earnings report
to January — months before my account existed — it reported ₵15,600 of revenue.

Underneath all of it sits one habit: **this product fails without telling you.** The sign-in
lasts fifteen minutes and when it dies the screen keeps its furniture and swallows every
click; buttons and menu items routinely need two presses with nothing to show the first one
failed; a small arrow collapsed the menu and put eleven pages out of reach for ten minutes. A
man who cannot tell "broken" from "signed out" concludes broken and leaves — I did, twice.

**Fix the silence and the money-truthfulness and I would close the exercise book the same
week.** As it stands today I would run both, which means paying ₵135 a month for a second
opinion.

---

## 2. Field journal

*(written chapter by chapter, at the time. Not tidied.)*

### Chapter 1 — Getting in

I typed the address and landed on a login box. That is all. "Welcome to Yiliora! 👋🏻 —
Please sign-in to your account and start the adventure."

Yiliora. I have never heard this word. Nothing on that page tells me what it is. Not
"property management". Not "rent". Not "landlord". If a friend had sent me this link and
said "try this", I would have no idea what I was signing into. There is no About, no
pricing, no "what this does", no link to anything except Forgot Password and Create an
Account. **A stranger cannot learn from this screen what he is being asked to join.**
And "start the adventure" — I am 52 with fourteen units. I do not want an adventure. I
want to know who has not paid.

Nothing on that screen said Ghana. No cedi sign, no Accra, no flag, no local name.
Pink-and-white, an emoji, English that reads like it was written somewhere else. It could
be a gym booking app.

Also: the left two-thirds of the screen is empty white. There is meant to be a picture
there — nothing loads. The form sits low, in the bottom half of the page. On my phone
that means I scroll past half a screen of nothing before I see anything.

**First real irritation.** I clicked "Create an account" and nothing happened. I looked at
the screen, nothing. I clicked again. *Then* it moved. It was just slow — but for about
three seconds I thought the link was dead, and my first instinct was that this thing is
broken. On one bar of signal at Adenta that pause would be much longer. There is no
spinner, no colour change, nothing to say "I heard you".

**The signup form.** Six fields: Full Name, Email, **Company / Organization Name***,
Phone, Password, Confirm Password.

The company name is compulsory and has a star on it. I do not have a company. I have
fourteen rooms and an exercise book. Yaw is not an employee, he is my caretaker. I sat
there for a moment wondering whether I should put my own name, and in the end I typed
"Osei-Mensah Properties", which is a business that does not exist and that I have just
invented for a form. Underneath it says "This will be your workspace name" — that told me
nothing at the moment I needed it. Say "What should we call your portfolio?" and let me
put "Kwabena's houses".

**Phone.** I typed `024 047 2060`, with the spaces, the way I write it and the way it is
printed on my card. It took it without arguing. **KEPT.** That is the first thing today
that behaved like it knows where I live. It is optional, and the hint says it is for
"login codes by SMS" — I will come back to that, because there is no SMS on this machine.

Pressed Create Account. This one was quick. Straight to "Confirm it's you — we sent a
6-digit code by email to a***@yahoo.com."

**KEPT:** it sent the code by *email*, not by SMS, even though I gave it a phone number.
That is the right call in Ghana where SMS is unreliable and costs the sender. If it had
insisted on the text message I would be stuck here permanently.

I cannot open that inbox myself. I am stopped at this screen waiting for someone to read
me the code. Standing here, looking at a box.

**Mobile check (375px):** the verification screen fits, text does not overflow, the box
and button are big enough for a thumb. But the content is dropped into the vertical
middle of a very tall page, so the top half of my phone is blank white and the code box
is level with my thumb only because the page is short. Not broken. Just wasteful.

**Chapter question — did anything on the way in tell you this was built for a Ghanaian
landlord?** One thing: the phone field took `024 047 2060` without a fight. That is it.
Everything else — the name, the tone, the compulsory company, the missing picture — could
have been built for anybody, anywhere. From the outside I could not tell this was for
renting at all.

*(paused at the verification screen, waiting on the emailed code)*

The code came. Typed six digits, pressed Verify, and I was in. Whatever else is wrong,
signup-to-inside took me one form and one code. That part is fine.

---

### Chapter 2 — First impressions

**The dashboard took twelve seconds to become useful.** I landed on a page of grey
rectangles — six boxes with no words in them, just grey bars where numbers should be. I
sat and watched grey boxes for a good ten seconds. I did not know whether it was loading
or whether the thing was empty and broken. Then, without me touching anything, a big
window jumped in front of everything: **"Set up your first property"**.

That jump is bad. I had already started reading the page. Twelve seconds late, a window
lands on top of what I am reading. If a real man is doing this at Adenta with his
motorbike running, he has already tapped something by then.

**But the wizard itself is good.** Five steps across the top — Add Property, Add Unit,
Add Occupant, Create Agreement, Generate Invoice. That is exactly the order a tenancy
happens in my life. Somebody who understands renting laid that out. **KEPT.**

And the very first field says: *"Required — enter a Ghana Post GPS code or search for the
address to set the region and district."* **Ghana Post GPS.** That is the first moment
today I thought: somebody here has actually stood in Accra. **KEPT, and it is the single
best thing I have seen so far.**

I pressed the X because I wanted to see what I had signed up for before I started typing.
It asked "Exit setup? You can resume later from the dashboard" with **Resume Later** and
**Skip Setup**. Good that it warns me. Bad that both buttons sound like leaving — I had to
stop and think which one keeps my place. Call them "Not now" and "Don't show me this
again".

**The dashboard underneath.** Total Properties 0. Total Occupants 0. Occupied Units 0.
Vacant Units 0. Reserved Units 0. Rent Collected **₵0.00**. Pending Payment **₵0.00**.

**KEPT: the cedi sign.** ₵0.00, not $0.00, not a blank. It knows what money is here.

**A number I do not understand, on my own dashboard, on day one:** *"Reserved Units — 0 —
Awaiting move-in, activate the agreement to occupy."* I have never in eleven years
described a room as "reserved". I have empty rooms and I have rooms with people in them.
And "activate the agreement to occupy" is not a sentence anyone says. I do not know what
this box counts or when it would ever be more than zero.

Also: **"Rents Expiring Soon — advance rent periods ending within 2 months."** That is
genuinely mine. Advance rent is my whole business, and something on this screen is
watching for it to run out. **KEPT.** That is a box I would look at.

Small thing that annoyed me anyway: the Rent Collected chart draws a flat **red** line
across an empty account. Red is the colour of a problem. I have not done anything yet.
Also "Rent Collected ₵0.00" but "Total Expenses: ₵0" — pick one and stick to it.

**Then the whole thing stopped responding.**

I went to the left menu to look at Subscription Plans, because seven items in that menu
have padlocks on them with little badges saying **Pro** and **Basic** — Members, Wallet,
Expenses, Communication, Utilities, Rent Reviews, Reports — and I have no idea what plan I
am on or what any of it costs. That is a fair question on day one.

I clicked Subscription Plans. Nothing. Clicked again. Nothing. A third time. Nothing.
I tried **Support** — nothing. I tried **Documents** — nothing. I tried the big purple
**Create** button at the top right — nothing.

**The entire left-hand menu is dead.** The only things that respond are the little arrows
that fold the menu groups open. Every actual page link does nothing at all — no spinner,
no error, no flicker. It just sits there. I clicked five different things across the
sidebar and the header and not one of them took me anywhere.

If this were my own money and not a test, **this is where I would have stopped.** Twelve
minutes in, a menu that does nothing when you click it is not a slow app, it is a broken
app, and I would have closed the tab.

I reloaded the page instead. The wizard came back on top — despite me choosing "Resume
Later" — and for a few seconds the whole page rendered as a tiny broken pile in the
top-left corner with the rest of the screen blank white. It sorted itself out, but I saw
it.

I never did find out what it costs.

**Mobile check (375px):** the dashboard becomes one enormous card per screenful. The
purple marketing paragraph — "Manage your properties, tenants and finances all in one
place, get insights with real-time analytics" — eats a third of my phone every single
time I open it. I do not need to be sold to after I have already signed up. Below it,
"Total Properties: 0" occupies its own half-screen. To reach **Rent Collected**, which is
the only thing I actually open this app for, I scroll past a banner and four boxes. On my
phone the money should be first and the sales talk should be gone.

**Chapter question — five minutes in, do you know what to do next without being told?**
Yes, but only because the wizard told me. Left to the dashboard alone I would have been
lost: every box says 0, none of them has a button on it saying "start here", and the menu
that would take me somewhere does not work. Take that wizard away and this screen is a
dead end.

---

### Chapter 2½ — the dead menu explained

I want to correct what I wrote above, and the correction is worse than the complaint.

The menu was not dead. **My session had expired.** I only found out because I resized the
window and the app dumped me back on the login page with an orange bar reading *"Session
expired. Please login again."*

So for those several minutes, every single thing I clicked — Subscription Plans three
times, Support, Documents, the Create button — was quietly failing because I had been
logged out, and **the app never told me.** No message. No redirect. It just sat there
looking normal and swallowing my clicks. I concluded the product was broken. It was not;
it had thrown me out and kept the furniture on the screen.

That is worse than an error, because an error I can act on. This taught me the app is
broken when it is not, and I would have told two other landlords the same thing.

And the timing: I had signed up **maybe fifteen or twenty minutes earlier**, and been
actively clicking the whole time. Whatever the timer is, it is far too short for a man who
gets a phone call in the middle of entering a tenant.

**KEPT:** logging back in was one form and no second email code — it remembered the
browser. That part is right.

---

### Chapter 3 — My first property

**The address. This is the best thing in the whole product and I want to say so first.**

I typed "Adenta" into the address box and it offered me *Adentan Municipal Assembly, 2nd
Adma Drive, Adenta, Accra* and *Adenta Municipal District, Greater Accra* — real places.
Then I tried the other route and typed a Ghana Post GPS code, `GD-183-5417`, and it
recognised it as a code, took it as a tag, and resolved to **Greater Accra › Adenta
Municipal District › Adenta**.

Then it showed me a City/area list containing **Adenta, Adjiringanor, Amanfro, Amrahia,
Ashaley Botwe, Borteyman, Dzen Ayor, Dzornaman, Fafraha Junction, Frafraha, Madina,
NanaKrom, New Legon, Nmai Dzorm, Ogbojo, Otanor, Tesa, Trasacco Valley.** That is my
district. Somebody who has actually been to Adenta built that list.

And underneath: **"Street / House Address — Optional — the building number and street, if
it has one."** *If it has one.* Eleven years I have been writing "the blue gate after the
junction" into forms that demand a street number. This is the first form that has ever
admitted my house might not have an address. **KEPT, and this is the thing I would tell
another landlord about.**

**Then it stopped understanding Ghana.**

*Property type* offers: House, Apartment, Residential, Commercial, Mixed Use. **There is
no "Compound House".** A compound house is the commonest rented building in this country —
one gate, one yard, one tank, rooms let separately. I had to call my Adenta compound a
"House", which is what you call the thing one family lives in. (And what is "Residential"
supposed to be, next to House and Apartment? Three words for one idea.)

*Unit type* offers: Studio, 1 Bedroom, 2 Bedrooms, 3 Bedrooms, 4+ Bedrooms, Commercial,
Office, Retail. **No single room. No chamber and hall. No self-contained.** Those are the
only three things I rent. So my single rooms are now "Studios" — which to anybody reading
this later means a self-contained flat with its own bathroom, and mine share a bathroom
with five other households — and my chamber-and-hall is a "1 Bedroom", which is not what
it is either. **Every unit in my portfolio is now recorded as something it is not.** That
is not cosmetic. When I come to argue with Rent Control about what a room is, this record
says the wrong thing.

**KEPT:** it let me name the unit **"Room 1"**. Not Apartment 1A. Free text. Good.
**KEPT:** rent is labelled **(GHS)**, and there is a Currency dropdown — *GHS — Ghana Cedi
(₵)* — which means I can put East Legon in dollars when I get there.

**Counting the clicks for eight rooms.** There is no way to say "this compound has eight
rooms, all the same". Every room is: press Add Unit, type the name, open Property and
pick, open Type and pick, open Status and pick, type the rent, press Add Unit. Seven
actions, one room. **And the form forgets everything between rooms** — it does not
remember that I am still adding to Adenta Compound, it does not remember the type, it does
not remember the rent, even though I have just told it four times in a row. That is the
thing that will make me stop using this. Eight rooms is about fifty-five actions. Forty
rooms would be a whole afternoon.

Also, the wizard did not ask for Status at all and this form makes it **required** with a
red error — for a brand-new empty room, which is obviously vacant. And the form calls it
"Available" while the list calls it "Vacant". Two words, one thing.

The list also comes back in no order at all: **Room 2, Room 4, Room 1, Room 3.** For a
compound that is genuinely irritating — I read my rooms in order, always.

**Then I hit the wall, at Room 6.**

The Add Unit button went grey. Hovering it: **"You've reached your 5-unit limit. Upgrade
your plan to add more units."** Clear and honest, and it disabled the button instead of
letting me fill the form and fail — I will give it that.

But understand where that wall is. It is **halfway through one compound**. Not after my
first property, not after my first ten units — at room six of eight, in the first building
I entered. I have fourteen units. I cannot get my smallest property into this system.
Adenta Rooms 6, 7 and 8 do not exist here, Madina does not exist, East Legon does not
exist, and I could not test any of them.

**So I tried to buy it. In detail, because this is where my money was going.**

Finding the prices was itself a fight — the Subscription Plans menu item never once
worked, and the "Upgrade now" button on the locked Communication page did nothing at all,
twice. The only button in the product whose entire job is to take my money **does
nothing.**

When I did get to the plans page, here is what it says:

| | Free | Basic | Pro |
|---|---|---|---|
| Price | Free, up to 5 units | **GH₵15 /unit/mo** | **GH₵30 /unit/mo** |
| Fee on collected rent | **2.0%** | 1.5% | 1.0% |

On **Free, all nineteen features are a cross.** Every one. Including Advance Rent
Collection, Caution Fees, Expense Tracking, and **Mobile Money Rent Collection.** The free
plan is a list of things you may not do.

**Mobile Money Rent Collection is Pro only** — ₵30 a unit a month. MoMo is how rent moves
in this country. Charging Pro money for it is like charging extra for the front door.
(And I still do not know whether "Mobile Money Rent Collection" means *they* collect it for
me, or just that I am allowed to write down that a tenant paid by MoMo. Nothing on the
page says. If it is the second one, that is outrageous. If it is the first, say so.)

**The 2% worries me more than the ₵15.** "2.0% transaction fee on collected rent." On
what, exactly? My rent roll is about ₵9,700 a month across fourteen units. Two per cent of
that is ₵194 a month, ₵2,300 a year — and most of that money never touches this company;
it is cash in my hand or MoMo straight to my own number. If they are taking a percentage of
money I collected myself, I want that said in one plain sentence, and it is not said
anywhere.

**Now the good part, and it is genuinely good.** I pressed "Upgrade to Basic Plan" and got
a proper checkout:

- "How many total units do you want to license?" — I typed **14**.
- **"Your first 5 units are free — you're only charged for units above 5."**
- Free units (first 5): no charge. Paid units: **9 (14 total − 5 free)**. Rate ₵15.00/unit/mo.
  Billing period 1 month. **Due today: GH₵135.00.**

Line by line, in cedis, with the arithmetic shown. I could check it in my head. **KEPT —
this is the most trustworthy screen in the product.** ₵135 a month for my whole portfolio
is ₵1,620 a year, which against a rent roll of ₵116,000 is defensible. I would pay that.

- **Payment method: Mobile Money first and selected by default.** Then Card, then Bank
  Transfer, then Wallet. **KEPT, and it matters enormously.** I do not own a credit card.
  Nor do most landlords I know. A product that put Card first would have lost me here.
- It shows **+233** and asks for the number. **FRICTION:** I typed `0240472060` the way I
  always do and it left it as `+233 0240472060` — with the extra zero. It did not strip it
  and did not warn me. That prompt is going nowhere.
- Bank Transfer explains itself honestly: *"Bank details will be shown after you click Pay.
  Your plan activates once an admin confirms the transfer — this can take longer than
  instant payment methods."* Straight talk. **KEPT.**

**And then I could not pay.**

- **Mobile Money → "Platform payment gateway not configured. Please contact support."**
- **Bank Transfer → "Awaiting your bank transfer. Transfer GH₵ 135.00 using the details
  below, then wait for an admin to confirm."** *Using the details below.* **There are no
  details below.** An empty grey box where the account number should be. It has asked me
  to send ₵135 and not told me where.

So: I read the price, I did the sums, I decided to pay, I filled in the form, I pressed
the button — and the product would not take my money. Twice, two different ways. I am
standing at the counter with cash in my hand and nobody will serve me.

**Mobile check (375px):** the units table on a phone is a wide table that scrolls
sideways. I can see Unit Number and Property. **Status and Rent are off the right-hand
edge.** The two things I open this list for — is it empty, what does it cost — are the two
I have to drag the table sideways to see. On a phone this should be a stack of cards, not
a spreadsheet.

**Chapter question — how long did eight units take, and would you do it again for forty?**
It did not take eight units, it took five, and then the door shut. Those five took me
somewhere near ten minutes of pure clicking, with no memory between rooms. **Forty units
this way? No. Absolutely not.** I would be at it for two hours, re-picking the same
property from the same dropdown forty times, and by unit fifteen I would be back in the
exercise book. Give me one screen that says "Adenta Compound, 8 units, Room 1 to Room 8,
single room, ₵600" and I will fill it in once and thank you.

---

### Chapter 3 (continued) — finishing the portfolio on a plan I did not buy

Somebody put my account on Pro. Every padlock in the left menu vanished and Add Unit went
purple again. **I want it on the record that I did not pay for this and could not have.**

**Rooms 6, 7 and 8 went in.** Same seven actions each, same forgetting between each one.
Adenta is complete: Rooms 1, 2, 4, 5, 6, 8 as single rooms at ₵600, Rooms 3 and 7 as
chamber-and-hall at ₵850. The list shows them in the order **7, 5, 2, 4, 6, 8, 1, 3.**
Still no sorting. My exercise book has them on eight consecutive pages in order.

**East Legon went in, and the address handling was excellent again.** I typed "East Legon"
and it offered East Legon Central Mosque on La Bawaleshie Road, East Legon 9 on La Road,
Nii Teiko Abbey Lane in East Legon Extension, East Legon Hills, and the East Legon Hills
Police Station on Adjei Kojo Santor Road. Real streets. I picked one and it filled in the
street, the region, the district and the city by itself and told me so in green:
**"Filled street, region, district and city from the address."** **KEPT.** That is the
second time today this product has impressed me and both times it was the address.

The amenity toggles on step 2 include **"24-hour Electricity — uninterrupted electricity
supply"** and **"POP Ceiling — modern POP ceiling finish"**. That is how houses are
advertised here, word for word. **KEPT.** Somebody local wrote that list.

**But this is a completely different Add Property form from the one in the wizard.**
Three steps, a review page, a Save Draft button — and different rules. The wizard said the
address was **Required**; this one says **Optional**. This one demands **Condition** (New /
Good / Fair / Poor) and **Bathrooms** and **Rooms**, none of which the wizard asked for at
all. And I do not know what "Rooms" means when "Bedrooms" is a separate box right next to
it — is it the hall? the kitchen? I guessed 4.

The review page shows me **"greater-accra"**, **"ayawaso-west"**, **"apartment"**,
**"good"** — raw lowercase words with hyphens, not "Greater Accra" and "Ayawaso West". And
it does not show the street at all, which is the one line I most wanted to check before
submitting.

**Then the app threw me out for the second time, and this one was much worse.**

I clicked "All Unit" in the menu and landed on the login page. No warning. Not even the
orange "session expired" note I got the first time — just gone. So I typed my email and my
password, carefully, and pressed Log In.

> **"Request failed with status code 401"**

That is the message. In red. To me, a landlord. It does not say "wrong password", it does
not say "try again", it says *request failed with status code 401*, which is a sentence
from a different world. I tried again. Same thing.

**Then I reloaded the page and I was straight back inside my account, still logged in,
having never entered a password.**

So the session was fine the whole time. The app dropped me onto a login screen for no
reason, then refused my correct password twice with a developer's error message, and then
let me back in when I reloaded. **If I did not know better I would think somebody had got
into my account and changed my password.** Ten minutes earlier I had been putting my MoMo
number into that same site. That is the moment my trust in this thing went, and it has not
come back.

Twice in under an hour. And I have not yet typed a single tenant's name.

---

**Now the worst thing I have found today, and it is about money.**

The East Legon lease is in **dollars**. The Add Unit form has a Currency box offering
**GHS — Ghana Cedi (₵)** and **USD — US Dollar ($)**, which is exactly right — those are
the only two currencies in my life. I picked USD. The rent box **relabelled itself to
"Rent (USD)"** as I typed. I entered **800**. I saved it.

The units list shows: **Main House · East Legon Self-Contained · ₵800.**

I opened the unit to check. The Edit screen says **Currency: GHS — Ghana Cedi (₵)** and
**Rent (GHS): 800.**

**My dollar rent has been silently recorded as cedis.** Eight hundred dollars is somewhere
around twelve thousand cedis. This system now believes my East Legon flat earns me ₵800 a
month. It is out by a factor of about fifteen, on my most valuable property, and it did it
without a word of warning — it showed me the USD label the whole time I was typing and
then threw the choice away on save.

I want to be plain about what that means for me. If I look at this list in six months and
work out what East Legon is worth, I will be wrong by roughly **₵135,000 a year**. If I use
this to argue with the company that leases it, I lose. If I use it to decide whether to
sell, I sell the wrong building. **A currency box that accepts a currency and does not
keep it is worse than having no currency box at all**, because at least then I would know
to do the sums myself.

That is a Critical, and on its own it would stop me putting my real portfolio in here.

---

### Chapter 4 — My first tenant

Akosua Boateng into Room 1. ₵600 a month, two years paid up front, ₵600 caution, a
guarantor, and a two-year agreement. This is the chapter that decides whether the product
understands my business, so I pushed hard.

**Two buttons, and I did not know which one was mine.** The Occupants page offers
**"Onboard a Tenant"** and **"Add Occupant"** side by side, unexplained. The whole app
says "occupant" everywhere else, so "Add Occupant" ought to be the main one — but I want
to *onboard a tenant*, so I pressed that. It turned out to be the right one. It was a
guess.

**The onboarding flow itself is good.** Three steps — Tenant & Home, Lease terms, Move-in.
Pick property, pick unit, name, phone, move-in date. **KEPT.**

**Email is still compulsory.** Akosua sells cloth at Adenta market. She has a phone. She
does not have an email address and if I asked her for one she would look at me. **I had to
invent one**: `akosua.boateng@gmail.com`. It is not hers. It does not exist. It is now
permanently attached to her record, it is what the system will use to "send" her invoices
and receipts, and if that address happens to belong to a real stranger then I have just
put my tenant's rent details on their doorstep.

That is not a small thing. **Of my fourteen tenants I could give you a genuine email for
two.** So twelve of my records would carry a fiction. And the system knows how to do this
properly, because — see below — its own **guarantor** form makes phone required and email
optional. Somebody got it right on one screen and wrong on the screen that matters most.

**Step 2, lease terms, was genuinely well done.** It said *"We've pre-filled the rent and
dates from the unit"* and it had — ₵600 already in the box. **KEPT: I did not have to type
her name or her rent twice.** There is a **Security deposit** field, which is my caution
fee (wrong word for Ghana — everybody here says *caution fee* — but the field exists). I
put ₵600. I changed the end date to 22/08/2028 to make it the two years it actually is.

**But there is nowhere to say the rent was paid in advance.** Payment frequency offers
**Monthly, Quarterly, Yearly, One-time** — and none of those is what happens here. My rent
*is* ₵600 monthly; what is unusual is that she handed me twenty-four of them this morning.
Frequency and advance are two different facts and this form only has room for one.

**Step 3 was the best-written screen so far.** *"Almost done. Is Akosua Boateng moving into
Unit Room 1 now? Activating marks the unit as occupied and counts the tenant in your
dashboard. Only activate on (or just before) the day they actually get the keys — otherwise
keep it pending and activate it later."* Plain English, uses her name, explains the
consequence. **KEPT.** And it finally explained what that "Reserved Units" box on the
dashboard meant — three chapters late, but explained.

Finished, and got: *"Akosua Boateng has moved into Unit Room 1. The lease is active and the
unit is now marked occupied. The natural next step is the first rent invoice."* Honest,
specific, no lying. Compare that to the wizard's "You're all set, your occupant and first
invoice are ready" when I had skipped all three.

**The guarantor. They got this right and I want to say so loudly.**

There is a whole tab called **"Guarantors / Sureties"** on the tenant. Not a notes field. A
proper place, with First Name, Last Name, **Relationship to Tenant**, **Phone (required)**,
**Email (optional)**, Employer, Job Title, Work Address, Notes. I put in Kofi Mensah on
0201 445 908 and it saved and displayed cleanly.

**KEPT, and this is the second-best thing in the product.** When a tenant vanishes, the
guarantor is all I have. Most software treats him as an afterthought. This does not. And
note again — **phone required, email optional**. Exactly right. Which is why the tenant
form demanding an email is so annoying: they clearly know better.

**The agreement — and then something genuinely impressive.**

It created **AGR-2026-001** by itself, Lease, 23/08/2026 → 22/08/2028, without me asking.
Opening it shows Occupant, Property/Unit, Rent ₵600, Security Deposit ₵600 — and then
this:

> **Stamp Duty (GRA)** — Lease Duration: **24 months** · Total Lease Value:
> **GH₵14,400.00** · Stamp Duty Rate: **0.5%** · Estimated Stamp Duty: **GH₵72.00**
> *"Stamp duty of 0.5% on the total lease value must be paid to the GRA within 30 days of
> executing this agreement (Stamp Duty Act, 2005). This is an estimate — consult a legal
> professional for exact figures."*

**I have been a landlord for eleven years and no software has ever told me that.** It
worked out my two-year lease value as exactly ₵14,400 — the number I came looking for — and
it knows the Act, the rate and the thirty-day deadline. **KEPT. This is the strongest
single thing in the whole product** and if they are looking for the sentence to put on the
front page, that is it.

Two complaints even so. First, the same screen shows **"Total Amount: GH₵600.00"** right
next to **"Total Lease Value: GH₵14,400.00"**, and I had to stare at it to work out which
was which. Second, at the bottom it declares **"This agreement is legally binding and
enforceable."** There is no signature on it, no witness field, and nowhere on that screen to
attach the stamped paper we both signed. In Ghana an agreement is written, stamped and
**witnessed**. A database row is not a binding agreement and the product should not tell
me it is.

**Recording the ₵14,400.**

There is no "advance" anywhere, so I made an invoice. Create → New Invoice. The
**Invoice Type** field is **free text** ("e.g. Monthly Rent") — so I typed "Rent Advance -
24 months" and the system stored it as a phrase, not as a meaning. It will never be able
to reason about it. Amount ₵14,400, description saying it was two years cash in hand.

Then **Add Payment**, and this is where it shines again:

- **Payment method defaults to Mobile Money, and the network defaults to MTN MoMo.**
  The order is MoMo → Cash → Cheque → Bank Transfer. **KEPT.** That is my country's order,
  not somebody else's.
- I switched to **Cash**, put the date, and wrote in the notes: *"Two years advance, cash
  received hand to hand at the compound. Counted in front of her brother Kofi Mensah."*
- Saved. Invoice went to **Paid**, balance ₵0.00, and Payment History shows
  **Cash · 23 Aug 2026 · my full note · RECORDED · ₵14,400.00.**

**KEPT — that is traceable to a person, a date, a method and a witness.** That is the thing
I could not do with my exercise book after the year I lost to a dispute. If the rest of the
product were this good I would pay for it today.

**Then the receipt.** There is a **Receipt** button on the payment. I pressed it. Nothing.
I pressed it again. Nothing — no window, no download, no message. Just a little tooltip
saying "Open printable receipt". I tried **Print / Save As PDF** on the invoice instead.
Also nothing. **My tenant will ask for a receipt before she leaves the yard, and I cannot
produce one.** For a cash payment the receipt is not a nicety, it is the entire proof.

I did **not** press "Send Invoice", deliberately: it would fire a real email to an address I
made up, which might belong to a real person.

**The caution fee has vanished into thin air.**

I put ₵600 as the Security Deposit on the lease. It shows on the agreement. And that is the
end of it. **It is not money anywhere.** It is not in the wallet, not in the ledger, not a
balance I am holding, not a liability. There is no screen that says "you are holding ₵600
of Akosua's money". And I was never asked to record actually *receiving* it. So the ₵600
in my pocket exists in this system only as a number printed on a lease. When she leaves in
two years and we argue about the cracked louvre blades, I will have nothing to point at.

**Documents: I cannot file the agreement where the tenant is.** Her **Documentation** tab
says "No documents available" and **has no upload button at all.** There is a separate
Documents section in the main menu that does have one, and its type list includes **"Signed
Tenancy Agreement"** (**KEPT** — right name) and it can link the file to the agreement
(good). But it has **no "Ghana Card" or national ID type.** I have taken a photocopy of
every tenant's Ghana Card for eleven years; it is the single most common document in my
folder, and the list offers Employment Letter and Business Registration but not that. I
had no file on this machine so I could not complete an actual upload — recording that as
untested rather than guessing.

**The Wallet — the best writing and the worst number in the product, on one screen.**

The good, and it is very good:

> **"GH₵14,400.00 collected outside Yiliora — Cash, cheque and bank payments you recorded.
> That money already reached you directly, so it is counted in your records but cannot be
> withdrawn here."**

**KEPT.** That is honest. It is not pretending to hold my cash, it explains *why* the
button is grey, and it is written like a person talking to me. Best sentence in the
product. The ledger under it shows the payment traceable by date, invoice number and
tenant.

And then, directly beside it:

> **TOTAL EARNED — GH₵14,400.00 — "Lifetime income received"**

**No. I have earned nothing.** Akosua moved in this morning. I have *collected* ₵14,400
and I have *earned* about ₵20 of it. That money is twenty-four months of somebody else's
housing that I have not yet provided. If she leaves in month three I owe her twenty-one
months back — it is closer to a debt than to income.

This is the exact distinction I said at the start decides whether a landlord is solvent or
only thinks he is. The product got **"collected outside Yiliora"** beautifully right and
then, in the box immediately next to it, called the same money **"earned"**. A man who
reads "Total Earned ₵14,400" in August and spends it has no rent coming in until 2028 and
does not know it yet. **That is how landlords in this country get into trouble, and this
screen would help them do it.**

**Mobile check (375px): the Wallet page is blank on my phone.** Purple header, then a grey
void down to the footer. No balance, no ledger, nothing. It did the same on the desktop
after sitting a moment. The one screen in this product that answers "where is my money" is
the one I cannot see on the device I actually carry.

**Chapter question — if this tenant disputed the advance in two years, could you produce
proof from this system?**

**Partly, and not the part that matters most.** I could produce: an invoice numbered
INV-2026-001 for ₵14,400, marked Paid, dated 23 August 2026, against Akosua Boateng in
Adenta Room 1; a payment record saying Cash with my note naming her brother as witness; and
agreement AGR-2026-001 running to 22/08/2028 with the lease value of ₵14,400 on it. **That
is real evidence and it is far better than my exercise book.**

But I could **not** hand her a receipt on the day, which is what she will ask for and what
Rent Control will ask me for. I could not attach the signed, stamped agreement. And I
could not show that I hold ₵600 of her caution fee. So: better than the book on proof of
payment, no better on proof of the deposit, and worse on the one document — the receipt —
that a cash-paying tenant actually walks away with.

---

### Chapter 5 — Money coming in

**First: I could not add a second tenant. At all.**

I pressed **"Onboard a Tenant"**. Nothing. Pressed it again. Nothing. Tried **"Add
Occupant"** — nothing. Tried **Create → Onboard a Tenant** — nothing. Reloaded the page and
tried again. Nothing. Changed the window size and tried again. Nothing. **About ten
attempts, three page loads, three window sizes.** No dialog, no error, no spinner.

The page was not frozen: I brushed the little sun icon by accident and the light/dark menu
opened instantly. **It is those two buttons specifically, and they worked exactly once —
for my first tenant — and never again.**

I also watched the whole page **draw itself at half size in the top-left corner** with the
rest of the screen empty grey, more than once. When it does that the buttons are not where
they appear and clicking does nothing. Resizing the window makes it redraw. A landlord does
not know to do that; he concludes the app is broken. I did.

So Adenta has eight rooms and one tenant. **Everything below is therefore done against
Akosua month by month instead of against four different tenants.** It exercises the same
mechanics — part payment, MoMo, arrears — and I am saying so plainly rather than pretending
I had four tenants.

**Test 1: does it know she has already paid two years in advance? No.**

I raised a **September 2026 rent invoice for ₵600** against the same woman who handed me
₵14,400 covering August 2026 to August 2028 about forty minutes earlier. It created it
**without a murmur.** No warning, no "this tenant is paid to 22/08/2028", nothing.

The advance is not a concept here, it is a large invoice with a phrase typed in a box. So
if I ever switch on monthly billing, **this system will invoice Akosua ₵600 every month for
two years for rent she has already paid**, and my arrears will climb by ₵600 a month
against a tenant who owes me nothing. That is me knocking on the door of a woman who is
paid up to 2028.

**Test 2: the part payment. This works, and it matters that it works.**

Akosua brought ₵400 of the ₵600 in cash — the classic trader's payment, rest after market
day. Recorded as **Cash**, note: *"Part payment. She will bring the remaining GHS 200 after
market day."*

Result: **Total Due ₵600.00 · Balance ₵200.00 · Status: Partial.** It did **not** flip to
Paid. Payment History shows the ₵400 with date, method and my note. **KEPT — third-best
thing in the product.** Most systems treat any payment as full payment. This one holds the
₵200 and says so.

**Test 3: the MoMo payment does absolutely nothing.**

I went to take the last ₵200 by MoMo — how most of my rent actually arrives. The panel is
right: **Mobile Money selected by default, MTN MoMo as the network**, wallet number box,
and *"Customer will receive a prompt to approve on their phone."* Exactly what I want.

I typed her number and pressed **Send MoMo Request**. **Nothing.** No spinner, no error, no
confirmation. Pressed again and waited. **Nothing.** Twice, in silence.

Understand what that is. **Mobile Money Rent Collection is the Pro-only feature** — ₵30 per
unit per month, the single reason a Ghanaian landlord buys the top plan. It does nothing
and says nothing. The *subscription* MoMo screen at least said "payment gateway not
configured"; here there is not even that. **Silence is the worst possible failure on a money
button**, because I cannot tell you whether a prompt reached her phone. If I assumed it
had, I would mark her paid and be ₵200 down.

And again the number: I typed `0244118227` into a box already showing **+233**, and it kept
**+233 0244118227** — extra zero, no warning. Second time, second screen.

**Test 4: the tenant who does not pay. The system will not tell me.**

I raised a **July 2026 invoice, ₵600, due 05/07/2026**, unpaid. Today is 23 August. That
bill is **seven weeks overdue.**

The Invoices page says: **"Overdue Invoices: 0 — Past due date."**

It had sat as **"Draft"**, which I did not expect — I created it, so I assumed it existed.
Nothing told me a Draft is invisible. I found a little pencil and set it to **Pending**. It
is now Pending, ₵600 outstanding, seven weeks late — and the counter **still says Overdue:
0.** I pressed Refresh. Still 0.

Worse: the same panel says **"Total Invoices: 2"** with three invoices listed underneath,
and **"Pending Invoices: 0"** with one plainly marked Pending in the row below. **The
summary boxes on the invoice page are wrong and stay wrong after a refresh.** Those boxes
are the first thing I look at.

**Then two screens gave me two different answers about my own money.**

- **Dashboard → "Rent Collected — total amount collected this month": ₵14.40K**
- **Wallet → "collected outside Yiliora": GH₵14,800.00**

I collected ₵14,400 and then ₵400, both today, both cash, both recorded. **₵14,800.** The
wallet agrees. The dashboard is **₵400 short.**

**A number I cannot trace back to a person and a date is worse than no number.** I now have
to check this thing against my exercise book — which means two sets of books instead of one,
the exact opposite of what I was sold.

And **"₵14.40K"** — do not do that to me. My money is ₵14,400.00. Write it out. When I check
a figure I count the digits; "14.40K" is a figure I cannot count.

**What the dashboard got right:** **"Pending Payment — Amount due and overdue payments:
₵800.00."** That is ₵600 July unpaid plus ₵200 September balance. **Exactly right.** So the
arrears arithmetic works on the dashboard while the invoice page's own counters say zero.
Two screens, two answers, and the wrong one is on the page named Invoices.

**Recent Activity is now real and good:** *"Payment received · 12m ago · GHS 400.00 received
for invoice INV-2026-002 from Akosua Boateng"*, the ₵14,400 above it, and *"New occupant
added — Akosua Boateng was added to unit Room 1."* **KEPT.** Names, amounts, invoice
numbers, times. A feed I would actually read.

**Can I send the tenant anything?** There is a **Send Invoice** button, a **Communication**
section, and the plans list **SMS Reminders** and **WhatsApp Reminders** — the right list,
since my tenants live on WhatsApp. **I did not press Send**: the email on Akosua's record is
one I invented and may belong to a real person. Recorded as untested, deliberately.

**Then it threw me out for the third time.** "Session expired. Please login again." Three
times in one sitting, working continuously throughout.

**Mobile check (375px):** I went to look at who owes me money on my phone and got the login
screen instead. That is the check, really — third logout, on the phone, in the middle of the
one question I open this app to answer.

**Chapter question — at the end of this month, do you trust the arrears figure enough to go
and knock on a door because of it?**

**No** — and one of the figures is actually correct, which is what makes it worse.

The dashboard's ₵800 is right. But the page named Invoices tells me **Overdue: 0** when a
bill is seven weeks late, and says there are two invoices when there are three. And the
dashboard's "collected" is ₵400 adrift from the wallet's.

Three screens, and I would have to check all three against each other before walking to
anybody's door. **If I have to check the software, I do not have software — I have a second
exercise book that argues with the first one.** I would knock because of my book, not
because of this.

---

### Chapter 5½ — I was not locked out. A correction, and three retests.

*(written the next morning, 23 August, back inside my account)*

I have to correct the worst thing I wrote yesterday, and I want it at the top of this
section because it was the headline of my whole report.

**I was never locked out.** The operator checked the machine afterwards: those seven
presses of Log In **never reached the server at all** — no request was sent. The cause was
in the tooling I was using to drive the browser, not in the product: the window had been
resized and my clicks were being aimed at where the buttons *used to be*, so they were
landing past the edge of the page and hitting nothing. With the window put straight, Log In
was pressed with a deliberately wrong password and it behaved exactly as it should — the
request went, and **"Invalid credentials"** came back on the screen.

This morning I logged in with my correct password on the first press. Straight into my
dashboard. Akosua, the ₵14,400, the agreement, both properties — all exactly where I left
them.

So **finding B1 is withdrawn.** I said the product had my money hostage behind a dead
button and that I would never come back. That was wrong, and it was wrong because I could
not tell a fault in my own equipment from a fault in the product. I am recording it as
withdrawn rather than deleting it, because "the customer could not tell the difference" is
itself worth knowing — but it is not a defect in this software and it must not be counted
as one.

That correction sharpens the rule I now hold myself to for the rest of this run: **read the
page fresh, press by name, never at yesterday's coordinates.** Everything below was done
that way.

**What does NOT change.** Every finding where the server actually answered me still stands,
because the answer is the evidence:

- **"Request failed with status code 401"**, in red, on my login screen. That is a real
  message the product really put in front of me. It is a developer's sentence handed to a
  landlord. Whatever caused it, no customer should ever read that.
- **Being thrown out mid-session, repeatedly.** That happened, with the orange "Session
  expired" bar to prove it.
- **Every finding about money** — the USD rent saved as cedis, "TOTAL EARNED" on an advance
  I have not earned, ₵14.40K against the wallet's ₵14,800, Overdue: 0 on a seven-week-old
  bill. Those are numbers on a screen, not button presses. They are untouched.

---

**Retest 1 — "Onboard a Tenant". Confirmed broken.**

I went to Occupants to put a tenant into Room 4, since it is Room 4's toilet that blocks in
the next chapter.

First press after logging in: **it opened.** Three steps, Property, Unit, Email, Phone,
First name, Last name, Move-in date. Good.

Then it died in my hands. I picked **Adenta Compound** from the Property list and the box
went back to empty. I opened the list again — it would not open. I pressed the **X** to
close the whole thing — it would not close. I had to hit Escape on the keyboard to get out
of a window whose own close button had stopped working.

And from that moment on, **the button will not open it again.** I pressed "Onboard a
Tenant" twice more. Nothing. I reloaded the page completely and pressed it. Nothing. I
reloaded again and pressed it. Nothing. I pressed **"Add Occupant"**, the other button, in
case that one still worked. Nothing. **Eight presses, three full page loads, and it opened
exactly once — the first press after I signed in.**

I want to be exact about the conditions, because yesterday I could not be: the window was a
steady size, the page was drawn correctly and completely, I read the screen fresh before
every single press, and I pressed the button by name. It still does nothing, and it still
says nothing.

**So B7 is not withdrawn. It is confirmed on retest, and it is worse than I thought** —
because now I know it is not "this button never works". It is "this button works once and
then quietly stops", which is far harder for a customer to make sense of. The first time I
saw it I assumed I had done something wrong.

**And I saw the half-size render three more times, plainly.** Every hard reload of the
Occupants page painted the whole application into the top-left corner at about half scale,
with the rest of the window empty grey. It corrects itself if I change the window size. A
man on a phone cannot change his window size. He sees a tiny broken-looking page and closes
it.

Adenta still has one tenant in eight rooms, on the second day of trying.

---

**Retest 2 — "Send MoMo Request". Half disproved, and the half that remains is still bad.**

Akosua's September invoice, INV-2026-002, ₵600 due, ₵200 outstanding after her part
payment. Add Payment. The panel came up and it is still the best-designed money panel in
the product: **Invoice Balance ₵200.00** already filled in, **Payment Amount ₵200.00**
already filled in, **Mobile Money (MoMo)** already chosen, **MTN MoMo** already chosen, and
under the number box, *"Customer will receive a prompt to approve on their phone."* I did
not have to tell it anything except her number.

I typed her number and pressed **Send MoMo Request**.

**It did not stay silent this time.** A red bar came up at the bottom of the screen saying:

> **"…form payment gateway not configured for: REDDE"**

I pressed it a second time and got exactly the same thing. So the button works. It sends,
it fails, and it tells me. **I was wrong yesterday to call it silent, and I withdraw that
part of the finding.**

But look at what it actually told me. Two things are wrong with that sentence.

First, **I cannot read all of it.** The red bar comes up in the bottom-right corner and the
payment panel I am standing in covers its left edge, so the first word is hidden. I am
reading *"…form payment gateway not configured"*. I had to guess it says "Platform".

Second, **"REDDE"**. I do not know what REDDE is. It is not MTN, it is not Telecel, it is
not AirtelTigo, it is not a word in my life. My tenant is standing in front of me waiting to
know whether the prompt has gone to her phone, and the software has answered me with the
name of something inside itself. Say *"Mobile Money collection is not switched on for this
account — record the payment as Cash instead."* Then I know what to do next.

And the third thing, which is not about the message at all: **the feature does not work.**
Mobile Money Rent Collection is the Pro-only line item at ₵30 per unit per month. I am on
Pro. It cannot take a cedi. That is the same wall I hit at the subscription checkout
yesterday, and it means the single feature a Ghanaian landlord would buy the top plan for is
not available on this deployment. I still cannot say whether it works on the real site.

**And the phone number did it again.** The box shows **+233**; I typed `0244118227`; it kept
**+233 0244118227**. The extra zero, still there, still no warning. Third time now.

**The Receipt button, retested: still nothing.** Same page, freshly read, pressed by name,
twice. The little tooltip "Open printable receipt" appears and nothing opens — no window, no
new page, no download. I also pressed **Print / Save As PDF**: nothing I could see. **My
cash tenant still cannot walk away with a piece of paper.** That finding stands exactly as
written.

---

**Retest 3 — "Upgrade now". I cannot retest it, and I found something worse instead.**

The "Upgrade now" button I pressed yesterday lives on a *locked* feature page. I am now on
Pro, courtesy of the operator, so nothing in my account is locked and that button does not
exist for me any more. **I am recording it as untestable rather than confirmed or
withdrawn.** I will not guess.

What I could test is the road to it, and half of that is still wrong. **The sidebar's
"Subscription Plans" needed two presses.** The first press did nothing at all — I was still
looking at Akosua's invoice. The second press took me straight there. That matches
yesterday, and it is not only this menu item: the invoice number **INV-2026-002** in the
list also took two presses to open. **Menu and link clicks in this product are a coin toss,
and the failed press gives you nothing to tell you it failed.**

When the plans page did open, it told me plainly where I stand: **Pro Plan · ACTIVE ·
GH₵30.00 / unit / month · renews 23 Sept 2026 · 1.0% transaction fee on collected rent ·
Units used 9 / ∞.** Clear. And the Free card is honest about why I cannot go back:
*"Downgrade to Free Plan — You have 9 units and this plan allows 5. Remove 4 units to
switch."* **KEPT.** That is how you say no to somebody.

**Then I saw the Billing History and it stopped me.**

> **23 Aug 2026 – 22 Sept 2026 · UPGRADE · 9 units · GH₵ 135.00 · PENDING · 23 Aug 2026**
> — with two buttons: **Verify** and **Pay from wallet**.

That is yesterday's purchase. The one that failed. The one where the gateway was not
configured and the bank transfer showed me an empty box instead of an account number. **It
has left a bill of GH₵135.00 sitting on my account marked PENDING**, and nothing on that
row tells me whether I owe it, whether it will be chased, or whether it is simply rubbish
left behind by a payment that never happened.

It is also for the wrong thing. That ₵135 is nine units at the **Basic** rate of ₵15, which
is the plan I tried and failed to buy. I am on **Pro** at ₵30. So the one line in my billing
history is for a plan I am not on, at a price I was never charged, in a state that means
"you still owe this".

I pressed **Verify**. Nothing. No message, no change to the row, no confirmation. I pressed
it again. Nothing again. **A silent button, on a money row, on my billing page.**

I did **not** press **"Pay from wallet"**, and I want to say why rather than let it look
like an oversight: that button spends money, and I am not going to press a spend button on a
bill I do not believe I owe, for a plan I am not on, that the product cannot explain to me.
That is exactly the decision a real landlord makes. **Recorded as deliberately not pressed.**

**And the page tore itself apart while I was reading it.** Every time I scrolled or pressed
anything, the whole application slid further down the window — a growing band of empty grey
above it, the purple header bar left floating in the middle of the page over the top of the
plan cards. By the third press the top of the page was 200 pixels below where it started.
This is the same illness as the half-size render, and I have now seen it on the Occupants
page, the Invoices page and the Subscription page. **It is not one screen. It is the whole
application.**

---

**And one more thing, which I could not have found on my own.**

I could not see this and I want to be clear about that: the operator read the machine's own
log afterwards and told me what it said, because it explains the single most confusing thing
that happened to me yesterday.

While I was working — mid-session, hands on the keyboard — **my sign-in quietly expired.
The app tried to renew it by itself, and the renewal was refused because it did not
recognise the device it was coming from. That refusal did not just fail; it threw away my
whole session.** And nothing appeared on my screen to tell me. The sign-in lasts **fifteen
minutes.**

Fifteen minutes. I want to put that beside what a landlord actually does. Adding a room
takes seven actions and I have eight rooms. Onboarding Akosua took me three screens, a
guarantor, an agreement and an invoice. Somebody phones me in the middle of it — somebody
always phones me in the middle of it — and I take the call, because the call is my business
too. By the time I come back, I am signed out, and **the screen still looks exactly as I
left it.** Every button I press from then on does nothing.

That is the answer to Chapter 2, where I wrote "the entire left-hand menu is dead" and would
have closed the tab for good. It is the answer to why my correct password came back
"Request failed with status code 401" and then a plain reload put me straight back inside.
It is very probably the answer to why "Onboard a Tenant" opens exactly once and then never
again.

**None of it was ever explained to me on the screen.** The product knew it had signed me
out. It kept the furniture on the page and let me carry on pressing buttons into thin air.
That is the finding of the whole run: not that things fail, but that this product fails
without telling me, and a man who cannot tell "broken" from "signed out" assumes broken and
leaves.

Fifteen minutes is not a session. It is a phone call.

**Mobile check (375px):** deferred to the next chapter — I was not going to change the
window size in the middle of the one test where window size was under suspicion.

---

### Chapter 6 — Something breaks

The toilet in Room 4 is blocked. Water backing up onto the floor, and in a compound that
bathroom is shared, so it is not one family's problem, it is six.

**How would the tenant have told me? WhatsApp, the same as always.** There is a
Maintenance section here with four pages under it, but nothing in this product gives my
tenant a way in. Akosua has no login. She has never seen this software and never will.
So the "requests from tenants" in the page's own subtitle — *"Manage and track maintenance
requests from tenants"* — are requests I type in myself after she has phoned me. That is
worth saying plainly: **this is a landlord's notebook, not a tenant's channel.** Which is
fine, as long as nobody tells me otherwise.

**Logging it was the best form in the product so far, and I mean that.**

Add Request opened at the first press. Repair or Complaint. Property, Unit, Occupant,
Title, Description, Priority, Category, Assign To, Notes — and a **Photos** tab, which for
a blocked toilet is exactly right; a photograph settles an argument about whether it was
blocked when she moved in. **KEPT.**

I picked Adenta Compound, then Room 4 — and the unit list came back **7, 5, 2, 4, 6, 8, 1,
3** again. Third screen in this product to show me my own rooms in a shuffled order. It is
a small thing that I notice every single time.

Two dropdowns on that form were **empty**, and neither told me why:

- **Category** offered exactly one entry: **"None"**. No Plumbing, no Electrical, no
  Roofing. There is a "Categories" page hidden under Maintenance, so evidently I am meant
  to go and invent my own list first — but nothing on this form says so, and there is no
  "add one" link on it.
- **Assign To** said **"No options"**. No plumber, because I had not entered one yet, and
  again no way to add one from where I was standing.

Saved it: **REQ-20260823-4B3208CF**. That reference is unreadable. My invoice is
INV-2026-002 and my agreement is AGR-2026-001, both of which I can say down a phone. I
cannot read "4B3208CF" to Yaw.

**And then the counters lied to me straight away.** The row was sitting there in the list,
and above it: **Total Requests 0. Open Requests 0.** I pressed Refresh. Still 0. Only a
full page reload put it right. This is the same illness as the Invoices page yesterday, and
it is worse here because "how many jobs are open" is the whole point of the tile.

**Following it to done took six status changes and I could not go straight there.**

From Pending my only choices were **Awaiting Approval** or **Cancelled**. I could not say
"the plumber is coming" and I could not say "it is fixed". So:

**Pending → Awaiting Approval → Approved → In Progress → Awaiting Confirmation → Closed.**

Six. For a blocked toilet. Whose approval am I waiting for? I am the landlord; I approved
it by picking up the phone. That chain was designed for a company with a maintenance
manager, not for a man with fourteen rooms.

Two things in that chain were genuinely good and I will say so:

- Moving to **In Progress** was refused, and it **told me why** in plain grey text beside
  the button: *"A maintainer must be assigned."* **KEPT.** That is the opposite of every
  silent failure in this report. One short sentence and I knew exactly what to do.
- The last step is labelled **"Close (no tenant confirmation)"**. Honest. It tells me I am
  skipping somebody's sign-off rather than pretending the sign-off happened. **KEPT.**

Adding the plumber was a detour. **Assign To was empty and there was no way to add a
maintainer from the request**, so I had to abandon the half-finished job, go to a different
page, create Kwame Adjei, and come back. The Maintainer form itself is good — **only Name
is required**, phone and email optional, a Company field, a proper trade list (Plumbing,
Electrical, Carpentry, Painting, Roofing, Masonry, Welding, Pest Control, General
Maintenance — real trades), and a switch to **"List in the maintainer marketplace — they
stay private to your account, turn this on to let tenants of any landlord find and call
them."** A shared directory of tradesmen who other landlords have actually used is a
genuinely good idea in this city, where finding a plumber who turns up is harder than
finding the money to pay him. My `0208 776 341` went in with the spaces and came back out
unmangled. **KEPT.**

**But it threw away my work once, and I want that recorded.** The first time, I opened the
trade list, picked Plumbing, and pressed **Escape** to shut the little list — which is what
Escape is for. Escape closed **the entire form** and discarded the name, the phone and the
trade with no warning and no "are you sure". I typed it all again. That is exactly the
"someone phoned me halfway through" failure, except the phone call was my own keyboard.

**Now the money, which is what this chapter is really about.**

The plumber charged me **₵250** and the ball valve and washers cost **₵80**. ₵330 all in,
cash, on the day.

**There is nowhere on a maintenance request to record what a repair cost you.** No cost
field on the form, none on the edit form, none on the completion step. The only place a
number can go is a tab called **Parts**, which wants Part Name, Quantity and Unit Cost. So
I put the ball valve in honestly — and then, to get the plumber's fee in at all, **I had to
enter a man as a part.** "Plumber labour (Kwame Adjei), quantity 1, unit cost 250." I wrote
in the note: *"Not a part — there is nowhere else to put labour."* Labour is most of what a
repair costs in this country. Materials are the small half.

It did add up, at least: **"Materials & Parts — Total: GHS 330"**, and back on the Details
tab a new line appeared, **"Actual Cost: GHS 330"**. Good.

**And then it goes nowhere.**

> **Dashboard → Expenses Overview → "Total Expenses: ₵0" → "No expenses recorded yet."**
>
> **Expenses page → "Total Expenses ₵0.00" · "Avg per Expense ₵0.00" · "Paid ₵0.00" ·
> "No expenses found."**

I have spent ₵330. I recorded it inside this product. The product agrees on the request
screen that the actual cost was ₵330. And **every screen in this product that talks about
what I spend says zero.** The maintenance ledger and the expense ledger are two separate
books that have never been introduced to each other.

So the answer to this chapter's question — **does the money I spent on the plumber show up
anywhere in my profit?** — is **no. Not one cedi.** My dashboard still believes I collected
₵14,400 this month and spent nothing.

**Then I tried to put it in by hand, and I could not.**

Expenses → Add Expenses (two presses; the first did nothing). A sensible form: Expense
Item, Property, Unit, Date, Responsibility, Status, Amount, Description. And **Expense
Item is required and its list is empty** — the only entry is **"Other (type manually)"**,
and choosing it does not produce anywhere to type. I selected it, the box stayed blank, I
clicked in it and typed and nothing appeared. I filled in ₵330 and a full description
naming the plumber and the request number, and pressed Save:

> **"Please select an expense item."**

A clear message about a field I am not able to fill. There is an **"Expense Config"** page
buried under Expenses which is presumably where the list is built — and I could not reach
it, for the reason below.

**Note there is also no way to link an expense to the maintenance request even if I could
create one.** No field for it. So the best I could ever do is type ₵330 twice into two
places and hope I remember they are the same ₵330.

**The wall I could not get past: the menu collapsed and will not open again.**

I pressed the little « arrow beside my company name to get more room to read a table. The
menu shrank to a column of icons. **It has not opened since.** Not by clicking the arrow's
place, not by hovering anywhere along it, not by clicking the logo, not by reloading the
page, not by making the window wider, not by loading a fresh page from scratch. Every
attempt, still icons.

That matters far more than it sounds, because **the icons only reach the top-level pages.**
Everything that lives under a group is now unreachable: All Properties, All Unit, All
Occupants, Occupant History, Agents, All Invoices, **All Expenses, Expense Config**, and all
four Maintenance pages. Hovering an icon shows nothing; clicking it does nothing.

I am not going to pretend otherwise: **that is where Chapter 6 stopped.** I could not
record the plumber as an expense because the one page that would let me is behind a menu
that closed itself and will not reopen. On a phone a man taps that arrow by accident on the
first day and loses half the product with no idea what he did.

**Could Yaw the caretaker have recorded any of this?** I still cannot say. Team & Roles and
Members/Agents both live under collapsed groups. Untested, and by now untestable.

**Mobile check (375px):** on the phone the menu comes back as a hamburger, which is the one
place it works properly. But the four tiles eat nearly two full screens before I reach the
actual job, **"Completed This Month" reads 0 for a job I have closed and "Open Requests"
reads 1**, the purple **Add Request** button is drawn straight on top of the words
"Maintenance Requests List", and the list is a wide table that slides sideways so that all I
can see is the unreadable reference number — the issue, the priority, the status and the
cost are all off the right edge. To read one row I drag four times.

**Chapter question — does the money you spent on the plumber show up anywhere in your
profit?**

**No.** It is recorded, it is added up correctly on the job, and it is invisible everywhere
that matters. My dashboard says my expenses this month are ₵0 while ₵330 of my cash is in
Kwame Adjei's pocket. And the one screen that could have fixed that by hand is behind a
menu I cannot open, and would not have joined the two figures together even if I had
reached it.

---

### Chapter 7 — Where is my money

**First, an amendment to Chapter 6, because I found the way back in.**

The menu came back. Not because I found a control — because on the Dashboard, and only
there, moving the pointer over the strip of icons made the whole menu slide out over the
top of the page, and *then* a small `»` appeared beside my company name which pins it open.
I had been hunting for that for the better part of ten minutes on the Expenses page, where
hovering does nothing at all. So it is recoverable, and I withdraw "permanently stuck" —
but the way back is an invisible hover that works on some pages and not others, and no
landlord is going to find it by reasoning. I found it by accident.

With the menu back I finished the job I had been blocked on, and the result is worth
having.

**To record ₵330 of plumbing I had to do it a second time, from scratch, somewhere else.**
Expenses → **Expense Config** → Add New Expense Item → "Plumbing repairs", category
Maintenance → Submit. *Then* back to Expenses → Add Expenses (two presses again) → now
"Plumbing repairs" finally appears in the list → Adenta Compound, 23/08/2026, Paid, ₵330,
and a description naming the plumber and quoting REQ-20260823-4B3208CF because **there is
no field to link the two**.

And now the P&L moves: **Total Expenses GHS 330.00 · Net Profit GHS 14,070.00 · margin
97.71%.** So the machinery works. The problem is that the cost I entered *on the actual
repair* is not the cost the accounts use. **The same ₵330 now exists twice in this product,
in two ledgers that have never heard of each other, joined only by a reference number I
typed into a notes box by hand.** If anyone ever wires them together I will be down ₵660.

The dashboard also caught up — Expenses Overview now reads ₵330 with "Plumbing repairs"
beside it, and the dashboard's own maintenance panel correctly says **1 All · 0 In Progress
· 1 Resolved · Closed**, while the Maintenance page's tiles still insist **Open 1 ·
Completed 0**. Two screens, two answers, and once again **the dashboard is the one telling
the truth.**

---

Now the five questions I actually open this thing to answer.

**1. "How much did I collect this month?" — found in about a minute. I do not believe it.**

Five screens gave me two different answers for the same money:

| Screen | What it says |
|---|---|
| Dashboard — *Rent Collected, total amount collected this month* | **₵14.40K** |
| Reports → Earnings — *Paid Revenue* | **₵14,400** |
| Reports → P&L — *Total Income* | **GHS 14,400.00** |
| Reports → GRA — *Total Collected* | **GH₵14,400.00** |
| **Wallet — *collected outside Yiliora*** | **GH₵14,800.00** |

I have collected **₵14,800**: ₵14,400 from Akosua's advance and ₵400 cash on her September
rent, both in August, both recorded by me in this product. **The wallet is the only screen
in the entire application that counts the ₵400.** Four screens, including the tax report,
drop a real cash payment from a real tenant.

You can catch it out on its own arithmetic. The Earnings report says Total Revenue
**₵15,600** and Outstanding **₵800**. Fifteen thousand six hundred less eight hundred is
fourteen thousand eight hundred. It prints ₵14,400 directly underneath its own sum.

There is also **no "This month"** in the date filter. The choices are Last 7 days, Last 30
days, Last 3 months, Last 6 months, Last year, All time, Custom range. My question is
"August" — the thing I compare with last August. "Last 30 days" is 24 July to 23 August,
which is nobody's month. I had to build August by hand with a Custom range.

**And then the date filter turned out not to work at all on the report I most wanted.**

I set Earnings to **1 August – 31 August**. The four tiles did not move: ₵15,600 / ₵14,400
/ ₵800 / ₵5,200 — identical to the 30-day view, even though a ₵600 July invoice and a ₵600
September invoice sit outside August.

So I set it to **1 January – 31 January 2026** — five months before I had ever heard of this
product, before Akosua, before either property existed. The chart underneath said, quite
correctly, *"No data available"*. **The four big numbers still read ₵15,600 / ₵14,400 /
₵800 / ₵5,200.**

The tiles ignore the filter completely; the chart obeys it. **The numbers a landlord reads
are the ones that lie, and the decoration is what tells the truth.** And the **P&L** tab —
same page, identical-looking control — *does* obey it correctly: January came back
₵0/₵0/₵0. Two reports side by side, one filter, two behaviours, and nothing to tell me
which is which.

**2. "How much am I owed, and by whom?" — found in seconds, and this is the best screen in
the product.**

Reports → **Arrears**:

> **Total Defaulters 1 · Total Outstanding GH₵600.00 · Critical (90+ days) GH₵0.00 ·
> Moderate (31–90 days) GH₵600.00**
>
> **Akosua Boateng · 0244 118 227 · Room 1, Adenta Compound · 31–60 days: GH₵600.00 ·
> Total Owed GH₵600.00 · Oldest invoice 05 Jul 2026 · 49d · 1 invoice**

Name, **phone number on the row**, which room, how much, how old, in ageing buckets. That
is precisely the page I want in my hand when I walk into the compound on a Saturday morning.
I can ring her straight off the row. **KEPT — the best screen in this product and the only
money screen I would trust without checking it against my book.**

One caution. This page's "Total Outstanding" is **₵600** while the dashboard's "Pending
Payment" is **₵800**. Both are actually right — ₵600 is overdue, ₵800 is owed, and the extra
₵200 is Akosua's September balance which is not late yet. But nothing on either screen says
so, and "outstanding" meaning *overdue* on one page and *owed* on another is exactly how a
landlord ends up believing neither.

**3. "How much of the ₵14,400 advance have I actually earned?" — the product cannot answer
this, and it answers the opposite.**

There is no screen anywhere that separates money collected from rent earned. What there is
instead:

- **Wallet: "TOTAL EARNED — GH₵14,800.00 — Lifetime income received."** Unchanged from
  yesterday. I have earned about one month of it.
- **P&L: "Net Profit GHS 14,070.00 · Profit Margin 97.71%"** under a green badge reading
  **"Profitable this period."**
- **GRA: "Estimated WHT (8%) GH₵1,152.00"** — a tax bill worked out on twenty-four months of
  future rent, to be remitted by 15 September.

Understand what a landlord does with that. He opens the app in August, reads **net profit
₵14,070, ninety-seven per cent margin, profitable** — and he re-roofs Madina. Then Room 1
pays him nothing for twenty-three months, because it already did, and he cannot make out
what happened. **That is not a reporting nicety. That is the mechanism by which men in this
business go under while their books tell them they are doing well.**

And the **Cash Flow** report makes it concrete, which is almost worse, because the feature
is plainly already built:

> **12-Month Forecast GH₵7,200.00 · Monthly Average GH₵600.00**
> Monthly breakdown Aug '26 through Jul '27: **Advance Renewals GH₵0.00** and **Regular Rent
> GH₵600.00**, every single month.
> **"0 units on advance rent · 1 unit paying monthly · 8 vacant units"**

Somebody built a forecast that **splits advance-rent renewals from ordinary monthly rent**,
with its own chart series and its own column in the table. That is a Ghanaian's idea and it
is the right one. And it is being fed nothing, because there is no way to tell the system a
payment was an advance. So it records that Akosua — who handed me twenty-four months last
week — is on monthly rent, and forecasts ₵7,200 arriving over the next year that will never
arrive.

Every forward-looking number in this product is wrong in the same direction: **too much.**

**4. "What did this property earn me after what I spent on it?" — found, and I half believe
it.**

Reports → P&L, August 2026: **Income GHS 14,400.00 · Expenses − GHS 330.00 · Net Profit
GHS 14,070.00.**

The expense half is now right, at the price of typing it twice into two places. The income
half is Akosua's advance called profit, and it is ₵400 short of even the cash I took. So the
answer is wrong in two ways at once.

Two things on that page deserve praise, because they are the only footnotes in the whole
product that explain a number instead of just printing it:

- *"Occupancy is a current snapshot, not an average over the selected period."*
- *"Income counts paid invoices issued in this period; expenses count paid expenses dated in
  it."*

**KEPT, both.** Somebody wrote those because they knew a careful man would ask. Every money
tile in this product needs a sentence like that.

And a gap: **P&L has no per-property breakdown.** I asked what *this property* earned me.
Adenta and East Legon are added together with no way to separate them — while the **GRA**
report, two tabs across, *does* break down by property with a collection rate. The report
that needs it hasn't got it; the one that doesn't, has.

**5. "Which units are empty and what is that costing me?" — half answered. The half that
matters is missing.**

**Vacant Units: 8.** The dashboard, the Units page, the P&L and the Cash Flow forecast all
agree, which is refreshing.

*Which* ones took two more clicks — Properties → All Unit: Rooms 2, 3, 4, 5, 6, 7, 8 and the
East Legon Main House, each with its rent beside it. Fine. (Still in the order 7, 5, 2, Main
House, 4, 6, 8, 1, 3.)

**What it is costing me: nothing anywhere says.** Not on the dashboard, not on the Units
page, not in any of the eight reports. There is a "Vacant Units 8" tile in four places and
never once a cedi figure beside it. So I did what I always do — added it up myself off the
screen:

₵850 + ₵600 + ₵600 + ₵800 + ₵600 + ₵600 + ₵600 + ₵850 = **₵5,500 a month I am not
collecting.**

That is a bigger number than anything else on my dashboard and this product has never once
mentioned it. **"8 empty rooms · ₵5,500 a month not coming in"** is the tile I would want at
the top of the page and would look at every day.

Except it would be wrong too, because that ₵800 is **East Legon at eight hundred United
States dollars**, saved as cedis back in Chapter 3. Counted properly my vacancy loss is
nearer ₵16,700 a month. The currency bug has now spread into my unit list, my vacancy
figure, my Cash Flow forecast and my P&L. **A wrong number entered once poisons every
report that touches it**, which is exactly why I made so much of it at the time.

**Mobile check (375px):** the **Wallet renders properly on my phone now** — purple header,
Available to Withdraw GH₵0.00, the "collected outside Yiliora" explanation in full, and the
ledger below. **Yesterday's blank-wallet finding is withdrawn; today it works.** The menu
also comes back as a hamburger on a phone, which is more than it manages on the desktop.
What it shows me there is **TOTAL EARNED GH₵14,800.00** in large type, above the fold, on
the device I actually carry — the wrongest word in the product, on the smallest screen.

**Chapter question — after all of this, would you keep using it, and would you pay for it?**

**I would pay for it. I would not yet rely on it.** Those are two different sentences and I
mean both.

I would pay the ₵135 a month, and I tried to. The address handling, the GRA stamp duty and
WHT figures with the Act and the deadlines, the guarantor record, part payments that hold,
MoMo first everywhere, the arrears page with the tenant's phone number on the row, the
cash-flow forecast that has a column for advance renewals — **those are the work of people
who know this business in this country**, and I have never been shown anything like them.

But today I would run it alongside the exercise book, not instead of it, which means paying
₵135 a month for a second opinion. Because when I ask this product the one question my
business turns on — *how much money have I got and how much of it is actually mine* — it
tells me ₵14,400 on four screens and ₵14,800 on a fifth, calls a two-year advance "earned",
reports 97.71% profit, forecasts ₵7,200 that will never come, prices my best property at one
fifteenth of its value, and shows me the same revenue figure for a month five months before
I opened the account.

**Fix the money truthfulness and I would close the book the same week.** Nothing else on the
list comes close.

---

## 3. Findings

Sorted BROKEN → MISSING → FRICTION → KEPT, by severity within each. Both days, renumbered
clean. **A separate table of withdrawn findings follows the main one** — they are kept with
their reasons rather than deleted, because a report that quietly loses its own mistakes is
not worth reading.

| # | Type | Severity | Screen | Expected | Got | Quit? |
|---|------|----------|--------|----------|-----|-------|
| B1 | BROKEN | Critical | Add Unit → Currency | Save East Legon rent as **USD $800** | Dropdown offered USD, relabelled the field "Rent (USD)" while I typed, then **silently saved it as GHS**. Unit list and Edit both show ₵800. My most valuable property understated ~15×, and the wrong figure has since spread into the vacancy total, the Cash Flow forecast and the P&L | YES |
| B2 | BROKEN | Critical | Wallet; Reports → P&L | Money collected but not yet earned shown as such | Wallet: **"TOTAL EARNED — GH₵14,800.00 — Lifetime income received."** P&L: **"Net Profit GHS 14,070.00 · Profit Margin 97.71%"** under a green **"Profitable this period"** badge. That money is a 24-month advance — closer to a debt than income. This actively encourages a landlord to spend rent he owes back | YES |
| B3 | BROKEN | Critical | Reports → Earnings, date filter | Filter the figures by period | **The four headline tiles ignore the date range entirely.** Set to Jan 1–31 2026 — months before my account existed — and they still read ₵15,600 / ₵14,400 / ₵800 / ₵5,200. The chart beneath correctly says "No data available". The P&L tab, same page, same control, *does* filter correctly | YES |
| B4 | BROKEN | Critical | Dashboard, Earnings, P&L, GRA vs Wallet | One "collected" figure | Four screens say **₵14,400**; the Wallet says **₵14,800**. The Wallet is right — the other four silently drop Akosua's ₵400 cash part payment. Earnings even contradicts its own sum: Total ₵15,600 − Outstanding ₵800 = ₵14,800, printed as ₵14,400. The GRA tax estimate is computed on the wrong one | YES |
| B5 | BROKEN | Critical | Reports → Cash Flow | Forecast that knows about advances | *"0 units on advance rent · 1 unit paying monthly"* for a tenant who paid 24 months last week; forecasts **₵7,200 over 12 months** that will never arrive. The Advance-Renewals column and chart series exist and are fed ₵0.00 because nothing can be recorded as an advance | YES |
| B6 | BROKEN | Critical | Subscription → Pay | Pay ₵135.00 and get on Basic | MoMo: *"Platform payment gateway not configured."* Bank Transfer: *"Transfer GH₵135.00 using the details below"* — **and there are no details below, just an empty box.** Could not buy the product at all. *(Scope: no gateway is configured on this deployment; production unverified)* | YES |
| B7 | BROKEN | High | Occupants → Onboard a Tenant / Add Occupant | Add my second tenant | **Confirmed on retest, day 2.** Opened on the first press after signing in, then never again: 8 presses, 3 full page loads, steady window, page freshly read each time, pressed by name. Also, inside the one dialog I did get, picking a Property did not stick and the **X would not close it** — Escape was the only way out. Rooms 2–8 still have no tenants | YES |
| B8 | BROKEN | High | Whole app | Stay signed in while I work | Session lasts **15 minutes**; when it renews itself the renewal is refused as a device mismatch and **the whole session is revoked**, with nothing on screen. The page keeps its furniture and swallows every click. I twice concluded the product was broken when I had merely been signed out. *(Cause supplied by the operator from the server log — I could not have seen it)* | YES |
| B9 | BROKEN | High | Login page | A message a person can read | **"Request failed with status code 401"**, in red, on the front door, with correct credentials. That is a developer's sentence handed to a landlord. My first thought was that somebody had got into my account | YES |
| B10 | BROKEN | High | Maintenance request → cost; Expenses; Dashboard | Repair cost reaches my profit | Recorded ₵330 on the job (₵80 parts + ₵250 labour) and the request itself agrees: **"Actual Cost: GHS 330"**. Expenses page: **₵0.00, "No expenses found."** Dashboard: **"Total Expenses ₵0 — no expenses recorded yet."** It only counts once I retype the same ₵330 as a separate Expense, with **no field to link the two** — so the same money now exists twice in two unconnected ledgers | YES |
| B11 | BROKEN | High | Whole app — every menu item, link and button | One press does one thing | **Menu items, table links and buttons routinely need two presses**, and the failed press gives no spinner, no flicker, nothing. Confirmed on Subscription Plans, Maintainers, Expense Config, the invoice number in the invoice list, and Add Expenses. A landlord cannot tell a dead button from a slow one | YES |
| B12 | BROKEN | High | Payment → Receipt; invoice Print / Save as PDF | A receipt for a cash-paying tenant | **Retested day 2: still nothing.** Tooltip "Open printable receipt" appears; no window, no page, no download, twice. **Cannot give a cash tenant the one document she will ask for** | No, but damaging |
| B13 | BROKEN | High | Invoices tiles; Maintenance tiles; Maintenance page vs Dashboard | Counters that match the rows beneath them | **Overdue Invoices: 0** for a bill 7 weeks past due, and still 0 after Refresh. Maintenance: **Total 0 / Open 0** with the row visible; Refresh does not fix it, only a full page load does. After closing the job the Maintenance page says **Open 1 / Completed 0** while its own chart says **Closed 100%** and the dashboard says **Resolved 1** | YES |
| B14 | BROKEN | High | Sidebar collapse « | Get the menu back | One press collapsed it to icons and **every sub-page became unreachable** — All Properties, All Unit, All Occupants, Agents, All Invoices, All Expenses, Expense Config, all four Maintenance pages. Hovering, clicking, reloading, resizing and a fresh page load all failed on the Expenses page. It only came back by hovering the icon strip **on the Dashboard**, where a `»` then appears. Cost me ~10 minutes and blocked Chapter 6 | No, but very close |
| B15 | BROKEN | Medium | Maintainer form; any dialog with a dropdown | Escape closes the dropdown | **Escape closes the whole form and discards everything typed**, with no warning and no confirm. Lost a name, a phone and a trade and had to type them again. This is the "someone phoned me halfway through" failure, self-inflicted | No |
| B16 | BROKEN | Medium | Whole app, intermittently | Page draws correctly | Page repeatedly **rendered at half size in the top-left corner**, or slid progressively down the window leaving a growing grey band with the header floating over the content. Seen on Occupants, Invoices and Subscription. Only a window resize fixes it, which a phone user cannot do | No |
| B17 | BROKEN | Medium | Setup wizard → final step | Truthful confirmation | *"You're all set! Your property, occupant, and first invoice are ready. Your tenant will receive a notification."* — I had **skipped** occupant, agreement and invoice. None existed. "View Invoice" dumped me on the dashboard | No |
| B18 | BROKEN | Medium | Dashboard after creating property/unit | Counts reflect what I just saved | Dashboard said **Total Properties 0** while the Properties page said 1 | No |
| B19 | BROKEN | Low | Subscription → Billing History | A billing row I can understand | My failed purchase left **"UPGRADE · 9 units · GH₵135.00 · PENDING"** sitting on my account — for the Basic plan I never got, at a price I was never charged, while I am on Pro. **Verify does nothing, twice, in silence.** I did not press "Pay from wallet": I will not press a spend button on a bill nobody can explain | No |
| M1 | MISSING | Critical | Everywhere | Record rent paid years in advance | No advance concept at all. Payment frequency offers Monthly/Quarterly/Yearly/One-time. I had to fake it as an invoice with "Rent Advance - 24 months" typed into a **free-text** Invoice Type. System then **billed her again for September without a word of warning**, and every forward-looking screen now assumes she pays ₵600 a month | YES |
| M2 | MISSING | Critical | Everywhere | Tell collected apart from earned | No screen distinguishes them. There is no "earned to date", no "unearned advance held", no "held on behalf of tenants". This is the single number that decides whether I can afford to re-roof Madina this year | YES |
| M3 | MISSING | Critical | Everywhere | See the caution fee I am holding | ₵600 entered as "Security deposit" on the lease and that is the end of it — not money, not a balance, not a liability, never asked whether I received it. Nothing anywhere says "you hold ₵600 of Akosua's money" | YES |
| M4 | MISSING | High | Maintenance request | Record what the repair cost | **No cost or labour field anywhere on the request.** The only place a number goes is the **Parts** tab, which wants Part Name / Quantity / Unit Cost — so to record a plumber's ₵250 fee **I had to enter a man as a part**. Labour is most of what a repair costs in Ghana | YES |
| M5 | MISSING | High | Onboard a Tenant | Save a tenant with only a phone number | **Email is compulsory.** I invented `akosua.boateng@gmail.com`. 12 of my 14 tenants have no email. The system's own **guarantor** and **maintainer** forms both get this right — phone/name required, email optional | YES |
| M6 | MISSING | High | Dashboard, Units, all 8 reports | What my empty units are costing me | "Vacant Units 8" appears in four places and **never once with a cedi figure beside it**. I had to add the eight rents up off the screen myself: **₵5,500 a month** — a bigger number than anything on my dashboard | No |
| M7 | MISSING | High | Unit type dropdown | Single room, chamber and hall, self-contained | Studio / 1–4+ Bedrooms / Commercial / Office / Retail. **Every unit in my portfolio is recorded as something it is not** | No |
| M8 | MISSING | Medium | Reports date filter | "This month" | Only Last 7 days / 30 days / 3 months / 6 months / Last year / All time / Custom. My question is always "August, versus last August". I must build every calendar month by hand | No |
| M9 | MISSING | Medium | Reports → P&L | Per-property profit | Adenta and East Legon are added together with no way to split them. The **GRA** report two tabs away *does* break down by property | No |
| M10 | MISSING | Medium | Maintenance request; Expense | Link a repair to its expense | No field on either side. The same ₵330 lives in two ledgers joined only by a reference number I typed into a notes box myself | No |
| M11 | MISSING | Medium | Maintenance → Category; Expenses → Expense Item | A list to choose from, or a way to make one | Both are required-ish fields with empty lists. Category offers only "None"; Expense Item offers only **"Other (type manually)"** — which produces nowhere to type, then rejects the form with *"Please select an expense item."* Neither form says the list is built on another page | No |
| M12 | MISSING | Medium | Property type dropdown | Compound house | House / Apartment / Residential / Commercial / Mixed Use. The commonest rented building in Ghana is absent | No |
| M13 | MISSING | Medium | Documents → upload type | Ghana Card / national ID | Offers Signed Tenancy Agreement, Employment Letter, Business Registration — but not the one document every landlord actually files | No |
| M14 | MISSING | Medium | Occupant → Documentation tab | Attach the signed agreement where the tenant is | Tab says "No documents available" with **no upload button at all**. Upload lives only in a separate top-level Documents section | No |
| M15 | MISSING | Medium | Maintenance | Any way for a tenant to report a fault | The page is subtitled *"requests from tenants"*, but my tenants have no login and no route in. Everything here is me typing up a WhatsApp message after the fact | No |
| M16 | MISSING | Medium | Agreement details | Witness, signature, stamp | None. Yet the screen declares **"This agreement is legally binding and enforceable."** In Ghana agreements are written, stamped and witnessed | No |
| M17 | MISSING | Low | Add Unit | Add 8 rooms at once | One at a time, 7 actions each, **form forgets property/type/rent between every single one**. ~55 actions for one compound | No |
| F1 | FRICTION | High | MoMo request failure message | Tell me what to do next | **"…form payment gateway not configured for: REDDE."** The panel covers the first word so I cannot read the whole sentence, and "REDDE" means nothing to a landlord. Say *"Mobile Money collection is not switched on — record it as Cash instead"* | No |
| F2 | FRICTION | High | Subscription checkout; Record Payment | Ghanaian number handled | Typed `0244118227` into a box already showing **+233** → stored **`+233 0244118227`**, extra zero, no warning. Three times now, on three screens. Meanwhile the maintainer form took `0208 776 341` untouched | No |
| F3 | FRICTION | High | Dashboard money tiles | Exact cedis | **"₵14.40K."** My money is ₵14,400.00. I count digits when I check a figure | No |
| F4 | FRICTION | Medium | Maintenance status flow | Two or three steps to close a job | **Six:** Pending → Awaiting Approval → Approved → In Progress → Awaiting Confirmation → Closed. Whose approval? I am the landlord. Built for a company with a maintenance manager, not a man with fourteen rooms | No |
| F5 | FRICTION | Medium | Maintenance request reference | A number I can say down a phone | **REQ-20260823-4B3208CF.** My invoice is INV-2026-002 and my agreement AGR-2026-001, both readable. I cannot read "4B3208CF" to Yaw | No |
| F6 | FRICTION | Medium | Maintenance dashboard tile | A word I know | **"SLA Breached."** I do not know what an SLA is | No |
| F7 | FRICTION | Medium | Arrears vs Dashboard wording | Consistent words for money | Arrears calls **₵600** "Total Outstanding"; the dashboard calls **₵800** "Pending Payment". Both are correct — overdue vs owed — and nothing on either screen says so | No |
| F8 | FRICTION | Medium | Login / register | Know what this is | Landing goes straight to a login box. No explanation, no price, no mention of property or rent. Brand says **Yiliora**, footer says **"Powered by TenantX"**, logo alt is TenantX — two names | No |
| F9 | FRICTION | Medium | Register | Sign up as a person | **Company / Organization Name is compulsory.** I invented a business that does not exist | No |
| F10 | FRICTION | Medium | Dashboard | Understand every number | **"Reserved Units — Awaiting move-in — activate the agreement to occupy."** Meaningless to me on day one. (The onboarding flow explains it well — three chapters later) | No |
| F11 | FRICTION | Medium | Dashboard on phone | Money first | Purple marketing paragraph plus 4 cards before **Rent Collected**. I am already a customer; stop selling to me | No |
| F12 | FRICTION | Medium | All unit/room lists and pickers, incl. the maintenance form | Rooms in order | Always **7, 5, 2, 4, 6, 8, 1, 3** | No |
| F13 | FRICTION | Medium | Units list, Maintenance list on phone | See the columns that matter | Wide tables scroll sideways; on the maintenance list all I can see is the unreadable reference — **issue, priority, status and cost are all off the right edge**. On the units list, **Status and Rent** are off the edge | No |
| F14 | FRICTION | Medium | Maintenance list on phone (375px) | Readable heading | The purple **Add Request** button is drawn **on top of** the words "Maintenance Requests List" | No |
| F15 | FRICTION | Medium | Two different Add Property forms | Consistent rules | Wizard says address **Required**; the other says **Optional**. The second demands Condition, Bathrooms and "Rooms" — the wizard asks for none. Add Unit requires Status; the wizard never does | No |
| F16 | FRICTION | Low | Add Property review page | Readable summary | Shows raw codes: **greater-accra, ayawaso-west, apartment, good**. Drops the street entirely | No |
| F17 | FRICTION | Low | Everywhere | One way of writing money | **₵600**, **GHS 600**, **GH₵600.00**, **₵15,600**, **₵0** and **₵14.40K** all in one product | No |
| F18 | FRICTION | Low | Invoice page | Correct subtotal | **"Subtotal: ₵0.00"** above **"Total: ₵600.00"**. Header runs together: "Osei-Mensah PropertiesInvoice #INV-2026-002" | No |
| F19 | FRICTION | Low | Reports → P&L on a zero period | Sensible badge | Green **"Profitable this period"** shown on a period with ₵0 income and ₵0 expenses. Zero is not profitable | No |
| F20 | FRICTION | Low | Dashboard, empty account | Neutral empty state | Rent Collected chart draws a flat **red** line on a brand-new account. Red means trouble | No |
| F21 | FRICTION | Low | Setup wizard | Land calmly | Appeared unprompted **~12 seconds** after I was already reading the dashboard, on top of everything. "Resume Later" vs "Skip Setup" — both sound like leaving | No |
| F22 | FRICTION | Low | Occupants page | One clear way to add a tenant | Two buttons — **"Onboard a Tenant"** and **"Add Occupant"** — unexplained, and the app says "occupant" everywhere else | No |
| F23 | FRICTION | Low | Occupant profile | Ghanaian address fields | Previous/Permanent Address ask for **State** and **Zip Code**. We have neither | No |
| F24 | FRICTION | Low | Add Unit | Ghanaian measurements | **Size (sqft)**. Nobody here measures a room in square feet | No |
| F25 | FRICTION | Low | Maintainer trade list | Words we use | Good list otherwise, but **"HVAC"** — here he is the AC man | No |
| K1 | KEPT | — | Address entry (both forms) | — | **Ghana Post GPS codes accepted** (`GD-183-5417` recognised as a code); real place search; resolves to Region › District › Locality; local list incl. Frafraha, Ogbojo, Ashaley Botwe, Trasacco Valley; auto-fills street/region/district/city. **Best thing in the product** | — |
| K2 | KEPT | — | Address entry | — | **"Street / House Address — Optional — the building number and street, if it has one."** First form in 11 years that admits my house may have no address | — |
| K3 | KEPT | — | Agreement details | — | **Stamp Duty (GRA)**: 24 months, Total Lease Value **GH₵14,400.00**, 0.5%, **₵72.00**, "must be paid to the GRA within 30 days (Stamp Duty Act, 2005)". No software has ever told me this | — |
| K4 | KEPT | — | Occupant → Guarantor tab | — | **"Guarantors / Sureties"** as a first-class record — name, relationship, **phone required, email optional**, employer, notes. Exactly right for Ghana | — |
| K5 | KEPT | — | Invoice → Record Payment | — | **Part payment works**: ₵400 of ₵600 → Balance ₵200, status **Partial**, not Paid | — |
| K6 | KEPT | — | Record Payment / Subscription checkout | — | **Mobile Money is the default and listed first**; MTN pre-selected; order MoMo → Cash → Cheque → Bank Transfer. I own no credit card and neither do most landlords | — |
| K7 | KEPT | — | Wallet | — | **"Collected outside Yiliora — cash, cheque and bank payments you recorded. That money already reached you directly, so it is counted in your records but cannot be withdrawn here."** Honest, plain, best writing in the product | — |
| K8 | KEPT | — | Subscription checkout | — | **First 5 units free**, then ₵15/unit/mo; showed 14 units → 9 paid → **Due today ₵135.00**, line by line. Most trustworthy screen in the product | — |
| K9 | KEPT | — | Onboarding step 3 & completion | — | *"Only activate on (or just before) the day they actually get the keys."* Then *"Akosua Boateng has moved into Unit Room 1... The natural next step is the first rent invoice."* Plain, specific, honest | — |
| K10 | KEPT | — | Payment History + Recent Activity | — | Method, date, amount, my own note, invoice number, tenant name. Traceable to a person and a date | — |
| K11 | KEPT | — | Lease terms step | — | **"We've pre-filled the rent and dates from the unit"** — rent already in the box. I did not type her name or rent twice | — |
| K12 | KEPT | — | Dashboard | — | **"Rents Expiring Soon — advance rent periods ending within 2 months"** and **"Pending Payment ₵800.00"** (correct arrears). Somebody understands advance rent even if the rest of the app does not | — |
| K13 | KEPT | — | Agreement | — | Created **AGR-2026-001** automatically, correct two-year span, referenceable number | — |
| K14 | KEPT | — | Signup | — | Phone accepted as `024 047 2060`, spaces and all. Verification came by **email, not SMS** — the right call in Ghana. Re-login later needed no second code | — |
| K15 | KEPT | — | Add Property step 2 | — | Amenities include **"24-hour Electricity"** and **"POP Ceiling"** — how houses are actually advertised here | — |
| K16 | KEPT | — | Unit form | — | Free-text unit names — I could call it **"Room 1"**, not "Apartment 1A". Currency dropdown offers only GHS and USD, the two that matter | — |
| K17 | KEPT | — | Reports → **Arrears** | — | **The best screen in the product.** Defaulters sorted by amount, with **the tenant's phone number on the row**, unit, property, ageing buckets 1–30 / 31–60 / 61–90 / 90+, oldest invoice date and **"49d"**. I can walk into the compound with this page open and ring the door and the phone | — |
| K18 | KEPT | — | Reports → **GRA Compliance** | — | Total invoiced, total collected, collection rate per property, **Estimated WHT (8%)** citing **GRA Act 896 s.114**, plus the deadlines: *"WHT must be remitted by the 15th of the following month; annual returns by 30 April."* Nobody I know files this properly. Worth real money | — |
| K19 | KEPT | — | Reports → **Cash Flow** | — | A 12-month forecast that **splits Advance Rent Renewals from Regular Monthly Rent**, as its own chart series and its own table column. The right idea, built by someone who understands Ghana. It is starved of data (B5) but the thinking is correct | — |
| K20 | KEPT | — | Reports → P&L footnotes | — | *"Occupancy is a current snapshot, not an average over the selected period"* and *"Income counts paid invoices issued in this period; expenses count paid expenses dated in it."* The only two places in the product that explain a number instead of just printing it | — |
| K21 | KEPT | — | Maintenance → status change | — | Refusing to move to In Progress and **saying why in plain words beside the button — "A maintainer must be assigned."** One short sentence and I knew exactly what to do. The exact opposite of every silent failure in this report | — |
| K22 | KEPT | — | Maintenance → close | — | Final step labelled **"Close (no tenant confirmation)"** — it tells me I am skipping somebody's sign-off instead of pretending it happened | — |
| K23 | KEPT | — | Add Maintenance Request | — | Repair/Complaint, property, unit, occupant, priority, notes and a **Photos** tab. For a blocked toilet a photograph settles the argument. Also sets a **Target Resolution** date from the priority by itself, and records **"Billable To: Property"** — the who-pays question | — |
| K24 | KEPT | — | Add Maintainer | — | **Only Name required**, phone and email optional; a real trade list (Plumbing, Electrical, Carpentry, Masonry, Welding, Pest Control…); phone `0208 776 341` stored untouched; and a switch to **"List in the maintainer marketplace"** so other landlords' tenants can find a tradesman who actually turns up. A genuinely good idea in this city | — |
| K25 | KEPT | — | Subscription Plans | — | **"Pro Plan · ACTIVE · GH₵30.00/unit/month · renews 23 Sept 2026 · Units used 9 / ∞"**, and an honest refusal on the Free card: *"You have 9 units and this plan allows 5. Remove 4 units to switch."* That is how you say no to somebody | — |
| K26 | KEPT | — | Invoice → Record Payment panel | — | Opens with **Invoice Balance ₵200.00** and **Payment Amount ₵200.00** already filled, **Mobile Money** and **MTN MoMo** already chosen, and *"Customer will receive a prompt to approve on their phone."* I only had to type her number | — |

**Withdrawn findings.** Kept with their reasons rather than deleted.

| # | Was | Why withdrawn |
|---|---|---|
| W1 | *(day 1, B1)* **Critical — "Log In does nothing; permanently locked out of my account."** | **Not a defect in this product.** The operator checked the server: those seven presses **never reached it** — no request was sent. The fault was in my own browser tooling, which was aiming clicks at stale coordinates after a window resize. With the window put straight, Log In was pressed with a deliberately wrong password and behaved correctly: the request went and **"Invalid credentials"** appeared on screen. On day 2 my correct password logged me in on the first press. *What is worth keeping: from my chair I could not tell a broken button from broken equipment, because nothing on the screen distinguished them.* |
| W2 | *(day 1, part of B4)* **Critical — "Send MoMo Request does nothing at all, in silence."** | **Half wrong.** Retested on day 2: the button fires and the server answers with a red error. **The silence is withdrawn.** What remains is the message itself (**F1**) and the fact that MoMo collection cannot take money on this deployment (part of **B6**) |
| W3 | *(day 1, B12)* **High — "Wallet renders blank on a phone."** | **Retested on day 2 at 375px: it renders correctly** — header, balance, the "collected outside Yiliora" explanation and the ledger. Did not reproduce |
| W4 | *(day 1, part of B9)* **"Invoices tiles say Total 2 for 3 invoices and Pending 0."** | Correct by day 2: Total 3 · Draft 0 · Pending 1 · Part-paid 1 · Paid 1. The tiles were stale, not wrong. **The Overdue: 0 half of that finding stands and is now B13** |
| W5 | *(day 1)* **"Sidebar → Subscription Plans never navigates."** | Softened, not withdrawn: it navigates on the **second** press. Generalised into **B11**, which is the bigger problem |
| W6 | *(day 2)* **"The collapsed menu can never be reopened."** | Softened: it *can* be, by hovering the icon strip **on the Dashboard**, where a `»` then appears. It cannot be on the Expenses page, and there is no visible control anywhere. Recorded as **B14** |

---

## 4. What they got right

Not a courtesy section. These are the things that are genuinely better than my exercise
book, and if they get broken later the product has nothing left.

**1. The address handling is the best I have ever used, in any software.** Ghana Post GPS
codes are accepted as codes. Searching "Adenta" returns real Adenta places. It resolves to
Greater Accra › Adenta Municipal District › Adenta and offers a locality list containing
Frafraha, Ogbojo, Ashaley Botwe, Amrahia and Trasacco Valley. And then it says **"Street /
House Address — Optional — the building number and street, if it has one."** *If it has
one.* Somebody on that team has stood in an Accra compound. Do not let anyone "simplify"
this into a street-and-number box.

**2. The two GRA screens.** The agreement worked out my 24-month lease value as ₵14,400,
applied 0.5% and told me **₵72.00 stamp duty, due within 30 days under the Stamp Duty Act
2005**. Then the **GRA Compliance report** gave me total invoiced, total collected, a
collection rate per property, **Estimated WHT at 8% citing Act 896 s.114**, and the filing
deadlines — the 15th of the following month, and 30 April for the annual return. Nobody I
know files this properly. This is the thing I would mention to another landlord unprompted,
and it is worth real money on its own.

**3. The Arrears report is the best screen in the product.** Defaulters sorted by amount,
with the tenant's **phone number on the row**, the unit, ageing buckets 1–30/31–60/61–90/90+,
the oldest invoice date and how many days old. That is the page I want open in my hand on a
Saturday morning, and it is the only money screen here I would act on without checking my
book first.

**4. The Cash Flow forecast splits advance renewals from monthly rent.** Its own chart
series, its own column in the table. Nobody who has not collected rent in this country
designs that. It is currently starved of data because advances cannot be recorded — but the
thinking is exactly right and it should be finished, not removed.

**5. Guarantors are a real record, not a notes field** — with relationship, employer, and
**phone required / email optional**. When a tenant vanishes the guarantor is all I have.

**6. Part payments hold.** ₵400 of ₵600 leaves a ₵200 balance and the status says
**Partial**. My tenants are traders; this is most of my month.

**7. Mobile Money is the default everywhere money is discussed**, with MTN pre-selected and
Cash second, Card third. The Record Payment panel even opens with the balance and the amount
already filled in. That ordering is the difference between a product built here and a
product translated for here.

**8. The product explains itself when it bothers to, and it is excellent at it.** *"That
money already reached you directly, so it is counted in your records but cannot be withdrawn
here."* *"A maintainer must be assigned."* *"Close (no tenant confirmation)."* *"Occupancy is
a current snapshot, not an average over the selected period."* *"You have 9 units and this
plan allows 5. Remove 4 units to switch."* Every one of those is a short honest sentence that
told me exactly where I stood. **The product's whole problem is that most of its screens do
not do this.** The writer of those sentences should be put in charge of the rest.

**9. The subscription checkout shows its arithmetic.** First 5 units free, 14 total, 9 paid,
₵15 each, **₵135.00 due today** — line by line in cedis. I could check it in my head and I
believed it.

**10. Payment History and Recent Activity are traceable.** Method, date, amount, my own
written note, invoice number, tenant name. That is the thing my exercise book could not do,
and the reason I lost a year's advance to a dispute once.

**11. The maintainer marketplace.** A shared directory of tradesmen other landlords have
actually used, opt-in per contractor. In this city, finding a plumber who turns up is harder
than finding the money to pay him.

---

## 5. Where I would have walked away

Five moments. Any real customer stops at one of them.

**1. Twelve minutes in, when the whole left menu went dead.** I clicked Subscription Plans
three times, then Support, then Documents, then the Create button. Nothing responded and
nothing explained itself. I concluded the product was broken. It was not — my sign-in had
silently expired after fifteen minutes and the app had thrown the session away without a
word. **A silent failure taught me the product was broken, and I would have told two other
landlords so.** That is the worst thing on this list, because it costs you customers who
never report a bug.

**2. When I decided to pay and the product would not take my money.** I had read the
prices, done the sums on my fourteen units, decided ₵135 a month was fair, entered my MoMo
number and pressed Pay. *"Platform payment gateway not configured."* I chose Bank Transfer
instead and it told me to transfer ₵135.00 "using the details below" — **with nothing
below.** I was standing at the counter with cash in hand and nobody would serve me. If I had
not been let through by somebody else, the run would have ended there, at the Free plan's
5-unit wall, halfway through my first compound.

**3. When the currency silently changed my dollars into cedis.** I selected USD, the field
relabelled itself "Rent (USD)", I typed 800, and the record says ₵800. My East Legon flat
understated by a factor of fifteen, without a word. From that moment I stopped believing any
number on any screen — and I have since watched that one wrong figure spread into my vacancy
total, my Cash Flow forecast and my P&L.

**4. When I found the same revenue figure for a month before my account existed.** I set the
Earnings report to January 2026 to check I understood the filter, and it reported ₵15,600 of
revenue for a month in which I did not have a property, a tenant or an account. **A number
that does not change when you change the question is not a number, it is a picture of one.**
After that I would have to check every figure in this product against my book, which is the
precise opposite of what I am buying.

**5. When the menu closed itself and I could not get it back.** One press of a small arrow
and eleven pages of the product became unreachable — including the only page that would let
me record what I had spent. Ten minutes of hovering and clicking and reloading and resizing.
I only found the way back by accident, on a different page. **On a phone a man taps that
arrow on his first day and never finds out what he did.**

---

## 6. Recommendations

Ranked by what would change my mind about relying on it — not by what looks easy.

**1. Never fail silently. This is bigger than any feature you have not built yet.**
The session lasts **fifteen minutes**, and when it renews itself and is refused it throws the
whole session away while leaving the page looking perfectly normal. Every click after that
does nothing. Separately, menu items, table links and buttons routinely need two presses with
no sign that the first one failed. A landlord cannot tell "broken" from "slow" from "you have
been signed out", so he assumes broken and leaves. **Make the session long enough to survive
a phone call, and when it does end, say so on the screen I am looking at: *"You have been
signed out — sign in again."*** And no control in this product should ever absorb a press and
say nothing — a spinner is enough. Also: never show a customer *"Request failed with status
code 401"* or *"gateway not configured for: REDDE."* Say "Wrong email or password" and
"Mobile Money collection is not switched on — record it as Cash instead."

**2. Separate money collected from money earned, and stop calling an advance profit.**
Today the Wallet says **"TOTAL EARNED ₵14,800 — lifetime income received"**, the P&L says
**"Net Profit ₵14,070, margin 97.71%, Profitable this period"**, and the tax report bills me
8% on all of it. That money is twenty-four months of housing I have not yet provided. Show me
three figures and label them plainly: **collected**, **earned to date**, and **held on behalf
of tenants** (unearned advance + caution fees). This is the number that decides whether I can
re-roof Madina this year. Getting it wrong does not annoy me — it bankrupts me, and the
current wording actively pushes me towards it.

**3. Build rent advance as a real thing, not a big invoice.**
On the lease, beside the rent: *"Advance paid: 24 months, ₵14,400, covering 23/08/2026 to
22/08/2028."* Then (a) never invoice a month already covered — today it billed Akosua for
September without blinking; (b) show earned-to-date and unearned; (c) feed the **"Rents
Expiring Soon"** card and the **Advance Renewals** column in the Cash Flow forecast, both of
which you have already built and are currently feeding zero. **Twelve or twenty-four months
upfront is not an edge case in Ghana. It is the transaction.** Everything else here is a
monthly-rent product with Ghanaian paint on it.

**4. Make every money screen agree, and make every filter actually filter.**
Four screens say I collected ₵14,400 and the Wallet says ₵14,800; the Wallet is right and the
other four silently drop a ₵400 cash part payment — including the one that calculates my tax.
The Earnings report contradicts its own subtraction. And its four headline tiles **ignore the
date range entirely** while the chart below them obeys it. Pick one source for each figure,
make every screen quote it, and make the filter apply to the numbers a landlord reads, not
just the picture. **A landlord who finds two numbers for the same money stops trusting all of
them, keeps the exercise book as well, and then wonders what he is paying you for.**

**5. Fix the currency, then never let a saved value differ from what I typed.**
USD must save as USD. Until it does, **remove the dropdown** — a currency box that accepts a
currency and discards it is worse than none, because it manufactures a confident wrong number
that then spreads into four other reports. And one money format everywhere: **₵14,400.00**,
in full, with the comma. Never "₵14.40K" on a screen about my income.

**6. Join up what a repair costs with what I earned.**
Give the maintenance request a **Labour cost** field beside the parts — labour is most of what
a repair costs here, and today the only way to record my plumber was to enter him as a part.
Then make that cost **become** the expense automatically, or at minimum offer "Record this as
an expense" with the property, date and amount already filled. Today I typed ₵330 twice into
two ledgers that have never heard of each other, joined only by a reference I copied by hand.
And stop shipping required fields whose lists are empty — Category offers only "None", Expense
Item offers only "Other (type manually)" which gives you nowhere to type and then rejects the
form.

**7. Put "what my empty rooms are costing me" on the dashboard.**
You already count 8 vacant units in four places. Add up their rents and print it:
**"8 empty units · ₵5,500/month not coming in."** That is the largest number in my business
and this product has never mentioned it. I would look at that tile every single day, and it
would be the reason I opened the app.

**8. Phone number, not email, is a Ghanaian tenant's identity.**
Make email optional on the tenant form and phone required — exactly as your own **guarantor**
and **maintainer** forms already do. Twelve of my fourteen tenants have no email. Today the
product forces me to invent addresses, so every reminder it "sends" goes nowhere, or worse, to
a stranger. And strip the leading zero when the field already shows +233: `0244118227` must
become `+233244118227`, not `+2330244118227`.

**9. Give me the receipt.** A cash tenant will not leave the yard without one. The Receipt
button and Print/Save as PDF both still do nothing on day two. For cash, the receipt *is* the
transaction record, and it is what Rent Control asks to see.

**10. Cut the maintenance flow to three states and give the menu an obvious way back.**
Pending → In Progress → Done. Six states with an "Awaiting Approval" step is a company's
process, not a landlord's. And put a permanent, visible expand control on the collapsed
sidebar — losing eleven pages behind an invisible hover is not a design choice, it is a trap.

**11. Speak Ghanaian in the dropdowns.** Add **Compound House** to property types. Add
**Single Room**, **Chamber and Hall** and **Self-contained** to unit types. Add **Ghana Card**
to document types. Call the security deposit a **caution fee**, and "SLA Breached" something a
person would say. Add **"This month"** to the date filter. These are one-line changes and they
are the difference between a product built here and one translated for here. Your address
field already proves you can do it.

**12. Let me add eight rooms at once, and remember what I just typed.** A "units 1–8, same
type, same rent" screen; and between units, keep the property, the type and the rent. Forty
units is a normal compound and today that is two hours of identical clicking. While you are
there: sort my rooms 1–8 instead of 7, 5, 2, 4, 6, 8, 1, 3 — every list, every picker. And
never let **Escape** throw away a filled-in form when the user only meant to close a dropdown.

**13. Put the money at the top on a phone.** Cut the marketing paragraph for signed-in users
and lead the mobile dashboard with **Collected / Owed / Empty units**. Make the wide tables
stack into cards — on my phone the maintenance list shows me a reference number and hides the
issue, the status and the cost off the right-hand edge. I check this standing up, one bar of
signal, in a yard.

---

## 7. What I could not test

Stated explicitly so nobody later reads this as "we checked that".

- **Buying a plan.** Impossible on this deployment — no subscription payment gateway is
  configured here or on the ordinary development stack, and MoMo rent collection fails the
  same way (*"not configured for: REDDE"*). **Whether the live production site can take a
  payment is unverified.** I did not test production and am not claiming it is broken there.
  My Pro access was granted by the operator; I paid nothing.
- **"Upgrade now" on a locked feature page.** I could not retest it: I am on Pro, so nothing
  in my account is locked and the button does not exist for me. **Recorded as untestable
  rather than confirmed or withdrawn.** I will not guess.
- **"Pay from wallet" on the pending ₵135.00 billing row. Deliberately not pressed.** It is a
  spend button, on a bill for a plan I am not on, at a price I was never charged, that the
  product cannot explain. I pressed **Verify** instead — twice, in silence.
- **Report exports.** PDF / Excel / CSV buttons sit on all eight reports and I did not press
  them. Untested.
- **Tenants 2, 3 and 4.** The onboarding buttons open once per sign-in and then stop, so
  Adenta Rooms 2–8 are still empty. Chapters 5 and 7 were played out month-by-month against
  one tenant, and I have said so rather than pretending otherwise.
- **Sending anything to a tenant** — Send Invoice, SMS reminders, WhatsApp reminders, the
  Communication section. **Deliberately not pressed:** the email on Akosua's record is one I
  invented and may belong to a real person.
- **Uploading a document.** The flow exists and the type list is right, but I had no file to
  hand, so no upload was completed. Untested, not broken.
- **Photographs on a maintenance request.** The Photos tab is there and I could not use it,
  same reason.
- **Anything gated on SMS.** No SMS service on this machine. Signup sensibly used email
  instead, so nothing blocked me — but SMS Sender ID settings and SMS reminders are untested.
- **The caretaker's limited access.** Members/Agents and Settings → Team & Roles were never
  opened. **I still cannot say whether Yaw could record a payment without seeing what the East
  Legon expat pays**, and that was one of my main questions coming in.
- **Utilities, Rent Reviews, Notices, Violations, Occupant History, Preventative Schedules,
  Maintenance Categories, Support** — all present in the menu, none opened.
- **Renewals and move-out**, including forfeiting part of a caution fee — the thing I most
  wanted to see, given it is why I lost a year's advance once.
- **Whether the ₵330 gets double-counted** if the maintenance ledger and the expense ledger
  are ever joined up. It is in both today. I could only observe that they do not talk to each
  other; I cannot say what happens when they do.

