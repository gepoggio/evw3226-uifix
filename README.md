# evw3226-uifix
User script to add hidden menus and fix broken checks on Uvee EVW3226 web UI

Tested with:
- UPC Ireland firmware EVW3226_1.0.16
- Tampermonkey (Chrome)

## Usage

1. Install with script manager of choice (Greasemonkey for Firefox, Tampermonkey for Chrome)
2. Modify "match" URL to: `http://YOUR_ROUTER_IP/cgi-bin/setup.cgi?gonext=Rg*`

## Hidden menus added
- System tab
  * Switch Mode
- Advanced tab
  * Port Filters
  * Forwarding
  * Port Triggers
  * DMZ Host

## Fixes
- Faulty check on port forwarding (checked if destination IP was inside DHCP range)
