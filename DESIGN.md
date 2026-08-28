# Design System Strategy: The Financial Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Quiet Authority."** 

In the chaotic world of personal finance, most apps shout with loud badges and complex grids. This system takes the opposite approach: it feels like a high-end architectural portfolio or a luxury Swiss watch catalog. We are moving away from "app-like" utility toward "editorial" elegance. 

We break the "template" look through **Negative Space Anchors**—intentional gaps in the layout that allow the eye to rest—and **Typographic Dominance**, where the numbers themselves are the primary visual assets. By utilizing asymmetrical margins and overlapping tonal layers, we create a sense of bespoke craftsmanship that builds deep trust with the user.

---

## 2. Colors: Tonal Architecture
The palette is rooted in a "cool-neutral" base, using high-chroma functional colors only as surgical accents.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
*   **Boundaries** must be defined solely through background shifts. For example, a transaction list sits on `surface-container-lowest` (#ffffff) while the page background remains `surface` (#f7f9fb).
*   **Contrast over Containment:** Use the change in value between `surface-container-low` and `surface-container-highest` to signal hierarchy.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical, stacked sheets of fine vellum:
1.  **Level 0 (Base):** `surface` (#f7f9fb) – The canvas.
2.  **Level 1 (Sections):** `surface-container-low` (#f2f4f6) – For grouping related content.
3.  **Level 2 (Active Cards):** `surface-container-lowest` (#ffffff) – Reserved for the most important interactive elements.

### Signature Textures
To avoid a "flat" or "cheap" feel, main CTAs should utilize a subtle **Tonal Gradient**. Instead of a flat `primary`, use a linear gradient from `primary` (#006948) to `primary_container` (#00855d) at a 135-degree angle. This provides a "jewel-like" depth that feels premium.

---

## 3. Typography: The Editorial Scale
We use **Manrope** for its geometric clarity and modern "tech-boutique" feel.

*   **Financial Heroism:** Use `display-lg` (3.5rem) for main account balances. The letter-spacing should be set to `-0.02em` to feel tighter and more authoritative.
*   **Hierarchy of Data:** 
    *   **Labels:** Use `label-md` or `label-sm` in **all-caps** with `+0.05em` letter-spacing for category headers (e.g., "MONTHLY SPENDING"). This creates an editorial "caption" look.
    *   **Body:** `body-lg` (1rem) is the workhorse. Ensure a line height of at least 1.5 for maximum breathability.
*   **Color as Grammar:** Use `on_surface` (#191c1e) for primary data and `on_surface_variant` (#3d4a42) for secondary metadata. Never use pure black.

---

## 4. Elevation & Depth: The Layering Principle
Traditional drop shadows are forbidden. We use **Ambient Occlusion** logic.

*   **Tonal Layering:** Depth is achieved by placing a `surface-container-lowest` card on top of a `surface-container-low` background. The "lift" is perceived through the color shift, not a shadow.
*   **Ambient Shadows:** For floating elements (like a Bottom Sheet), use a shadow with a blur of `40px`, a spread of `0`, and an opacity of `4%`. The color must be a tinted version of `on-surface`, never grey.
*   **Glassmorphism:** Navigation bars or top headers should use a semi-transparent `surface` color with a `backdrop-filter: blur(20px)`. This makes the interface feel like a singular, integrated object rather than a collection of parts.

---

## 5. Components: Minimalist Primitives

### Buttons
*   **Primary:** No borders. Large padding (16px 32px). `DEFAULT` roundedness (0.25rem). Use the signature Primary Gradient.
*   **Secondary:** Ghost-style. No background, no border. Use `primary` text color with a `label-md` weight.
*   **Interaction:** On press, the button should shift to `primary_container`. Do not use "glow" effects.

### Input Fields
*   **The "Invisible" Input:** Remove the traditional box. Use a single bottom stroke of `outline_variant` at 20% opacity. When focused, the stroke transitions to `primary` (#006948) with a 2px height. 
*   **Floating Labels:** Labels should use `label-sm` and sit 8px above the input, always visible.

### Cards & Lists
*   **Prohibition of Dividers:** Never use a horizontal line to separate list items. Use **Vertical White Space**. If separation is needed, use a 4px vertical gap and a slight tonal shift in the background of the list item.
*   **The Financial Card:** Cards for specific budgets should use `surface-container-lowest`. Use a "Progress Bar" that is only 2px thick, using `outline_variant` for the track and `primary` (or `error`) for the fill.

### Narrative Chips
*   Instead of heavy, filled badges, use `label-sm` text with a 4px circular "dot" of the functional color (Green, Red, Amber, Violet) to its left. This mimics high-end data visualization.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. For example, a 24px left margin and a 40px right margin can make a simple list feel like a custom layout.
*   **Do** use `display` type scales for numbers. In a finance app, the "Amount" is the hero; the "Merchant" is the sidekick.
*   **Do** prioritize "Over-spacing." If you think there is enough white space, add 8px more.

### Don't
*   **Don't** use icons unless they are strictly necessary for navigation. Rely on clear, elegant typography instead.
*   **Don't** use 100% opaque borders. They create "visual noise" that breaks the editorial flow.
*   **Don't** use standard "Material Design" blue. Stick strictly to the `primary` (Green) and `secondary` (Violet) functional roles to keep the identity distinct.