# Design Guidelines: AI Discord Moderation Dashboard

## Design Approach
**Selected System**: Modern Dashboard Architecture inspired by Linear and Discord's design language, emphasizing clarity, efficiency, and data hierarchy. This utility-focused application prioritizes quick configuration access and real-time monitoring over decorative elements.

## Core Design Principles
1. **Information Density with Breathing Room**: Pack functionality without crowding
2. **Instant Visual Feedback**: Clear status indicators and real-time updates
3. **Hierarchical Navigation**: Settings, logs, and stats clearly separated
4. **Scannable Data**: Tables and cards optimized for quick comprehension

---

## Typography System

**Font Stack**: Inter (primary), system-ui fallback
- **Display/Headers**: 2xl to 4xl, font-weight 700, tight leading
- **Section Titles**: xl to 2xl, font-weight 600
- **Body/Settings**: base to lg, font-weight 400-500
- **Data/Logs**: sm to base, font-weight 400, monospace for IDs
- **Labels/Meta**: xs to sm, font-weight 500, uppercase tracking-wide for categories

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Page margins: px-6 py-8 to px-8 py-12

**Grid Structure**:
- Sidebar navigation: Fixed 16-20rem width
- Main content area: Flexible with max-w-7xl container
- Settings panels: 2-column layout on desktop (lg:grid-cols-2)
- Log entries: Full-width list with subtle dividers

---

## Component Library

### Navigation (Sidebar)
- Fixed left sidebar with brand logo at top
- Vertical nav links with icons (Home, Settings, Logs, Stats, Servers)
- Active state indicator (left border accent)
- Bottom section: User profile, documentation link, logout
- Collapsible on mobile (hamburger menu)

### Dashboard Home
- **Stats Cards Row**: 4-column grid displaying total violations, actions taken, servers monitored, detection accuracy
- **Quick Actions Panel**: Prominent cards for "Configure Detection", "View Recent Logs", "Manage Servers"
- **Recent Activity Feed**: Compact list showing last 5-8 moderation events with timestamps and quick action buttons

### Settings Panel (Primary Focus)
**Detection Sensitivity Section**:
- Large slider component with visual markers (Low → Medium → High → Strict)
- Real-time preview text showing sample violation and confidence score
- Description text explaining each sensitivity level

**Action Configuration Section**:
- Radio button groups or segmented controls for primary action selection
- Checkbox list for additional actions (can select multiple):
  - Warn user (with custom message input)
  - Log to channel (dropdown selector)
  - Kick user
  - Ban user (with duration options)
  - Execute custom command (text input with autocomplete)
- "Test Configuration" button to simulate detection

**Server & Channel Settings**:
- Server selector dropdown with Discord server icons
- Multi-select channel list with checkboxes
- "Monitor all channels" toggle switch

### Moderation Logs Viewer
- **Filter Bar**: Date range picker, severity filter chips, action type dropdown, search input
- **Log Table**: Columns for Timestamp, User, Message Preview, Violation Type, Confidence Score, Action Taken
- Expandable rows showing full message content and AI reasoning
- Pagination controls at bottom
- Export logs button (top-right)

### Statistics Dashboard
- **Time Range Selector**: Tabs for 24h, 7d, 30d, All time
- **Violation Trends Chart**: Line graph showing detections over time
- **Violation Types Breakdown**: Donut chart with legend
- **Top Violators List**: Small table with user avatars, names, violation counts
- **Action Distribution**: Horizontal bar chart showing warn/kick/ban ratios

---

## Visual Hierarchy & Spacing

**Card Design**:
- Rounded corners (rounded-lg to rounded-xl)
- Subtle borders (border)
- Padding: p-6 for standard cards, p-8 for feature cards
- Headers with bottom borders to separate from content

**Form Elements**:
- Input fields: Full-width with consistent height (h-10 to h-12)
- Labels: mb-2 spacing, font-medium
- Helper text: mt-1 spacing, text-sm
- Grouped controls: gap-4 vertical spacing

**Buttons**:
- Primary actions: Larger size (px-6 py-3), font-semibold
- Secondary actions: Standard size (px-4 py-2)
- Danger actions (ban, kick): Distinct styling
- Icon buttons: Square aspect ratio (w-10 h-10)

---

## Data Display Patterns

**Tables**:
- Sticky headers when scrolling
- Alternating row treatments for scannability
- Hover states on rows
- Right-aligned actions column
- Compact row spacing (py-3 to py-4)

**Status Indicators**:
- Badge components for violation severity (Critical, High, Medium, Low)
- Dot indicators with labels for online/offline bot status
- Progress bars for detection confidence scores

**Empty States**:
- Centered content with icon, heading, description, and CTA
- "No violations detected" with illustration/icon
- "Configure your first server" onboarding prompt

---

## Responsive Behavior

**Desktop (lg+)**: Full sidebar navigation, multi-column layouts, expanded tables
**Tablet (md)**: Collapsible sidebar, 2-column grids collapse to 1
**Mobile (base)**: Hamburger menu, single-column stacked layouts, horizontal scrolling for tables

---

## Interactive Elements

**Animations**: Minimal and purposeful
- Smooth transitions on navigation (transition-colors duration-200)
- Subtle scale on card hovers (hover:scale-[1.01])
- Loading spinners for AI detection in progress
- Toast notifications for save confirmations and errors

**Real-time Updates**:
- Pulsing indicator when new violation detected
- Auto-refreshing log feed (with manual refresh button)
- Live connection status in header

---

## Accessibility

- Keyboard navigation throughout
- ARIA labels on all interactive elements
- Focus visible states on all inputs and buttons
- Sufficient contrast ratios for all text
- Screen reader announcements for real-time updates