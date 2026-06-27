# 🔍 PhishGarud Threat Intelligence Features Dictionary

This document details the telemetry metrics, algorithms, and analytical layers used within **PhishGarud** to detect, classify, and explain malicious links.

---

## 📐 1. Lexical Feature Dictionary (30 Offline Attributes)

The ensemble classifier uses 30 lexical features extracted directly from the URL string. These features run offline in sub-200ms, making them immune to network latency or blocking.

| Attribute Name | Technical Description | Phishing Indicator |
| :--- | :--- | :--- |
| `url_length` | Total character count of the URL | Phishers use long URLs to hide query strings |
| `hostname_length` | Total character count of the host domain | Impersonators use long nested subdomains |
| `path_length` | Character length of the URL path string | Obfuscated paths mimicking directories |
| `query_length` | Character length of the query string (`?key=val`) | Tokens capturing email payloads |
| `fragment_length` | Character length after the fragment identifier `#` | Anchor tags used in client-side redirects |
| `count_dots` | Number of dot `.` characters in the URL | Excess subdomains (e.g. `paypal.com.login.net`) |
| `count_hyphens` | Number of hyphen `-` characters | Brand clustering words (e.g. `pay-pal-security`) |
| `count_underscores` | Number of underscore `_` characters | Parameter separations mimicking standard files |
| `count_slashes` | Number of slash `/` characters | Excessively deep path hierarchies |
| `count_question_marks`| Number of question marks `?` | Presence of multiple query separators |
| `count_equals` | Number of equals signs `=` | Parameter injections capturing credentials |
| `count_ampersands` | Number of ampersand signs `&` | Multiplex query arguments (typical in tracking links) |
| `count_at_signs` | Number of `@` symbols | Browser discards prefix before `@`, redirecting behind it |
| `count_percent_encoding`| Number of percent encodings `%XX` | Obfuscation of characters to avoid lexical check |
| `count_digits_in_domain`| Number of numerical digits in the hostname | Randomly generated domains (DGA) |
| `count_subdomains` | Number of subdomains split by `.` | Tunnelling and namespace nesting (e.g. `sub.sub2.url`) |
| `has_ip_address` | Boolean: is host domain an IP address (v4/v6) | Avoids registry lookups and brand matches |
| `is_shortened` | Boolean: matches shortener service domain list | Obfuscation of target landing page (e.g. `bit.ly`) |
| `has_at_in_url` | Boolean flag for `@` symbol | Critical indicator of credential spoofing |
| `double_slash_in_path`| Boolean: `//` present in URL path | Indicates protocol tricks or path redirects |
| `has_port` | Boolean: contains custom port number (e.g. `:8080`) | Non-standard port exposure |
| `port_number` | Exposed custom port value | Typically standard HTTP/HTTPS are empty |
| `tld_in_path` | Boolean: TLD substring in the path | Mimics official brands (e.g. `bank.com/signin`) |
| `https_token_in_domain`| Boolean: `https` string in domain namespace | Attempting to visually spoof SSL trust |
| `subdomain_is_ip_like`| Boolean: subdomain resembles an IP address | DNS spoofing |
| `special_char_ratio` | Percentage of special characters in URL | Excess obfuscation (e.g. `-`, `_`, `=`, `%`) |
| `digit_ratio_in_url` | Percentage of digits in URL | Key signature of machine-generated names |
| `subdomain_entropy` | Shannon entropy of the subdomain characters | Randomness measure; flags generated domain names |
| `longest_word_length` | Length of the longest alpha word in URL | Obfuscated strings without spacing |
| `avg_word_length` | Average character length of words | Deviates from natural English language patterns |

---

## 🤝 2. Verdict Fusion Heuristics

The **Verdict Fusion Algorithm** runs synchronously after Celery asynchronous progressive tasks complete. It adjusts the ML probability baseline score based on network Sandbox telemetry.

### Logic Weight Adjustments

Let $P_{base}$ represent the probability calculated by the XGBoost lexical model.

1.  **WHOIS Domain Age**:
    *   If domain age is $< 30$ days (recent registration), add `0.15` to risk probability:
        $$P_{final} = P_{base} + 0.15$$
2.  **SSL Certificate Age**:
    *   If certificate was issued within $< 7$ days, add `0.12` to risk probability:
        $$P_{final} = P_{final} + 0.12$$
3.  **Redirect Domain Hopping**:
    *   If redirect tracer hops $\ge 3$ times **and** crosses domain boundaries, add `0.10`:
        $$P_{final} = P_{final} + 0.10$$
4.  **Levenshtein Brand Similarity**:
    *   If edit distance to a target brand domain is exactly `1` (visual mimicry / typosquatting), add `0.18`:
        $$P_{final} = P_{final} + 0.18$$
5.  **HTML DOM Credentials & Actions**:
    *   If page contains a `<form>` containing a password input **and** the action URL points to a external domain, add `0.14`:
        $$P_{final} = P_{final} + 0.14$$

### Boundary Limits & Overrides

*   **Boundary Cap**: Final probability $P_{final}$ is bounded strictly between $0.01$ and $0.99$.
*   **Database Override**: A verified match on PhishTank or URLhaus immediately overrides the verdict and sets $P_{final} = 0.99$ and `verdict = "PHISHING"`.

---

## 🗣️ 3. Threat Classification Narrative Map

Narratives are compiled dynamically by evaluating combinations of features and writing customized security suggestions:

*   **Credential Harvester Alert**:
    *   *Triggers*: `has_login_form = True` and (`form_action_is_external = True` or `is_suspicious_brand = True`).
    *   *Advice*: Refrain from submitting input parameters; check official hostnames.
*   **Drive-by Download Alert**:
    *   *Triggers*: `count_scripts > 15` or `count_iframes > 3`.
    *   *Advice*: Block popups; verify browser sandbox settings.
*   **Obfuscated Redirect Alert**:
    *   *Triggers*: `hop_count >= 3` and `crosses_domain = True`.
    *   *Advice*: Inspect address bar domains to check for destination jumps.
*   **Typosquatting Mimicry Alert**:
    *   *Triggers*: `is_suspicious_brand = True` and edit distance $> 0$.
    *   *Advice*: Ensure address bar aligns character-by-character with official service domains.
*   **Legitimate Connection Profiles**:
    *   *Triggers*: Low ML probability ($< 35\%$) and stable WHOIS age ($> 365$ days) and trusted SSL.
    *   *Advice*: Normal safe web browsing.
