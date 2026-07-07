# CSV Import Workflow - CRM SaaS Dashboard

A modern, production-quality CSV import interface built with React, Next.js, Tailwind CSS, and shadcn/ui components. This UI provides a complete workflow for uploading, previewing, processing, and managing CSV data imports for CRM systems.

## Features

### 🎯 Complete 4-Step Workflow

1. **Upload CSV** - Drag-and-drop interface with file validation
2. **Preview** - Beautiful data table with pagination and search
3. **Processing** - Animated loading state with progress tracking
4. **Results** - Comprehensive dashboard with success metrics and error details

### ✨ User Experience

- **Responsive Design** - Works flawlessly on mobile (375px), tablet, and desktop (1280px+)
- **Smooth Animations** - Fade-in, slide-up, and pulse animations throughout
- **Polished UI** - Enterprise-grade aesthetic inspired by Linear, Notion, Vercel, and Stripe
- **Accessibility** - Semantic HTML, ARIA roles, keyboard navigation support
- **State Management** - Seamless transitions between workflow steps

### 🎨 Design Highlights

- **Color Palette**: Blue primary (#2563EB) with slate neutrals and accent colors
- **Typography**: Clean, balanced spacing with generous whitespace
- **Components**: Cards with subtle shadows, rounded corners (xl), and soft borders
- **Tables**: Sticky headers, horizontal scrolling, zebra striping, hover effects

## Project Structure

```
components/
├── stepper.tsx                 # Progress stepper showing current step
├── animated-counter.tsx        # Animated number counters for metrics
└── steps/
    ├── upload-step.tsx         # CSV file upload with drag-and-drop
    ├── preview-step.tsx        # Data table preview with pagination
    ├── processing-step.tsx     # Loading state with checklist
    └── results-step.tsx        # Results dashboard with metrics and tabs

app/
├── page.tsx                    # Main CSV import application
├── demo/page.tsx              # Demo page for viewing all steps
└── layout.tsx                 # Root layout with metadata
```

## Components Breakdown

### Upload Step
- Drag-and-drop zone with dashed border
- File size display and validation
- "Replace file" and "Remove file" options
- Helper text for supported formats (UTF-8 CSV, max 20MB)
- Smooth hover animations

### Preview Step
- Responsive data table with sticky header
- Row and column count badges
- Pagination controls (Previous/Next)
- Horizontal scrolling for wide tables
- Zebra striping and hover row highlighting
- "Confirm Import" and "Upload Different File" actions

### Processing Step
- Animated spinner with pulsing effect
- Progress bar showing processing completion (%)
- Animated checklist with status indicators:
  - ✔ Completed (green)
  - ⏳ Current (blue, pulsing)
  - Pending (gray)
- Premium loading experience

### Results Step
- 4 summary cards with icons and animated counters:
  - Imported Records (green)
  - Skipped Records (orange)
  - Success Rate (blue)
  - Processing Time (purple)
- Tabbed interface: "Parsed Records" and "Skipped Records"
- Search bar and Filter/Export buttons
- Parsed records table with success badges
- Skipped records table with error reason badges (red)
- "Import Another File" action button

### Stepper Component
- Horizontal progress indicator
- Active step highlighting
- Completed step checkmarks
- Responsive layout with flexible spacing

## Technical Stack

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 with semantic design tokens
- **Icons**: Lucide React
- **UI Components**: shadcn/ui patterns
- **State Management**: React hooks (useState)
- **Animations**: Tailwind CSS animations + CSS keyframes

## Key Features Implemented

### CSV Parsing
- Simple CSV parser that extracts headers and rows
- Splits by comma and newline
- Handles whitespace trimming

### Data Display
- Responsive table with horizontal scrolling on mobile
- Pagination with configurable rows per page (default: 20)
- Supports unlimited columns

### Animations & Polish
- Fade-in and slide-up animations on content
- Animated progress bar during processing
- Spinner with rotation animation
- Checklist items animate in sequence
- Animated number counters on metrics
- Smooth transitions between steps

### Responsive Breakpoints
- Mobile: 375px (full width, stacked layout)
- Tablet: 768px+ (optimized spacing)
- Desktop: 1280px+ (full-featured layout)

### Accessibility
- Semantic HTML elements
- Proper button types and disabled states
- Color contrast compliant
- Text balance on headings
- Readable font sizes throughout

## Usage

### Main Application
```bash
npm run dev
# Visit http://localhost:3000
```

The main app (`/`) starts on the Upload step. Users can:
1. Upload a CSV file (or drag-and-drop)
2. Review the data in the Preview step
3. Confirm the import and watch the processing animation
4. See the Results with parsed and skipped records

### Demo Page
```bash
# Visit http://localhost:3000/demo
```

The demo page allows you to jump to any step directly using the button controls at the top. Useful for testing each step's UI independently.

## Customization

### Theming
Edit the design tokens in `app/globals.css` within the `:root` selector:
```css
:root {
  --color-primary: oklch(...);
  --color-accent: oklch(...);
  /* ... other tokens ... */
}
```

### Colors
The app uses semantic design tokens:
- Primary blue: Used for active states, primary CTAs
- Orange/Yellow: Used for warnings (skipped records)
- Green: Used for success states
- Purple: Used for secondary metrics
- Slate grays: Neutrals for text, borders, backgrounds

### Table Configuration
Modify items per page in `preview-step.tsx`:
```typescript
const itemsPerPage = 20; // Change this value
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

## Performance

- Optimized animations using CSS transforms
- Efficient table rendering with pagination
- Lazy loading compatible
- Mobile-optimized assets

## Future Enhancements

- Real backend integration for CSV processing
- Column mapping interface
- Data validation rules
- Export results to various formats
- Bulk import history tracking
- Advanced filtering and sorting
- Dark mode support
- Multi-language localization

## Notes

- This is a frontend-only implementation focusing on UI/UX
- The processing step simulates a 3-second delay before showing results
- CSV parsing is basic - for production, use a robust parser library
- File upload validation can be extended with server-side checks
- The results data is mocked - replace with actual API calls in production

## License

Built with v0 - Vercel's AI-powered UI generation platform.
