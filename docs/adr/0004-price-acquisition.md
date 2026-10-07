# ADR-0004: Price acquisition

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Recommendations need near-real-time **console** prices (PRD §5.7), and no free official source exists. The project never circumvents bot protection and never automates EA services (PRD §6.2).

The M1 spike tested price access on 2026-10-07 with an unmodified Playwright browser and no evasion techniques:

| Source and page                               | Datacenter IP, headless              | Home IP, headless       | Home IP, visible Chrome | Home IP, Chrome without window |
| --------------------------------------------- | ------------------------------------ | ----------------------- | ----------------------- | ------------------------------ |
| FUT.GG card page                              | Page loads, price **empty**          | **Price shown**         | **Price shown**         | not tested                     |
| FUT.GG player list                            | No prices                            | **≈28 prices per page** | not tested              | not tested                     |
| FUT.GG price API (`/api/fut/player-prices/…`) | 403 (Cloudflare and request signing) | not tested              | not tested              | not tested                     |
| FUTWIZ player list                            | 403 "Just a moment…"                 | 403                     | Prices shown            | 403                            |
| FUTBIN player list                            | 403                                  | 403                     | **CAPTCHA**             | not tested                     |

The FUT.GG pages show the following prices:

- **Card page:**
  - the exact current price (for example `650`), shown with an "Updated <timestamp>" note;
  - the lowest and average prices, and recent sales.
- **List page:** abbreviated prices (`0.7K`, `897K`, `14.8M`) for about 28 cards per page load.

The blocking depends on IP reputation: datacenter IPs are refused prices, while the owner's home IP is served normally. A rented VPS would have a datacenter IP as well.

## Decision

1. **Prices come from FUT.GG pages, loaded by a normal browser on the owner's home computer.**
   - A small **price agent** (Node + Playwright, headless Chromium, no stealth or evasion plugins) runs on the owner's Windows PC.
   - It talks only outbound to the app's backend. It fetches a queue of price requests and writes the results back, so the PC needs no open ports.
2. **Two-step fetching:**
   - **Screening:** list pages give approximate prices for many candidates per page load.
   - **Confirmation:** the card pages of the shortlisted candidates give the exact price.
   - Each price is stored with its timestamp, its source and whether it is exact or approximate (PRD PRC-4, PRC-7).
3. **Politeness:**
   - one page at a time;
   - a minimum delay between page loads (initially 3 s);
   - the 30-minute cache (PRC-2), so a card is never re-fetched while its price is fresh.
4. **If FUT.GG starts challenging the agent,** the agent stops and reports the source as blocked. It never tries to pass the challenge (no CAPTCHA solving, no stealth plugins, no proxies to disguise its origin).
5. **Fallbacks:**
   - manual price entry (PRC-6);
   - the last known price, shown with its age;
   - a later option (not in v0.1): capturing prices from FUT.GG pages the user opens in their own browser.
6. **FUTWIZ and FUTBIN are not automated price sources.**
   - FUTWIZ only serves a visible browser, so automating it would mean opening windows on the user's desktop.
   - FUTBIN requires a CAPTCHA.

## Alternatives considered

- **A rented VPS or a serverless worker:** these have datacenter IPs, and FUT.GG withholds prices from them, as the spike showed.
- **Defeating Cloudflare or FUT.GG's request signing** (stealth plugins, residential proxies to disguise traffic, CAPTCHA solvers, reverse-engineered signatures): rejected on principle (PRD §6.2), whatever the use case.
- **Paid API (FUTDatabase prices, about €79/month):** we cannot currently sign up. This option stays open if a key becomes available.
- **Manual entry only:** too little coverage for useful recommendations. Kept as the fallback.

## Consequences

- **Prices refresh only while the owner's PC is on and the agent is running.** Otherwise the app shows the last known prices with their age, and allows manual entry.
- **The agent must start automatically** (Windows Task Scheduler) and be easy to install. A setup guide is part of M5.
- **Throughput:** about one page every 10 s, including render time. Screening about 300 candidates takes about 11 list pages (around 2 minutes). Confirming 20 finalists takes about 20 card pages (around 3–4 minutes). Recommendations therefore fill in progressively (NFR-2).
- **List-page values are approximate** ("897K" means 896.5K–897.5K, and "0.7K" means 650–749). They are only used for screening, never shown as exact prices.
- **The architecture in PRD §9 changes:** the "price worker" becomes the home price agent, and no paid hosting is needed for it.
