# Universal Filter System v2.0

This document explains the new composable filtering and search system with universal tooltip functionality.

## Overview

The Universal Filter System v2.0 provides:
- **Composable filtering** with visible filter cards (no hidden dropdowns)
- **Universal tooltip component** for enhanced UI
- **Course cards with hover tooltips** showing tags, fields, and difficulty
- **Configurable filter sections** that can be enabled/disabled individually

## New Components

### 1. Tooltip Component (`src/components/core/Tooltip.tsx`)

Universal tooltip that can be used anywhere in the application.

#### Props:
- `content`: JSX element to show in tooltip
- `children`: Element that triggers the tooltip
- `position?`: 'top' | 'bottom' | 'left' | 'right' (default: follows cursor)
- `delay?`: Hover delay in ms (default: 300)
- `class?`: Additional CSS classes
- `disabled?`: Disable tooltip

#### Usage Example:
```tsx
<Tooltip 
  content={<div>Tooltip content here</div>} 
  position="top" 
  delay={200}
>
  <button>Hover me</button>
</Tooltip>
```

### 2. ComposableFilter Component (`src/components/01 - Home/Filters/ComposableFilter.tsx`)

New composable filter system with always-visible filter cards.

#### Props:
- `onFilterChange`: Callback function that receives filter state
- `pageType`: 'resources' | 'discover' | 'courses'
- `placeholder?`: Custom search placeholder
- `class?`: Additional CSS classes
- `tagsConfig?`: Configuration for tags filter
- `fieldsConfig?`: Configuration for fields filter  
- `typesConfig?`: Configuration for types filter

#### FilterConfig Interface:
```tsx
interface FilterConfig {
  enabled: boolean;
  options: string[];
  title: string;
  icon: any; // Lucide icon component
}
```

#### Usage Example:
```tsx
<ComposableFilter 
  onFilterChange={setFilters}
  pageType="discover"
  tagsConfig={{
    enabled: true,
    options: ["beginner", "advanced", "theory"],
    title: "Tags",
    icon: Tag
  }}
  fieldsConfig={{
    enabled: true,
    options: ["AI", "Math", "Physics"],
    title: "Subject Fields",
    icon: BookOpen
  }}
  typesConfig={{
    enabled: false, // This filter won't show
    options: [],
    title: "Types",
    icon: FileText
  }}
/>
```

## Updated Components

### CourseCard with Hover Tooltips

CourseCard now shows tags, field, and difficulty only when hovered via tooltip:

#### Features:
- Clean card design (no visible tags/metadata by default)
- Hover tooltip shows all metadata in organized format
- Color-coded difficulty levels
- Automatic tooltip disable when no metadata is available

#### Usage:
```tsx
<CourseCard 
  title="Machine Learning"
  description="Learn ML fundamentals"
  icon="Brain"
  img={courseImage}
  tags={["beginner", "theory", "practical"]}
  field="Artificial Intelligence"
  difficulty="Beginner"
/>
```

## Key Improvements

### 1. Always-Visible Filters
- No need to click "Advanced Filters" button
- Filter cards are always visible with dropdown options
- Each filter can be individually enabled/disabled
- Clear visual indication of active filters with count badges

### 2. Composable Configuration
```tsx
// Enable only tags and fields
<ComposableFilter 
  tagsConfig={{ enabled: true, options: [...], title: "Tags", icon: Tag }}
  fieldsConfig={{ enabled: true, options: [...], title: "Fields", icon: BookOpen }}
  typesConfig={{ enabled: false, options: [], title: "Types", icon: FileText }}
/>

// Enable only tags
<ComposableFilter 
  tagsConfig={{ enabled: true, options: [...], title: "Custom Tags", icon: Tag }}
  fieldsConfig={{ enabled: false, options: [], title: "", icon: BookOpen }}
  typesConfig={{ enabled: false, options: [], title: "", icon: FileText }}
/>
```

### 3. Enhanced UX
- Cleaner course cards with tooltip metadata
- Responsive filter cards that work on all screen sizes
- Better visual hierarchy with card-based filter sections
- Consistent tooltip behavior across components

## Migration Guide

### From UniversalFilter to ComposableFilter

**Old way:**
```tsx
<UniversalFilter 
  availableTags={tags}
  availableFields={fields}
  availableTypes={types}
  showFields={true}
  showTypes={true}
  pageType="resources"
/>
```

**New way:**
```tsx
<ComposableFilter 
  pageType="resources"
  tagsConfig={{
    enabled: true,
    options: tags,
    title: "Tags",
    icon: Tag
  }}
  fieldsConfig={{
    enabled: true,
    options: fields,
    title: "Subject Fields",
    icon: BookOpen
  }}
  typesConfig={{
    enabled: true,
    options: types,
    title: "Content Type",
    icon: FileText
  }}
/>
```

## Filter Card States

Each filter card shows:
- **Header**: Icon, title, and active count badge
- **Dropdown**: Toggleable with chevron indicator
- **Options**: Scrollable list with selection states
- **Visual feedback**: Selected items highlighted in accent color

## Future Enhancements

1. **Saved Filter Presets**: Save and recall filter combinations
2. **Filter History**: Recent filter states
3. **Smart Suggestions**: Auto-suggest based on current selection
4. **Filter Analytics**: Track usage patterns
5. **Keyboard Navigation**: Full keyboard support for accessibility
6. **Custom Filter Types**: Support for date ranges, numerical ranges, etc.

## Backward Compatibility

The old `UniversalFilter` component is still available for existing implementations, but new features will only be added to `ComposableFilter`.
