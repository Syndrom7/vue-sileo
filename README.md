<div align="center">
  <h1>vue-sileo</h1>
  <p>Physics-based toast notifications for Vue 3</p>
  <p>
    <a href="https://www.npmjs.com/package/vue-sileo">
      <img src="https://img.shields.io/npm/v/vue-sileo" alt="npm" />
    </a>
    <a href="https://vue-sileo.vercel.app">
      <img src="https://img.shields.io/badge/demo-live-brightgreen" alt="demo" />
    </a>
  </p>
</div>

A Vue 3 port of [sileo](https://github.com/hiaaryan/sileo) by [@hiaaryan](https://github.com/hiaaryan). All credit for the design and animations goes to the original library.

**[🚀 View Demo](https://vue-sileo.vercel.app)**

## Installation

```bash
npm install vue-sileo
```

## Usage

```vue
<script setup lang="ts">
import { Toaster, sileo } from "vue-sileo";
import "vue-sileo/styles.css";

function notify() {
  sileo.success({
    title: "Success",
    description: "Your changes have been saved.",
  });
}
</script>

<template>
  <Toaster position="top-right" />
  <button @click="notify">Save</button>
</template>
```

## API

### Toast Types

```ts
sileo.success({ title: "Success", description: "Operation completed" });
sileo.error({ title: "Error", description: "Something went wrong" });
sileo.warning({ title: "Warning", description: "Please confirm" });
sileo.info({ title: "Info", description: "New version available" });
sileo.action({ 
  title: "Update", 
  description: "Click to install",
  button: { title: "Install", onClick: () => {} }
});
```

### Promise Handling

```ts
sileo.promise(
  fetchData(),
  {
    loading: { title: "Loading..." },
    success: (data) => ({ title: "Done", description: data }),
    error: (err) => ({ title: "Failed", description: err.message }),
  }
);
```

### Configuration

```vue
<Toaster
  position="top-right"
  :offset="16"
  :max-visible-toasts="3"
  :options="{ duration: 5000, roundness: 18 }"
/>
```

**Positions**: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`

### Options

```ts
{
  title?: string;
  description?: string;
  position?: SileoPosition;
  duration?: number | null;      // milliseconds, null = infinite
  fill?: string;                 // background color
  roundness?: number;            // border radius
  autopilot?: boolean;           // auto expand/collapse
  descriptionAlign?: "left" | "center" | "right";  // default: "left"
  closable?: boolean;              // show dismiss button (default: true)
  button?: { title: string; onClick: () => void };
}
```

### Toaster Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `SileoPosition` | `"top-right"` | Default position for all toasts |
| `offset` | `number \| string \| object` | `16` | Distance from viewport edges |
| `options` | `Partial<SileoOptions>` | — | Default options merged into every toast |
| `maxVisibleToasts` | `number` | `3` | Max toasts visible per position before stacking |
| `theme` | `"light" \| "dark" \| "system"` | — | Color theme |

## Credits

This is a Vue 3 port of [sileo](https://github.com/hiaaryan/sileo) by [@hiaaryan](https://github.com/hiaaryan). Check out the [original library](https://sileo.aaryan.design) and [documentation](https://sileo.aaryan.design/docs).

## License

MIT
