read PROJECT_CONTEXT.md before starting and write down all about changes that you done in the file.

Major UI/UX Refactor: Convert Navigation Circles to Vinyl Records

Objective: Enhance the application's atmosphere by completely redesigning the six main dashboard navigation elements (CircleButton component) to resemble stylized vinyl records.

1. Design Concept: The Vinyl Record Look

Shape: Maintain the circular shape.

Color (Vinyl): Dark Black/Very Dark Gray (e.g., bg-zinc-900 or bg-black/90).

Color (Label/Text): High contrast White/Light Gray.

2. CircleButton Component Refactor:

Action: Update the internal structure and styling of the CircleButton component definition.

Styling Requirements:

Outer Ring: Give the circle a thin white/light-gray border (the record's edge).

Vinyl Body: Fill the background with a deep black (bg-zinc-900).

Center Label (The Text Area): Create a slightly smaller inner circle or focal point to serve as the paper label (e.g., bg-neutral-800 or bg-white/10).

3. Interaction & Animation (Atmosphere)

Hover Effect (Crucial): When the user hovers over a button, apply a subtle, continuous rotation effect to mimic a spinning record.

CSS/Tailwind: Use hover:rotate-3 or hover:rotate-6 combined with transition-transform duration-300 on the icon/label container.

Icon Color Accent: Keep the green accent for "Add Income" and potentially a subtle red/white accent for "Add Expense," contrasting with the black vinyl background.

4. Code Implementation Detail:

The label (Add Expense, etc.) and icon should remain clearly visible and centrally placed on the "label area" of the record.

Ensure the sizing remains appropriate (not bulky) on desktop view.

UI Unification: Convert Settings to Full-Viewport Split Layout (UX Focused)

Objective: Refactor the Settings page (/settings) to align with the core application architecture (Transactions/Recurring). The primary goal is to remove the floating "card" container and implement a rigid, full-height split layout, while ensuring the forms remain compact and centrally located for optimal usability.

1. Layout Architecture Change:

Remove: Delete the outer max-w-5xl, h-[80vh], and rounded-[50px] wrappers.

New Root: The Settings page must adopt the full-viewport split: flex h-screen w-full overflow-hidden.

2. Left Sidebar (Theming & Structure):

Width: Fixed width, approx w-80 or w-1/4.

Styling: Retain the existing strict theme inversion logic for the sidebar:

Light Mode: Light Background, Black Text.

Dark Mode: Black Background (dark:bg-black), White Text.

3. Right Content Area (UX Constraint & Content):

Layout: flex-1 h-full (Full height, remaining width).

Background: Apply the image /img/back.jpg with the required dark overlay (bg-black/50 backdrop-blur-md).

UX Fix (Content Constraint): To solve the "excessive mouse movement" issue, the content (forms, lists of accounts/categories) inside this right panel must be centrally constrained.

Apply an inner wrapper with: w-full max-w-4xl mx-auto py-12 px-8.

This ensures inputs and text blocks are focused in the middle of the screen, regardless of monitor size, improving usability.

4. Content Components Update:

Ensure the layouts for Global Settings, Accounts List, and Category Management are correctly centered within this new max-w-4xl wrapper.

Maintain the minimalist "Ghost Input" styling and clean typography established in previous steps.

UI/UX Refactor: Recurring Page Summary Integration

Objective: Move the "Total Monthly Estimate" metric into the dedicated Right Panel and style that panel to match the clean, metric-driven Budget Overview aesthetic. The goal is visual consistency across all financial pages.

1. Relocation & Removal:

Action: Remove the "Total Monthly Estimate" display from the bottom section (footer) of the Left Panel.

Action: Integrate this metric into the Right Panel's Summary View (the default state).

2. Right Panel Styling (Unification):

Context: The Right Panel is currently used for Summary and Form views. Focus the styling on the Summary View.

Styling: Apply a clean, structured layout similar to the containers/cards used in the /budget Right Panel (high contrast, separated blocks).

Metrics Display:

Hero Metric: Display the "Total Monthly Estimate" prominently as the main, large number at the top of the summary panel.

Status Metrics: Below the hero, clearly separate and display the calculated "Paid This Month" and "Pending" amounts (using the green/orange/gray color accents).

3. Functional Consistency:

Ensure the "Add New Recurring Expense" button remains accessible and prominent at the bottom of this Summary Panel, maintaining its role as the primary action for the page.

UX/UI Polish: Transaction Modal Input Optimization
Objective: Improve the user experience and visual consistency of the "Add Expense" and "Add Income" modals. The goal is to allow immediate data entry without extra clicks and to remove unsightly browser-default styles.

1. Feature: Auto-Focus on "Amount" Input
   - Requirement: When the modal opens (mounts), the "Amount" input field must automatically receive focus.
   - Implementation: Use a React `useRef` combined with a `useEffect` hook to trigger `.focus()` on the input element immediately after the modal renders.
   - User Goal: The user should be able to type the number immediately after clicking the dashboard button, without needing to click the input field first.

2. Styling: Remove Default Number Input Spinners
   - Problem: The `type="number"` input currently displays the default browser "up/down" arrow buttons (spinners), which clutter the UI and clash with the "Hard Rock" design.
   - Fix: Apply CSS to hide these spinners across all browsers.
   - CSS Reference:
     /* Chrome, Safari, Edge, Opera */
     input::-webkit-outer-spin-button,
     input::-webkit-inner-spin-button {
       -webkit-appearance: none;
       margin: 0;
     }
     /* Firefox */
     input[type=number] {
       -moz-appearance: textfield;
     }

3. Scope:
   - Apply these changes to both the "Add Expense" and "Add Income" forms (or the shared component if reusable).
   - Ensure the input remains fully functional for typing numbers.


   UI Refactor: Dashboard Navigation as "Vinyl Records"
Objective: Refactor the main navigation buttons on the Dashboard to resemble realistic Vinyl Records. The current implementation looks like flat transparent circles. The goal is to use pure CSS to create a "grooved" texture, a central colored label, and a spindle hole, adding a "spin" animation on hover to fit the "Hard Rock" theme.

1. Component Structure (The "Record"):
   Target the navigation buttons container. Each button must be transformed into a composed element:
   - Outer Ring ( The Vinyl): Should use a `repeating-radial-gradient` (black to dark gray) to simulate vinyl grooves/texture.
   - Middle Circle (The Label): A smaller, absolute-centered circle inside the vinyl. This serves as the background for the Icon.
     - Color Logic: Use distinct colors for the label based on action type (e.g., Red for 'Add Expense', Green for 'Add Income', Dark Grey/Blue for 'Settings').
   - Center Dot (The Spindle Hole): A very small white or black dot in the absolute center (z-index highest) to mimic the record hole.

2. Visual Details & Styling:
   - Size: Increase the button size slightly (e.g., w-24 h-24 or w-28 h-28) to accommodate the details.
   - Shadows: Add a drop-shadow (shadow-xl) to lift the record off the background image.
   - Border: Remove the existing thin white border. Real records don't have borders. Maybe a subtle highlight on the edge.

3. Typography & Icons:
   - Position: Place the Icon strictly within the "Label" (Middle Circle).
   - Text Label: Move the text (e.g., "Add Expense") OUTSIDE and BELOW the record button.
     - Style: Small, uppercase, tracking-widest, semi-bold (font-rock/styled font), distinct from the record itself. This prevents text from obscuring the vinyl texture.

4. Interaction (Animation):
   - Hover Effect: Apply a smooth rotation animation (`hover:animate-spin-slow` or custom transition transform: rotate).
   - Speed: It should rotate slowly and continuously while hovered, resembling a playing record.
   - Scale: Slight scale-up (scale-105) on hover for tactile feel.

5. Layout Constraints:
   - Ensure the flex container centers these new larger items correctly on different screen sizes.
   - On mobile, ensure the grid wraps gracefully (e.g., 2 or 3 items per row).