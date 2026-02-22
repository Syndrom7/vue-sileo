<script setup lang="ts">
import {
	ref,
	computed,
	watch,
	onMounted,
	onUnmounted,
	nextTick,
	type VNode,
	type CSSProperties,
	h,
} from "vue";
import { motion } from "motion-v";
import type { SileoButton, SileoState, SileoStyles } from "./types";
import {
	ArrowRight,
	Check,
	CircleAlert,
	LifeBuoy,
	LoaderCircle,
	XIcon,
} from "./icons";
import type { View } from "./store";

/* --------------------------------- Config --------------------------------- */

const HEIGHT = 40;
const WIDTH = 350;
const DEFAULT_ROUNDNESS = 16;
const BLUR_RATIO = 0.5;
const PILL_PADDING = 10;
const MIN_EXPAND_RATIO = 2.25;
const SWAP_COLLAPSE_MS = 200;
const HEADER_EXIT_MS = 420; // calc(600ms * 0.7)

const SPRING = {
	type: "spring" as const,
	bounce: 0.25,
	duration: 0.6,
};

/* ---------------------------------- Icons --------------------------------- */

const STATE_ICON: Record<SileoState, VNode> = {
	success: h(Check),
	loading: h(LoaderCircle),
	error: h(XIcon),
	warning: h(CircleAlert),
	info: h(LifeBuoy),
	action: h(ArrowRight),
};

/* ---------------------------------- Props --------------------------------- */

const props = withDefaults(
	defineProps<{
		id: string;
		fill?: string;
		state?: SileoState;
		title?: string;
		description?: VNode | string;
		position?: "left" | "center" | "right";
		expand?: "top" | "bottom";
		icon?: VNode | null;
		styles?: SileoStyles;
		button?: SileoButton;
		roundness?: number;
		exiting?: boolean;
		autoExpandDelayMs?: number;
		autoCollapseDelayMs?: number;
		canExpand?: boolean;
		interruptKey?: string;
		refreshKey?: string;
	}>(),
	{
		fill: "var(--sileo-fill)",
		state: "success",
		position: "left",
		expand: "bottom",
		exiting: false,
	},
);

const emit = defineEmits<{
	mouseenter: [e: MouseEvent];
	mouseleave: [e: MouseEvent];
	dismiss: [];
}>();

/* ---------------------------------- State --------------------------------- */

const resolvedTitle = computed(() => props.title ?? props.state);

const view = ref<View>({
	title: resolvedTitle.value,
	description: props.description,
	state: props.state,
	icon: props.icon,
	styles: props.styles,
	button: props.button,
	fill: props.fill,
});

const applied = ref(props.refreshKey);
const isExpanded = ref(false);
const ready = ref(false);
const pillWidth = ref(0);
const contentHeight = ref(0);

const hasDesc = computed(() => Boolean(view.value.description) || Boolean(view.value.button));
const isLoading = computed(() => view.value.state === "loading");
const open = computed(() => hasDesc.value && isExpanded.value && !isLoading.value);
const allowExpand = computed(() => {
	if (isLoading.value) return false;
	return props.canExpand ?? (!props.interruptKey || props.interruptKey === props.id);
});

const headerKey = computed(() => `${view.value.state}-${view.value.title}`);
const filterId = computed(() => `sileo-gooey-${props.id}`);
const resolvedRoundness = computed(() => Math.max(0, props.roundness ?? DEFAULT_ROUNDNESS));
const blur = computed(() => resolvedRoundness.value * BLUR_RATIO);

/* ------------------------------ Template Refs ----------------------------- */

const buttonRef = ref<HTMLButtonElement | null>(null);
const headerRef = ref<HTMLDivElement | null>(null);
const innerRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);

/* ----------------------------- Pending / Timers --------------------------- */

let headerExitTimer: number | null = null;
let autoExpandTimer: number | null = null;
let autoCollapseTimer: number | null = null;
let swapTimer: number | null = null;
let headerPadCache: number | null = null;
let lastRefreshKey = props.refreshKey;
let pending: { key?: string; payload: View } | null = null;

/* ----------------------------- Header Layers ------------------------------ */

const headerLayer = ref<{
	current: { key: string; view: View };
	prev: { key: string; view: View } | null;
}>({
	current: { key: headerKey.value, view: view.value },
	prev: null,
});

/* ---------------------------------- Next ---------------------------------- */

const next = computed<View>(() => ({
	title: resolvedTitle.value,
	description: props.description,
	state: props.state,
	icon: props.icon,
	styles: props.styles,
	button: props.button,
	fill: props.fill,
}));

/* ------------------------------ Derived values ---------------------------- */

const minExpanded = HEIGHT * MIN_EXPAND_RATIO;

const rawExpanded = computed(() =>
	hasDesc.value ? Math.max(minExpanded, HEIGHT + contentHeight.value) : minExpanded,
);

let frozenExpanded = rawExpanded.value;

const expanded = computed(() => {
	if (open.value) {
		frozenExpanded = rawExpanded.value;
		return rawExpanded.value;
	}
	return frozenExpanded;
});

const svgHeight = computed(() =>
	hasDesc.value ? Math.max(expanded.value, minExpanded) : HEIGHT,
);
const expandedContent = computed(() => Math.max(0, expanded.value - HEIGHT));
const resolvedPillWidth = computed(() => Math.max(pillWidth.value || HEIGHT, HEIGHT));
const pillHeight = computed(() => HEIGHT + blur.value * 3);

const pillX = computed(() =>
	props.position === "right"
		? WIDTH - resolvedPillWidth.value
		: props.position === "center"
			? (WIDTH - resolvedPillWidth.value) / 2
			: 0,
);

/* ------------------------------- Inline styles ---------------------------- */

const rootStyle = computed<CSSProperties & Record<string, string>>(() => ({
	"--_h": `${open.value ? expanded.value : HEIGHT}px`,
	"--_pw": `${resolvedPillWidth.value}px`,
	"--_px": `${pillX.value}px`,
	"--_ht": `translateY(${open.value ? (props.expand === "bottom" ? 3 : -3) : 0}px) scale(${open.value ? 0.9 : 1})`,
	"--_co": `${open.value ? 1 : 0}`,
}));

const canvasStyle = computed<CSSProperties>(() => ({
	filter: `url(#${filterId.value})`,
}));

/* ------------------------------- Motion animate targets ------------------- */

const pillAnimate = computed(() => ({
	x: pillX.value,
	width: resolvedPillWidth.value,
	height: open.value ? pillHeight.value : HEIGHT,
}));

const bodyAnimate = computed(() => ({
	height: open.value ? expandedContent.value : 0,
	opacity: open.value ? 1 : 0,
}));

const bodyTransition = computed(() =>
	open.value ? SPRING : { ...SPRING, bounce: 0 },
);

const pillTransition = computed(() =>
	ready.value ? SPRING : { duration: 0 },
);

/* ------------------------------ Measurements ------------------------------ */

let pillRo: ResizeObserver | null = null;
let pillRafId = 0;
let pillObserved: Element | null = null;
let contentRo: ResizeObserver | null = null;
let contentRafId = 0;

function measurePill() {
	const el = innerRef.value;
	const header = headerRef.value;
	if (!el || !header) return;

	if (headerPadCache === null) {
		const cs = getComputedStyle(header);
		headerPadCache = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
	}

	const w = el.scrollWidth + headerPadCache + PILL_PADDING;
	if (w > PILL_PADDING && pillWidth.value !== w) {
		pillWidth.value = w;
	}
}

function setupPillObserver() {
	const el = innerRef.value;
	if (!el) return;
	measurePill();
	if (!pillRo) {
		pillRo = new ResizeObserver(() => {
			cancelAnimationFrame(pillRafId);
			pillRafId = requestAnimationFrame(measurePill);
		});
	}
	if (pillObserved !== el) {
		if (pillObserved) pillRo.unobserve(pillObserved);
		pillRo.observe(el);
		pillObserved = el;
	}
}

function cancelPillRaf() {
	cancelAnimationFrame(pillRafId);
}

function measureContent() {
	if (!hasDesc.value) {
		contentHeight.value = 0;
		return;
	}
	const el = contentRef.value;
	if (!el) return;
	const h = el.scrollHeight;
	if (contentHeight.value !== h) {
		contentHeight.value = h;
	}
}

function setupContentObserver() {
	cleanupContentObserver();
	const el = contentRef.value;
	if (!el) return;
	measureContent();
	contentRo = new ResizeObserver(() => {
		cancelAnimationFrame(contentRafId);
		contentRafId = requestAnimationFrame(measureContent);
	});
	contentRo.observe(el);
}

function cleanupContentObserver() {
	if (contentRo) {
		cancelAnimationFrame(contentRafId);
		contentRo.disconnect();
		contentRo = null;
	}
}

/* ----------------------------- Header layers ------------------------------ */

watch(
	[headerKey, view],
	() => {
		const hk = headerKey.value;
		const v = view.value;
		if (headerLayer.value.current.key === hk) {
			if (headerLayer.value.current.view !== v) {
				headerLayer.value = {
					...headerLayer.value,
					current: { key: hk, view: v },
				};
			}
		} else {
			headerLayer.value = {
				prev: headerLayer.value.current,
				current: { key: hk, view: v },
			};
		}
	},
	{ flush: "sync" },
);

// Re-measure pill when header key changes
watch(
	() => headerLayer.value.current.key,
	() => {
		nextTick(setupPillObserver);
	},
);

// Header exit timer
watch(
	() => headerLayer.value.prev,
	(prev) => {
		if (!prev) return;
		if (headerExitTimer) clearTimeout(headerExitTimer);
		headerExitTimer = window.setTimeout(() => {
			headerExitTimer = null;
			headerLayer.value = { ...headerLayer.value, prev: null };
		}, HEADER_EXIT_MS);
	},
);

/* ----------------------------- Content observer --------------------------- */

watch(hasDesc, (val) => {
	if (val) {
		nextTick(setupContentObserver);
	} else {
		contentHeight.value = 0;
		cleanupContentObserver();
	}
});

/* ----------------------------- Refresh logic ------------------------------ */

watch(
	[() => props.refreshKey, next],
	() => {
		const refreshKey = props.refreshKey;
		const nextVal = next.value;

		if (refreshKey === undefined) {
			view.value = nextVal;
			applied.value = undefined;
			pending = null;
			lastRefreshKey = refreshKey;
			return;
		}

		if (lastRefreshKey === refreshKey) return;
		lastRefreshKey = refreshKey;

		if (swapTimer) {
			clearTimeout(swapTimer);
			swapTimer = null;
		}

		if (open.value) {
			pending = { key: refreshKey, payload: nextVal };
			isExpanded.value = false;
			swapTimer = window.setTimeout(() => {
				swapTimer = null;
				if (!pending) return;
				view.value = pending.payload;
				applied.value = pending.key;
				pending = null;
			}, SWAP_COLLAPSE_MS);
		} else {
			pending = null;
			view.value = nextVal;
			applied.value = refreshKey;
		}
	},
	{ deep: false },
);

/* ----------------------------- Auto expand/collapse ----------------------- */

watch(
	[
		() => props.autoCollapseDelayMs,
		() => props.autoExpandDelayMs,
		hasDesc,
		allowExpand,
		() => props.exiting,
		applied,
	],
	() => {
		if (!hasDesc.value) return;

		if (autoExpandTimer) clearTimeout(autoExpandTimer);
		if (autoCollapseTimer) clearTimeout(autoCollapseTimer);

		if (props.exiting || !allowExpand.value) {
			isExpanded.value = false;
			return;
		}

		if (props.autoExpandDelayMs == null && props.autoCollapseDelayMs == null)
			return;

		const expandDelay = props.autoExpandDelayMs ?? 0;
		const collapseDelay = props.autoCollapseDelayMs ?? 0;

		if (expandDelay > 0) {
			autoExpandTimer = window.setTimeout(
				() => (isExpanded.value = true),
				expandDelay,
			);
		} else {
			isExpanded.value = true;
		}

		if (collapseDelay > 0) {
			autoCollapseTimer = window.setTimeout(
				() => (isExpanded.value = false),
				collapseDelay,
			);
		}
	},
	{ immediate: true },
);

/* Update frozenExpanded when open changes */
watch(open, (val) => {
	if (val) {
		frozenExpanded = rawExpanded.value;
	}
});

/* -------------------------------- Handlers -------------------------------- */

function handleEnter(e: MouseEvent) {
	emit("mouseenter", e);
	if (hasDesc.value) isExpanded.value = true;
}

function handleLeave(e: MouseEvent) {
	emit("mouseleave", e);
	isExpanded.value = false;
}

function handleTransitionEnd(e: TransitionEvent) {
	if (e.propertyName !== "height" && e.propertyName !== "transform") return;
	if (open.value) return;
	if (!pending) return;
	if (swapTimer) {
		clearTimeout(swapTimer);
		swapTimer = null;
	}
	view.value = pending.payload;
	applied.value = pending.key;
	pending = null;
}

/* -------------------------------- Swipe ----------------------------------- */

const SWIPE_DISMISS = 30;
const SWIPE_MAX = 20;
let pointerStart: number | null = null;

const swipeHandlers = {
	onMove: (e: PointerEvent) => {
		const el = buttonRef.value;
		if (pointerStart === null || !el) return;
		const dy = e.clientY - pointerStart;
		const sign = dy > 0 ? 1 : -1;
		const clamped = Math.min(Math.abs(dy), SWIPE_MAX) * sign;
		el.style.transform = `translateY(${clamped}px)`;
	},
	onUp: (e: PointerEvent) => {
		const el = buttonRef.value;
		if (pointerStart === null || !el) return;
		const dy = e.clientY - pointerStart;
		pointerStart = null;
		el.style.transform = "";
		el.removeEventListener("pointermove", swipeHandlers.onMove);
		el.removeEventListener("pointerup", swipeHandlers.onUp);
		if (Math.abs(dy) > SWIPE_DISMISS) {
			emit("dismiss");
		}
	},
};

function handlePointerDown(e: PointerEvent) {
	if (props.exiting) return;
	const target = e.target as HTMLElement;
	if (target.closest("[data-sileo-button]")) return;
	pointerStart = e.clientY;
	const el = e.currentTarget as HTMLElement;
	el.setPointerCapture(e.pointerId);
	el.addEventListener("pointermove", swipeHandlers.onMove, { passive: true });
	el.addEventListener("pointerup", swipeHandlers.onUp, { passive: true });
}

/* -------------------------------- Lifecycle -------------------------------- */

onMounted(() => {
	requestAnimationFrame(() => (ready.value = true));

	nextTick(() => {
		setupPillObserver();
		if (hasDesc.value) setupContentObserver();
	});
});

onUnmounted(() => {
	cancelPillRaf();
	pillRo?.disconnect();
	cleanupContentObserver();

	if (headerExitTimer) clearTimeout(headerExitTimer);
	if (autoExpandTimer) clearTimeout(autoExpandTimer);
	if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
	if (swapTimer) clearTimeout(swapTimer);
});

/* ----------------------------- Icon rendering ----------------------------- */

function getIcon(v: View): VNode | null {
	if (v.icon !== undefined) return v.icon as VNode | null;
	return STATE_ICON[v.state] ?? null;
}

function handleButtonClick(e: MouseEvent) {
	e.preventDefault();
	e.stopPropagation();
	view.value.button?.onClick();
}
</script>

<template>
	<button
		ref="buttonRef"
		type="button"
		data-sileo-toast
		:data-ready="ready"
		:data-expanded="open"
		:data-exiting="props.exiting"
		:data-edge="props.expand"
		:data-position="props.position"
		:data-state="view.state"
		:style="rootStyle"
		@mouseenter="handleEnter"
		@mouseleave="handleLeave"
		@transitionend="handleTransitionEnd"
		@pointerdown="handlePointerDown"
	>
		<!-- SVG Canvas -->
		<div data-sileo-canvas :data-edge="props.expand" :style="canvasStyle">
			<svg
				data-sileo-svg
				:width="WIDTH"
				:height="svgHeight"
				:viewBox="`0 0 ${WIDTH} ${svgHeight}`"
			>
				<title>Sileo Notification</title>
				<defs>
					<filter
						:id="filterId"
						x="-20%"
						y="-20%"
						width="140%"
						height="140%"
						colorInterpolationFilters="sRGB"
					>
						<feGaussianBlur in="SourceGraphic" :stdDeviation="blur" result="blur" />
						<feColorMatrix
							in="blur"
							mode="matrix"
							values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
							result="goo"
						/>
						<feComposite in="SourceGraphic" in2="goo" operator="atop" />
					</filter>
				</defs>
				<motion.rect
					data-sileo-pill
					:rx="resolvedRoundness"
					:ry="resolvedRoundness"
					:fill="view.fill"
					:initial="false"
					:animate="pillAnimate"
					:transition="pillTransition"
				/>
				<motion.rect
					data-sileo-body
					:y="HEIGHT"
					:width="WIDTH"
					:rx="resolvedRoundness"
					:ry="resolvedRoundness"
					:fill="view.fill"
					:initial="false"
					:animate="bodyAnimate"
					:transition="bodyTransition"
				/>
			</svg>
		</div>

		<!-- Header -->
		<div ref="headerRef" data-sileo-header :data-edge="props.expand">
			<div data-sileo-header-stack>
				<!-- Current header -->
				<div
					ref="innerRef"
					:key="headerLayer.current.key"
					data-sileo-header-inner
					data-layer="current"
				>
					<div
						data-sileo-badge
						:data-state="headerLayer.current.view.state"
						:class="headerLayer.current.view.styles?.badge"
					>
						<component :is="() => getIcon(headerLayer.current.view)" />
					</div>
					<span
						data-sileo-title
						:data-state="headerLayer.current.view.state"
						:class="headerLayer.current.view.styles?.title"
					>
						{{ headerLayer.current.view.title }}
					</span>
				</div>
				<!-- Previous header (exiting) -->
				<div
					v-if="headerLayer.prev"
					:key="headerLayer.prev.key"
					data-sileo-header-inner
					data-layer="prev"
					data-exiting="true"
				>
					<div
						data-sileo-badge
						:data-state="headerLayer.prev.view.state"
						:class="headerLayer.prev.view.styles?.badge"
					>
						<component :is="() => getIcon(headerLayer.prev!.view)" />
					</div>
					<span
						data-sileo-title
						:data-state="headerLayer.prev.view.state"
						:class="headerLayer.prev.view.styles?.title"
					>
						{{ headerLayer.prev.view.title }}
					</span>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div
			v-if="hasDesc"
			data-sileo-content
			:data-edge="props.expand"
			:data-visible="open"
		>
			<div
				ref="contentRef"
				data-sileo-description
				:class="view.styles?.description"
			>
				<template v-if="typeof view.description === 'string'">
					{{ view.description }}
				</template>
				<component v-else-if="view.description" :is="() => view.description" />
				<a
					v-if="view.button"
					href="#"
					data-sileo-button
					:data-state="view.state"
					:class="view.styles?.button"
					@click="handleButtonClick"
				>
					{{ view.button.title }}
				</a>
			</div>
		</div>
	</button>
</template>
