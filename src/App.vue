<script setup lang="ts">
import { ref, computed, h, onMounted } from "vue";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
import { Toaster, sileo } from "./lib";
import type { SileoPosition } from "./lib";

/* --------------------------------- State ---------------------------------- */

const position = ref<SileoPosition>("top-right");
const type = ref<"success" | "error" | "warning" | "info" | "action">("success");
const title = ref("Changes saved");
const description = ref("Your changes have been saved successfully.");
const hasDescription = ref(true);
const fill = ref("#FFFFFF");
const duration = ref(6000);
const copied = ref(false);
const installCopied = ref(false);
const isDark = ref(true);

const positions: SileoPosition[] = [
	"top-left", "top-center", "top-right",
	"bottom-left", "bottom-center", "bottom-right",
];

const types = ["success", "error", "warning", "info", "action"] as const;

/* ----------------------------- Code output -------------------------------- */

const codeOutput = computed(() => {
	const opts: string[] = [];
	if (title.value) opts.push(`  title: "${title.value}",`);
	if (hasDescription.value && description.value) opts.push(`  description: "${description.value}",`);
	if (fill.value !== "#FFFFFF") opts.push(`  fill: "${fill.value}",`);
	if (duration.value !== 6000) opts.push(`  duration: ${duration.value},`);

	return `sileo.${type.value}({\n${opts.join("\n")}\n});`;
});

const highlightedCode = computed(() =>
	hljs.highlight(codeOutput.value, { language: "typescript" }).value
);

onMounted(() => {
	document.querySelectorAll(".docs .code-block").forEach((block) => {
		const langEl = block.querySelector(".code-lang");
		const codeEl = block.querySelector("pre code");
		if (!langEl || !codeEl) return;
		const lang = langEl.textContent?.trim() ?? "typescript";
		codeEl.classList.add(`language-${lang === "vue" ? "xml" : lang}`);
		hljs.highlightElement(codeEl as HTMLElement);
	});
});

/* ----------------------------- Actions ------------------------------------ */

function fireToast() {
	const opts: any = {};
	if (title.value) opts.title = title.value;
	if (hasDescription.value && description.value) opts.description = description.value;
	if (fill.value !== "#FFFFFF") opts.fill = fill.value;
	if (duration.value !== 6000) opts.duration = duration.value;
	opts.position = position.value;

	(sileo as any)[type.value](opts);
}

function copyCode() {
	navigator.clipboard.writeText(codeOutput.value);
	copied.value = true;
	setTimeout(() => (copied.value = false), 2000);
}

function copyInstall() {
	navigator.clipboard.writeText("npm install vue-sileo");
	installCopied.value = true;
	setTimeout(() => (installCopied.value = false), 2000);
}

/* ----------------------------- Examples ----------------------------------- */

function fireSuccess() {
	sileo.success({
		title: "Changes Saved",
		description: "Changes saved successfully to the database. Please refresh the page to see the changes.",
		position: position.value,
	});
}
function fireError() {
	sileo.error({
		title: "Something Went Wrong",
		description: "We're having trouble saving your changes to the server. Please try again in a few minutes.",
		position: position.value,
	});
}
function fireWarning() {
	sileo.warning({
		title: "Storage Almost Full",
		description: "You've used 95% of your available storage. Please upgrade your plan to continue.",
		position: position.value,
	});
}
function fireInfo() {
	sileo.info({
		title: "New Update Available",
		description: "Version 2.0 is now available. Please update your app to continue using the latest features.",
		position: position.value,
	});
}
function fireAction() {
	sileo.action({
		title: "File Uploaded",
		description: "Your file has been uploaded. Share it with your team?",
		button: { title: "Share Now", onClick: () => sileo.success({ title: "Link Copied", position: position.value }) },
		position: position.value,
	});
}
function createFlightToast() {
	return h("div", { style: "display:flex;flex-direction:column;gap:16px;margin-top:-4px" }, [
		// Header row: airline logo + flight number
		h("div", { style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:-16px" }, [
			h("img", {
				src: "https://united.mediaroom.com/images/white_logo.png",
				alt: "United Airlines",
				style: "height:28px;width:auto;margin-left:-4px;filter:invert(0)",
				width: 72,
				height: 30,
			}),
			h("div", { style: "font-size:14px;opacity:0.5;font-weight:500;letter-spacing:-0.02em;line-height:1" }, "UA13A"),
		]),
		// Route: DEL → SFO with flight path
		h("div", { style: "display:flex;align-items:center;justify-content:space-between" }, [
			h("span", { style: "font-size:24px;font-weight:500;margin-top:24px;color:var(--sileo-text);letter-spacing:-0.02em;line-height:1" }, "DEL"),
			h("div", { style: "flex:1;margin:0 12px;position:relative;display:flex;align-items:center;height:40px" }, [
				h("svg", {
					viewBox: "0 0 200 36",
					fill: "none",
					style: "position:absolute;inset:0;margin-top:-8px;width:100%;height:100%;overflow:visible",
				}, [
					h("path", {
						d: "M 10 34 Q 100 -20 190 34",
						stroke: "#22c55e",
						"stroke-width": "2",
						"stroke-dasharray": "6 4",
						"stroke-opacity": "0.5",
						fill: "none",
						"vector-effect": "non-scaling-stroke",
					}),
				]),
				// Departure dot
				h("div", { style: "position:absolute;left:0;bottom:0;width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.3);display:flex;align-items:center;justify-content:center;z-index:10" }, [
					h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "#22c55e", "stroke-width": "2.5", "stroke-linecap": "round" }, [
						h("path", { d: "M5 12h14M12 5l7 7-7 7", style: "transform:rotate(-40deg);transform-origin:center" }),
					]),
				]),
				// Arrival dot
				h("div", { style: "position:absolute;right:0;bottom:0;width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.3);display:flex;align-items:center;justify-content:center;z-index:10" }, [
					h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "#22c55e", "stroke-width": "2.5", "stroke-linecap": "round" }, [
						h("path", { d: "M5 12h14M12 5l7 7-7 7", style: "transform:rotate(40deg);transform-origin:center" }),
					]),
				]),
			]),
			h("span", { style: "font-size:24px;font-weight:500;margin-top:24px;color:var(--sileo-text);letter-spacing:-0.02em;line-height:1" }, "SFO"),
		]),
		// Footer: status + seat
		h("div", { style: "display:flex;align-items:center;justify-content:space-between" }, [
			h("div", { style: "display:flex;flex-direction:column" }, [
				h("span", { style: "color:#4ade80;font-size:14px;font-weight:600" }, "On Time"),
				h("p", { style: "color:var(--sileo-description);font-size:12px;margin:0" }, [
					"PNR ",
					h("span", { style: "color:var(--sileo-text)" }, "EC2QW4"),
				]),
			]),
			h("div", { style: "display:flex;align-items:center;gap:6px;background:#f59e0b;border-radius:12px;padding:5px 9px" }, [
				h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "#141B34" }, [
					h("path", { d: "M13.9674 17.7501H16.3235L15 20.2501H18C18.5523 20.2501 19 20.6978 19 21.2501C19 21.8023 18.5523 22.2501 18 22.2501H8C7.44772 22.2501 7 21.8023 7 21.2501C7 20.6978 7.44772 20.2501 8 20.2501H12.5L13.9674 17.7501Z" }),
					h("path", { d: "M12.5001 10.25H18.0001", stroke: "#141B34", "stroke-width": "2", "stroke-linecap": "round", fill: "none" }),
					h("path", { d: "M8.48169 17.75H17.9722C19.0921 17.75 20 16.8578 20 15.7571C20 14.25 17.9722 13.7641 17.9722 13.7641C17.9722 13.7641 14.2844 12.3465 10 13.75C10 13.75 9.86099 8.62277 7.70985 2.9207C7.28543 1.79569 5.90119 1.41158 4.88539 2.07713C4.21507 2.51633 3.8807 3.30969 4.0387 4.08608L6.49327 16.1479C6.68283 17.0795 7.51507 17.75 8.48169 17.75Z", opacity: "0.4" }),
				]),
				h("span", { style: "color:#000;font-size:14px;font-weight:700" }, "32K"),
			]),
		]),
	]);
}

function firePromise() {
	sileo.promise(
		new Promise<string>((resolve) => setTimeout(() => resolve("Booking confirmed"), 2500)),
		{
			loading: { title: "Booking Flight" },
			success: () => ({
				title: "Booking Confirmed",
				description: createFlightToast(),
				button: {
					title: "View Details",
					onClick: () => sileo.success({ title: "Details Viewed", position: position.value }),
				},
			}),
			error: () => ({ title: "Booking Failed", description: "Could not complete your booking." }),
			position: position.value,
		},
	);
}
function firePill() {
	sileo.success({ title: "Saved", position: position.value });
}

function toggleTheme() {
	isDark.value = !isDark.value;
	document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
}
</script>

<template>
	<Toaster :position="position" />

	<div class="page" :data-theme="isDark ? 'dark' : 'light'">
		<!-- Nav -->
		<nav class="nav">
			<span class="nav-brand">vue-sileo</span>
			<div class="nav-links">
				<a href="#examples">Examples</a>
				<a href="#builder">Builder</a>
				<a href="#docs">Docs</a>
				<a href="https://github.com/Syndrom7/vue-sileo" target="_blank" rel="noopener" class="nav-icon" title="GitHub">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
				</a>
				<a href="https://www.npmjs.com/package/vue-sileo" target="_blank" rel="noopener" class="nav-icon" title="npm">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>
				</a>
				<button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
					<svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="5"/>
						<line x1="12" y1="1" x2="12" y2="3"/>
						<line x1="12" y1="21" x2="12" y2="23"/>
						<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
						<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
						<line x1="1" y1="12" x2="3" y2="12"/>
						<line x1="21" y1="12" x2="23" y2="12"/>
						<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
						<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
					</svg>
					<svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
					</svg>
				</button>
			</div>
		</nav>

		<!-- Hero -->
		<header class="hero">
			<div class="hero-badge">v0.1.2</div>
			<h1 class="hero-title">vue-sileo</h1>
			<p class="hero-sub">Physics-based toast notifications for Vue 3.</p>
			<p class="hero-credit">
				A port of <a href="https://github.com/hiaaryan/sileo" target="_blank" rel="noopener">sileo</a> by <a href="https://github.com/hiaaryan" target="_blank" rel="noopener">@hiaaryan</a>
			</p>
			<button class="install-btn" @click="copyInstall">
				<span class="install-prefix">$</span> npm install vue-sileo
				<span class="install-copy">{{ installCopied ? "Copied!" : "⎘" }}</span>
			</button>
		</header>

		<!-- Examples + Builder -->
		<section class="playground">
			<div class="playground-grid">
				<!-- Examples -->
				<div id="examples" class="examples">
					<h2 class="section-title">Examples</h2>
					<p class="section-sub">Click to preview</p>

					<div class="example-pills">
						<button class="pill pill--success" @click="fireSuccess">Success</button>
						<button class="pill pill--error" @click="fireError">Error</button>
						<button class="pill pill--warning" @click="fireWarning">Warning</button>
						<button class="pill pill--info" @click="fireInfo">Info</button>
						<button class="pill pill--action" @click="fireAction">Action</button>
						<button class="pill pill--promise" @click="firePromise">Promise</button>
						<button class="pill" @click="firePill">Pill</button>
					</div>
				</div>

				<!-- Builder -->
				<div id="builder" class="builder">
					<h2 class="section-title">Builder</h2>
					<p class="section-sub">Configure and fire a live toast</p>

					<div class="builder-card">
						<div class="builder-field">
							<label class="builder-label">Position</label>
							<div class="builder-pills">
								<button
									v-for="p in positions" :key="p"
									class="pill pill-sm"
									:class="{ active: position === p }"
									@click="position = p"
								>{{ p }}</button>
							</div>
						</div>

						<div class="builder-field">
							<label class="builder-label">Type</label>
							<div class="builder-pills">
								<button
									v-for="t in types" :key="t"
									class="pill pill-sm"
									:class="{ active: type === t }"
									@click="type = t"
								>{{ t }}</button>
							</div>
						</div>

						<div class="builder-field">
							<label class="builder-label">Title</label>
							<input v-model="title" class="builder-input" placeholder="Toast title" />
						</div>

						<div class="builder-field">
							<label class="builder-label">
								Description
								<button class="toggle" :class="{ on: hasDescription }" @click="hasDescription = !hasDescription">
									<span class="toggle-dot" />
								</button>
							</label>
							<input v-if="hasDescription" v-model="description" class="builder-input" placeholder="Toast description" />
						</div>

						<div class="builder-row">
							<div class="builder-field builder-field-half">
								<label class="builder-label">Fill</label>
								<div class="color-input">
									<input type="color" v-model="fill" class="color-picker" />
									<input v-model="fill" class="builder-input builder-input-sm" />
								</div>
							</div>
							<div class="builder-field builder-field-half">
								<label class="builder-label">Duration ({{ duration }}ms)</label>
								<input type="range" v-model.number="duration" min="1000" max="15000" step="500" class="builder-range" />
							</div>
						</div>

						<button class="fire-btn" @click="fireToast">Fire Toast</button>
					</div>

					<!-- Code output -->
					<div class="code-block">
						<div class="code-header">
							<span class="code-lang">typescript</span>
							<button class="code-copy" @click="copyCode">{{ copied ? "Copied!" : "Copy" }}</button>
						</div>
						<pre class="code-pre"><code v-html="highlightedCode"></code></pre>
					</div>
				</div>
			</div>
		</section>

		<!-- Docs -->
		<section id="docs" class="docs">
			<h2 class="section-title">Documentation</h2>

			<!-- 01 Setup -->
			<div class="doc-item">
				<div class="doc-num">01</div>
				<div class="doc-content">
					<h3>Setup</h3>
					<p>Add the Toaster component to your app's root layout and import the styles. Call sileo from anywhere.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">vue</span></div>
						<pre class="code-pre"><code>&lt;script setup&gt;
import { Toaster, sileo } from "vue-sileo";
import "vue-sileo/styles.css";
&lt;/script&gt;

&lt;template&gt;
  &lt;Toaster position="top-right" /&gt;
  &lt;YourApp /&gt;
&lt;/template&gt;</code></pre>
					</div>
				</div>
			</div>

			<!-- 02 Toast Types -->
			<div class="doc-item">
				<div class="doc-num">02</div>
				<div class="doc-content">
					<h3>Fire a Toast</h3>
					<p>Six built-in states. Each method returns the toast ID as a string.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>sileo.success({ title: "Changes saved" });

sileo.error({
  title: "Something went wrong",
  description: "Please try again later.",
});

sileo.warning({ title: "Storage almost full" });

sileo.info({ title: "New update available" });</code></pre>
					</div>
				</div>
			</div>

			<!-- 03 Action -->
			<div class="doc-item">
				<div class="doc-num">03</div>
				<div class="doc-content">
					<h3>Action Toast</h3>
					<p>Toasts can include a button for user interaction.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>sileo.action({
  title: "File uploaded",
  description: "Share it with your team?",
  button: {
    title: "Share",
    onClick: () =&gt; console.log("Shared!"),
  },
});</code></pre>
					</div>
				</div>
			</div>

			<!-- 04 Promise -->
			<div class="doc-item">
				<div class="doc-num">04</div>
				<div class="doc-content">
					<h3>Promise Toast</h3>
					<p>Chain loading, success, and error states from a single promise. Returns the original promise so you can chain further.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>sileo.promise(fetchData(), {
  loading: { title: "Loading..." },
  success: { title: "Done!" },
  error: { title: "Failed" },
});

// With callbacks for dynamic content
sileo.promise(createUser(data), {
  loading: { title: "Creating account..." },
  success: (user) =&gt; ({
    title: `Welcome, ${user.name}!`,
  }),
  error: (err) =&gt; ({
    title: "Signup failed",
    description: err.message,
  }),
});</code></pre>
					</div>
				</div>
			</div>

			<!-- 05 API Reference -->
			<div class="doc-item">
				<div class="doc-num">05</div>
				<div class="doc-content">
					<h3>API Reference</h3>
					<p>The global toast controller. Import it anywhere to fire toasts.</p>

					<h4 class="doc-subtitle">Methods</h4>
					<div class="ref-table">
						<table>
							<thead><tr><th>Method</th><th>Description</th></tr></thead>
							<tbody>
								<tr><td><code>sileo.success(options)</code></td><td>Green success toast</td></tr>
								<tr><td><code>sileo.error(options)</code></td><td>Red error toast</td></tr>
								<tr><td><code>sileo.warning(options)</code></td><td>Amber warning toast</td></tr>
								<tr><td><code>sileo.info(options)</code></td><td>Blue info toast</td></tr>
								<tr><td><code>sileo.action(options)</code></td><td>Toast with an action button</td></tr>
								<tr><td><code>sileo.show(options)</code></td><td>Generic toast without a state badge</td></tr>
								<tr><td><code>sileo.promise(promise, opts)</code></td><td>Loading → success/error flow</td></tr>
								<tr><td><code>sileo.dismiss(id)</code></td><td>Dismiss a specific toast</td></tr>
								<tr><td><code>sileo.clear(position?)</code></td><td>Clear all toasts, optionally by position</td></tr>
							</tbody>
						</table>
					</div>

					<h4 class="doc-subtitle">ToastOptions</h4>
					<p>Passed to every <code>sileo.*()</code> method.</p>
					<div class="ref-table">
						<table>
							<thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
							<tbody>
								<tr><td><code>title</code></td><td><code>string</code></td><td>—</td><td>Toast heading</td></tr>
								<tr><td><code>description</code></td><td><code>VNode | string</code></td><td>—</td><td>Body content, supports Vue VNodes</td></tr>
								<tr><td><code>position</code></td><td><code>SileoPosition</code></td><td>Toaster default</td><td>Override position for this toast</td></tr>
								<tr><td><code>duration</code></td><td><code>number | null</code></td><td><code>6000</code></td><td>Auto-dismiss ms. null = sticky</td></tr>
								<tr><td><code>icon</code></td><td><code>VNode | null</code></td><td>State icon</td><td>Custom icon in the badge</td></tr>
								<tr><td><code>fill</code></td><td><code>string</code></td><td>—</td><td>Badge fill color</td></tr>
								<tr><td><code>styles</code></td><td><code>SileoStyles</code></td><td>—</td><td>Class overrides for sub-elements</td></tr>
								<tr><td><code>roundness</code></td><td><code>number</code></td><td><code>18</code></td><td>Border radius in pixels</td></tr>
								<tr><td><code>autopilot</code></td><td><code>boolean | object</code></td><td><code>true</code></td><td>Auto expand/collapse timing</td></tr>
								<tr><td><code>button</code></td><td><code>SileoButton</code></td><td>—</td><td>Action button config</td></tr>
							</tbody>
						</table>
					</div>

					<h4 class="doc-subtitle">SileoButton</h4>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>interface SileoButton {
  title: string;
  onClick: () =&gt; void;
}</code></pre>
					</div>

					<h4 class="doc-subtitle">SileoStyles</h4>
					<p>Override classes for individual toast sub-elements.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>interface SileoStyles {
  title?: string;
  description?: string;
  badge?: string;
  button?: string;
}</code></pre>
					</div>

					<h4 class="doc-subtitle">SileoPromiseOptions</h4>
					<p>Passed as the second argument to <code>sileo.promise()</code>. The success and error fields can be static options or callbacks.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>interface SileoPromiseOptions&lt;T = unknown&gt; {
  loading: Pick&lt;SileoOptions, "title" | "icon"&gt;;
  success: SileoOptions | ((data: T) =&gt; SileoOptions);
  error: SileoOptions | ((err: unknown) =&gt; SileoOptions);
  position?: SileoPosition;
}</code></pre>
					</div>
				</div>
			</div>

			<!-- 06 Toaster Props -->
			<div class="doc-item">
				<div class="doc-num">06</div>
				<div class="doc-content">
					<h3>Toaster Component</h3>
					<p>The viewport component that renders toasts. Add it once to your layout.</p>
					<div class="ref-table">
						<table>
							<thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
							<tbody>
								<tr><td><code>position</code></td><td><code>SileoPosition</code></td><td><code>"top-right"</code></td><td>Default position for all toasts</td></tr>
								<tr><td><code>offset</code></td><td><code>number | string | object</code></td><td><code>16</code></td><td>Distance from viewport edges</td></tr>
								<tr><td><code>options</code></td><td><code>Partial&lt;SileoOptions&gt;</code></td><td>—</td><td>Default options merged into every toast</td></tr>
							</tbody>
						</table>
					</div>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">vue</span></div>
						<pre class="code-pre"><code>&lt;Toaster
  position="top-right"
  :offset="{ top: 20, right: 16 }"
  :options="{
    fill: '#171717',
    roundness: 18,
  }"
/&gt;</code></pre>
					</div>
				</div>
			</div>

			<!-- 07 Styling -->
			<div class="doc-item">
				<div class="doc-num">07</div>
				<div class="doc-content">
					<h3>Styling &amp; Customization</h3>
					<p>Sileo is designed to look great out of the box. When you need to customize, there are a few escape hatches.</p>

					<h4 class="doc-subtitle">Fill Color</h4>
					<p>The <code>fill</code> prop controls the pill/body background color.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>sileo.success({
  title: "Saved",
  fill: "#171717",
});</code></pre>
					</div>

					<h4 class="doc-subtitle">Style Overrides</h4>
					<p>The <code>styles</code> prop lets you override classes on individual sub-elements.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>sileo.action({
  title: "New Sale",
  fill: "black",
  styles: {
    title: "custom-title-class",
    description: "custom-description-class",
    badge: "custom-badge-class",
    button: "custom-button-class",
  },
});</code></pre>
					</div>

					<h4 class="doc-subtitle">Available Style Keys</h4>
					<div class="ref-table">
						<table>
							<thead><tr><th>Key</th><th>Element</th></tr></thead>
							<tbody>
								<tr><td><code>title</code></td><td>The heading text</td></tr>
								<tr><td><code>description</code></td><td>The body/description area</td></tr>
								<tr><td><code>badge</code></td><td>The icon badge circle</td></tr>
								<tr><td><code>button</code></td><td>The action button</td></tr>
							</tbody>
						</table>
					</div>

					<h4 class="doc-subtitle">Custom Icons</h4>
					<p>Pass any Vue VNode as the <code>icon</code> prop to replace the default state icon. Set to <code>null</code> to hide the badge entirely.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>import { h } from "vue";

sileo.success({
  title: "Deployed",
  icon: h("svg", { ... }), // any Vue VNode
});</code></pre>
					</div>

					<h4 class="doc-subtitle">Roundness</h4>
					<p>Control the border radius with the <code>roundness</code> prop (default <code>18</code>).</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>sileo.success({
  title: "Sharp corners",
  roundness: 8,
});</code></pre>
					</div>

					<h4 class="doc-subtitle">Autopilot</h4>
					<p>By default, toasts auto-expand and collapse before dismissing. Control this with the <code>autopilot</code> prop.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>// Disable auto expand/collapse
sileo.success({
  title: "Manual only",
  description: "Hover to expand.",
  autopilot: false,
});

// Custom timing
sileo.success({
  title: "Custom timing",
  description: "Expand after 500ms, collapse after 3s.",
  autopilot: {
    expand: 500,
    collapse: 3000,
  },
});</code></pre>
					</div>

					<h4 class="doc-subtitle">Global Defaults</h4>
					<p>Use the Toaster's <code>options</code> prop to set defaults for every toast.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">vue</span></div>
						<pre class="code-pre"><code>&lt;Toaster
  position="top-right"
  :options="{
    fill: '#171717',
    roundness: 18,
  }"
/&gt;</code></pre>
					</div>
				</div>
			</div>

			<!-- 08 Positions -->
			<div class="doc-item">
				<div class="doc-num">08</div>
				<div class="doc-content">
					<h3>Positions</h3>
					<p>Sileo supports six positions. Set it on the Toaster as a default, or override per-toast.</p>
					<div class="code-block">
						<div class="code-header"><span class="code-lang">typescript</span></div>
						<pre class="code-pre"><code>type SileoPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";</code></pre>
					</div>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer class="footer">
			<p>
				Vue 3 port of <a href="https://github.com/hiaaryan/sileo" target="_blank" rel="noopener">sileo</a> by <a href="https://github.com/hiaaryan" target="_blank" rel="noopener">@hiaaryan</a>.
				Ported by <a href="https://github.com/Syndrom7" target="_blank" rel="noopener">@Syndrom7</a>.
			</p>
		</footer>
	</div>
</template>

<style>
/* -------------------------------- Reset ----------------------------------- */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; overflow-x: hidden; }

:root {
	--bg: #0a0a0a;
	--bg-elevated: #111;
	--bg-nav: rgba(10, 10, 10, 0.8);
	--border: #1e1e1e;
	--border-subtle: #1a1a1a;
	--border-input: #262626;
	--border-hover: #444;
	--text: #e5e5e5;
	--text-muted: #888;
	--text-subtle: #555;
	--text-dim: #444;
	--text-dark: #333;
	--accent: #6ee7b7;
	--accent-bg: rgba(110, 231, 183, 0.1);
	--accent-border: rgba(110, 231, 183, 0.2);

	/* syntax highlight tokens — VS Code Dark+ */
	--hl-keyword:  #569cd6;
	--hl-string:   #ce9178;
	--hl-number:   #b5cea8;
	--hl-comment:  #6a9955;
	--hl-type:     #4ec9b0;
	--hl-function: #dcdcaa;
	--hl-variable: #9cdcfe;
}

[data-theme="light"] {
	--bg: #ffffff;
	--bg-elevated: #f9f9f9;
	--bg-nav: rgba(255, 255, 255, 0.8);
	--border: #e5e5e5;
	--border-subtle: #f0f0f0;
	--border-input: #d4d4d4;
	--border-hover: #a3a3a3;
	--text: #171717;
	--text-muted: #525252;
	--text-subtle: #a3a3a3;
	--text-dim: #d4d4d4;
	--text-dark: #e5e5e5;
	--accent: #059669;
	--accent-bg: rgba(5, 150, 105, 0.1);
	--accent-border: rgba(5, 150, 105, 0.2);

	/* syntax highlight tokens — VS Code Light+ */
	--hl-keyword:  #0000ff;
	--hl-string:   #a31515;
	--hl-number:   #098658;
	--hl-comment:  #008000;
	--hl-type:     #267f99;
	--hl-function: #795e26;
	--hl-variable: #001080;
}

body {
	font-family: "Inter", system-ui, -apple-system, sans-serif;
	background: var(--bg);
	color: var(--text);
	min-height: 100vh;
	-webkit-font-smoothing: antialiased;
	transition: background-color 200ms, color 200ms;
	overflow-x: hidden;
}

a { color: var(--text-muted); text-decoration: none; transition: color 150ms; }
a:hover { color: var(--text); }

/* --------------------------------- Nav ------------------------------------ */
.nav {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 2rem;
	height: 56px;
	background: var(--bg-nav);
	backdrop-filter: blur(12px);
	border-bottom: 1px solid var(--border-subtle);
	transition: background-color 200ms, border-color 200ms;
}


.nav-brand {
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--text);
	letter-spacing: -0.02em;
}

.nav-links {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	font-size: 0.825rem;
	color: var(--text-muted);
}

.nav-links a:hover { color: var(--text); }

.nav-icon {
	display: flex;
	align-items: center;
	color: var(--text-subtle);
}

.nav-icon:hover { color: var(--text); }

.theme-toggle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border: 1px solid var(--border-input);
	border-radius: 6px;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
	transition: all 150ms;
	padding: 0;
}

.theme-toggle:hover {
	color: var(--text);
	border-color: var(--border-hover);
}

/* --------------------------------- Hero ----------------------------------- */
.hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	padding: 8rem 1.5rem 3.5rem;
}

.hero-badge {
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--accent);
	background: var(--accent-bg);
	border: 1px solid var(--accent-border);
	padding: 0.2rem 0.6rem;
	border-radius: 999px;
	margin-bottom: 1.25rem;
}

.hero-title {
	font-size: 3.5rem;
	font-weight: 700;
	color: var(--text);
	letter-spacing: -0.03em;
	line-height: 1;
	margin-bottom: 0.75rem;
}

.hero-sub {
	font-size: 1.1rem;
	color: var(--text-muted);
	margin-bottom: 0.5rem;
}

.hero-credit {
	font-size: 0.8rem;
	color: var(--text-subtle);
	margin-bottom: 2rem;
}

.hero-credit a { color: var(--text-muted); text-decoration: underline; text-underline-offset: 2px; }
.hero-credit a:hover { color: var(--text); }

.install-btn {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.6rem 1rem;
	background: var(--bg-elevated);
	border: 1px solid var(--border-input);
	border-radius: 8px;
	color: var(--text);
	font-family: "JetBrains Mono", monospace;
	font-size: 0.825rem;
	cursor: pointer;
	transition: all 150ms;
}

.install-btn:hover { border-color: var(--border-hover); background: var(--bg); }

.install-prefix { color: var(--text-subtle); }
.install-copy { color: var(--text-subtle); font-size: 0.75rem; margin-left: 0.5rem; }

/* --------------------------------- Page ----------------------------------- */
.page {
	max-width: 1100px;
	margin: 0 auto;
}

/* ----------------------------- Sections ----------------------------------- */
.section-title {
	font-size: 1.15rem;
	font-weight: 600;
	color: var(--text);
	letter-spacing: -0.02em;
	margin-bottom: 0.25rem;
}

.section-sub {
	font-size: 0.825rem;
	color: var(--text-subtle);
	margin-bottom: 1.5rem;
}

/* ----------------------------- Playground --------------------------------- */
.playground {
	padding: 1.5rem;
}

.playground-grid {
	display: grid;
	grid-template-columns: 1fr 1.4fr;
	gap: 3rem;
}

/* ------------------------------- Examples --------------------------------- */
.examples { padding-top: 0.5rem; min-width: 0; }
.builder { min-width: 0; }

.example-pills {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
}

/* -------------------------------- Pills ----------------------------------- */
.pill {
	padding: 0.45rem 0.9rem;
	border: 1px solid var(--border-input);
	border-radius: 999px;
	background: var(--bg-elevated);
	color: var(--text);
	font-size: 0.8rem;
	font-family: inherit;
	cursor: pointer;
	transition: all 150ms;
	white-space: nowrap;
}

.pill:hover { border-color: var(--border-hover); color: var(--text); background: var(--bg); }

.pill.active {
	background: var(--text);
	color: var(--bg);
	border-color: var(--text);
}

.pill-sm {
	padding: 0.3rem 0.65rem;
	font-size: 0.725rem;
}

/* -------------------------- Pill color variants --------------------------- */
.pill--success { color: #4ade80; border-color: rgba(74, 222, 128, 0.3); background: rgba(74, 222, 128, 0.07); }
.pill--success:hover { background: rgba(74, 222, 128, 0.14); border-color: rgba(74, 222, 128, 0.55); }
.pill--error { color: #f87171; border-color: rgba(248, 113, 113, 0.3); background: rgba(248, 113, 113, 0.07); }
.pill--error:hover { background: rgba(248, 113, 113, 0.14); border-color: rgba(248, 113, 113, 0.55); }
.pill--warning { color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.07); }
.pill--warning:hover { background: rgba(251, 191, 36, 0.14); border-color: rgba(251, 191, 36, 0.55); }
.pill--info { color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); background: rgba(96, 165, 250, 0.07); }
.pill--info:hover { background: rgba(96, 165, 250, 0.14); border-color: rgba(96, 165, 250, 0.55); }
.pill--action { color: #c084fc; border-color: rgba(192, 132, 252, 0.3); background: rgba(192, 132, 252, 0.07); }
.pill--action:hover { background: rgba(192, 132, 252, 0.14); border-color: rgba(192, 132, 252, 0.55); }
.pill--promise { color: #818cf8; border-color: rgba(129, 140, 248, 0.3); background: rgba(129, 140, 248, 0.07); }
.pill--promise:hover { background: rgba(129, 140, 248, 0.14); border-color: rgba(129, 140, 248, 0.55); }

[data-theme="light"] .pill--success { color: #16a34a; border-color: rgba(22, 163, 74, 0.35); background: rgba(22, 163, 74, 0.07); }
[data-theme="light"] .pill--success:hover { background: rgba(22, 163, 74, 0.14); border-color: rgba(22, 163, 74, 0.55); }
[data-theme="light"] .pill--error { color: #dc2626; border-color: rgba(220, 38, 38, 0.35); background: rgba(220, 38, 38, 0.07); }
[data-theme="light"] .pill--error:hover { background: rgba(220, 38, 38, 0.14); border-color: rgba(220, 38, 38, 0.55); }
[data-theme="light"] .pill--warning { color: #d97706; border-color: rgba(217, 119, 6, 0.35); background: rgba(217, 119, 6, 0.07); }
[data-theme="light"] .pill--warning:hover { background: rgba(217, 119, 6, 0.14); border-color: rgba(217, 119, 6, 0.55); }
[data-theme="light"] .pill--info { color: #2563eb; border-color: rgba(37, 99, 235, 0.35); background: rgba(37, 99, 235, 0.07); }
[data-theme="light"] .pill--info:hover { background: rgba(37, 99, 235, 0.14); border-color: rgba(37, 99, 235, 0.55); }
[data-theme="light"] .pill--action { color: #9333ea; border-color: rgba(147, 51, 234, 0.35); background: rgba(147, 51, 234, 0.07); }
[data-theme="light"] .pill--action:hover { background: rgba(147, 51, 234, 0.14); border-color: rgba(147, 51, 234, 0.55); }
[data-theme="light"] .pill--promise { color: #4f46e5; border-color: rgba(79, 70, 229, 0.35); background: rgba(79, 70, 229, 0.07); }
[data-theme="light"] .pill--promise:hover { background: rgba(79, 70, 229, 0.14); border-color: rgba(79, 70, 229, 0.55); }

/* ------------------------------- Builder ---------------------------------- */
.builder-card {
	background: transparent;
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.builder-field { display: flex; flex-direction: column; gap: 0.4rem; }

.builder-label {
	font-size: 0.725rem;
	font-weight: 500;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 0.04em;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.builder-pills { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.builder-input {
	width: 100%;
	padding: 0.5rem 0.75rem;
	background: var(--bg);
	border: 1px solid var(--border-input);
	border-radius: 8px;
	color: var(--text);
	font-size: 0.825rem;
	font-family: inherit;
	outline: none;
	transition: border-color 150ms;
}

.builder-input:focus { border-color: var(--border-hover); }
.builder-input-sm { flex: 1; }

.builder-row {
	display: flex;
	gap: 1rem;
}

.builder-field-half { flex: 1; }

.color-input {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.color-picker {
	width: 32px;
	height: 32px;
	padding: 0;
	border: 1px solid var(--border-input);
	border-radius: 6px;
	cursor: pointer;
	background: none;
}

.color-picker::-webkit-color-swatch-wrapper { padding: 2px; }
.color-picker::-webkit-color-swatch { border-radius: 4px; border: none; }

.builder-range {
	width: 100%;
	accent-color: var(--text);
	cursor: pointer;
}

/* -------------------------------- Toggle ---------------------------------- */
.toggle {
	width: 28px;
	height: 16px;
	border-radius: 999px;
	border: 1px solid var(--border-dark);
	background: var(--bg);
	cursor: pointer;
	position: relative;
	transition: all 150ms;
	padding: 0;
}

.toggle.on { background: var(--text); border-color: var(--text); }

.toggle-dot {
	display: block;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: var(--text-subtle);
	position: absolute;
	top: 2px;
	left: 2px;
	transition: all 150ms;
}

.toggle.on .toggle-dot { left: 14px; background: var(--bg); }

/* -------------------------------- Fire Btn -------------------------------- */
.fire-btn {
	width: 100%;
	padding: 0.6rem;
	border: none;
	border-radius: 8px;
	background: var(--text);
	color: var(--bg);
	font-size: 0.825rem;
	font-weight: 600;
	font-family: inherit;
	cursor: pointer;
	transition: all 150ms;
}

.fire-btn:hover { opacity: 0.9; }
.fire-btn:active { transform: scale(0.98); }

/* ------------------------------ Code Block -------------------------------- */
.code-block {
	background: var(--bg-elevated);
	border: 1px solid var(--border);
	border-radius: 10px;
	overflow: hidden;
	margin-top: 1rem;
}

.code-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--border);
}

.code-lang {
	font-size: 0.7rem;
	color: var(--text-subtle);
	font-family: "JetBrains Mono", monospace;
}

.code-copy {
	padding: 0.2rem 0.5rem;
	border: 1px solid var(--border-input);
	border-radius: 6px;
	background: transparent;
	color: var(--text-muted);
	font-size: 0.7rem;
	font-family: inherit;
	cursor: pointer;
	transition: all 150ms;
}

.code-copy:hover { color: var(--text); border-color: var(--border-hover); }

.code-pre {
	padding: 1rem;
	margin: 0;
	overflow-x: auto;
	font-family: "JetBrains Mono", monospace;
	font-size: 0.78rem;
	line-height: 1.6;
	color: var(--text-muted);
	tab-size: 2;
}

/* --------------------------------- Docs ----------------------------------- */
.docs {
	padding: 3rem 1.5rem;
	border-top: 1px solid var(--border-subtle);
}

.docs .section-title { margin-bottom: 1.5rem; }

.doc-item {
	display: flex;
	gap: 2rem;
	margin-bottom: 3rem;
}

.doc-num {
	font-size: 0.8rem;
	font-weight: 500;
	color: var(--border-hover);
	font-family: "JetBrains Mono", monospace;
	flex-shrink: 0;
	padding-top: 0.15rem;
}

.doc-content { flex: 1; min-width: 0; }
.doc-content h3 { font-size: 1rem; font-weight: 600; color: var(--text); margin-bottom: 0.35rem; }
.doc-content p { font-size: 0.85rem; color: var(--text-subtle); margin-bottom: 0.75rem; line-height: 1.5; }
.doc-content code { font-family: "JetBrains Mono", monospace; font-size: 0.78rem; background: var(--bg-elevated); border: 1px solid var(--border); padding: 0.1rem 0.35rem; border-radius: 4px; color: var(--text-muted); }

.doc-subtitle {
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--text);
	margin-top: 1.5rem;
	margin-bottom: 0.5rem;
}

/* ------------ Syntax highlighting — VS Code Dark+ / Light+ ---------------- */
.hljs-keyword, .hljs-operator, .hljs-meta, .hljs-literal { color: var(--hl-keyword); }
.hljs-string, .hljs-template-string { color: var(--hl-string); }
.hljs-number { color: var(--hl-number); }
.hljs-comment { color: var(--hl-comment); font-style: italic; }
.hljs-built_in, .hljs-title.class_ { color: var(--hl-type); }
.hljs-title, .hljs-title.function_ { color: var(--hl-function); }
.hljs-variable, .hljs-params, .hljs-attr, .hljs-property, .hljs-subst { color: var(--hl-variable); }
.hljs-tag { color: var(--hl-keyword); }
.hljs-name { color: var(--hl-type); }

/* ----------------------------- Ref Tables --------------------------------- */
.ref-table {
	overflow-x: auto;
	margin-bottom: 0.75rem;
}

.ref-table table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.8rem;
}

.ref-table th {
	text-align: left;
	font-weight: 500;
	color: var(--text-muted);
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--border);
	font-size: 0.725rem;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.ref-table td {
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--border-subtle);
	color: var(--text-subtle);
	vertical-align: top;
}

.ref-table td code {
	font-family: "JetBrains Mono", monospace;
	font-size: 0.75rem;
	background: var(--bg-elevated);
	border: 1px solid var(--border);
	padding: 0.1rem 0.35rem;
	border-radius: 4px;
	color: var(--text-muted);
	white-space: nowrap;
}

/* -------------------------------- Footer ---------------------------------- */
.footer {
	padding: 2rem;
	border-top: 1px solid var(--border-subtle);
	text-align: center;
}

.footer p {
	font-size: 0.8rem;
	color: var(--text-dim);
}

.footer a { color: var(--text-subtle); text-decoration: underline; text-underline-offset: 2px; }
.footer a:hover { color: var(--text-muted); }

/* ------------------------------- Responsive ------------------------------- */
@media (max-width: 768px) {
	.playground-grid {
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	.nav { padding: 0 1.25rem; }
	.nav-links { gap: 0.75rem; }
	.nav-links a:not(.nav-icon) { display: none; }

	.hero-title { font-size: 2.5rem; }
	.doc-item { flex-direction: column; gap: 0.35rem; }
	.builder-row { flex-direction: column; }
}

@media (max-width: 640px) {
	.nav { padding: 0 1rem; }

	.hero { padding: 5rem 1.25rem 2.5rem; }
	.hero-title { font-size: 2rem; }
	.hero-sub { font-size: 0.95rem; }

	.playground { padding: 1.25rem; }
	.docs { padding: 2rem 1.25rem; }
	.footer { padding: 1.5rem 1.25rem; }
}

@media (max-width: 480px) {
	.install-btn { font-size: 0.75rem; gap: 0.5rem; padding: 0.5rem 0.75rem; }
	.pill { font-size: 0.75rem; }
	.builder-card { padding: 1rem; }
	.nav-links { gap: 0.5rem; }
}
</style>
