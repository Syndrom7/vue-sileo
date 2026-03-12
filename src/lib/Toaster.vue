<script setup lang="ts">
import {
	ref,
	computed,
	watch,
	onMounted,
	onUnmounted,
	type CSSProperties,
} from "vue";

/* --------------------------------- Themes -------------------------------- */

function useResolvedTheme(
	getTheme: () => "light" | "dark" | "system" | undefined,
) {
	const resolved = ref<"light" | "dark">((() => {
		const t = getTheme();
		if (t === "light" || t === "dark") return t;
		if (typeof window === "undefined") return "light";
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	})());

	watch(getTheme, (theme) => {
		if (theme === "light" || theme === "dark") {
			resolved.value = theme;
			return;
		}
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		resolved.value = mq.matches ? "dark" : "light";
	}, { immediate: true });

	let cleanup: (() => void) | undefined;

	watch(getTheme, (theme) => {
		cleanup?.();
		cleanup = undefined;
		if (theme !== "system" && theme !== undefined) return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) =>
			(resolved.value = e.matches ? "dark" : "light");
		mq.addEventListener("change", handler);
		cleanup = () => mq.removeEventListener("change", handler);
	}, { immediate: true });

	onUnmounted(() => cleanup?.());

	return resolved;
}
import Sileo from "./Sileo.vue";
import { SILEO_POSITIONS, type SileoPosition, type SileoStackProps } from "./types";
import {
	store,
	timeoutKey,
	pillAlign,
	expandDir,
	DEFAULT_DURATION,
	type SileoItem,
	type SileoOffsetValue,
	type SileoOffsetConfig,
	type SileoToasterProps,
} from "./store";
import { sileo } from "./store";

/* ---------------------------------- Props --------------------------------- */

const props = withDefaults(defineProps<SileoToasterProps>(), {
	position: "top-right",
	maxVisibleToasts: 3,
	theme: "system",
});

/* ---------------------------------- Theme --------------------------------- */

const resolvedTheme = useResolvedTheme(() => props.theme);

/* ---------------------------------- State --------------------------------- */

const toasts = ref<SileoItem[]>(store.toasts);
const activeId = ref<string>();
let hovering = false;
const timers = new Map<string, number>();
let latestId: string | undefined;

const stackExpanded = ref(new Map<SileoPosition, boolean>());
const frontHeights = ref(new Map<SileoPosition, number>());
const toastElMap = new Map<string, HTMLElement>();
let pendingHeightRaf = false;

/* ----------------------------- Handler caches ----------------------------- */

interface CachedHandlers {
	enter: (e: MouseEvent) => void;
	leave: (e: MouseEvent) => void;
	dismiss: () => void;
}

const handlersCache = new Map<string, CachedHandlers>();

/* -------------------------------- Helpers --------------------------------- */

function clearAllTimers() {
	for (const t of timers.values()) clearTimeout(t);
	timers.clear();
}

function dismissToast(id: string) {
	sileo.dismiss(id);
}

function schedule(items: SileoItem[]) {
	if (hovering) return;

	for (const item of items) {
		if (item.exiting) continue;
		const key = timeoutKey(item);
		if (timers.has(key)) continue;

		if (item.duration === null) continue;
		const dur = item.duration ?? DEFAULT_DURATION;
		if (dur <= 0) continue;

		timers.set(
			key,
			window.setTimeout(() => dismissToast(item.id), dur),
		);
	}
}

/* -------------------------------- Computed -------------------------------- */

const latest = computed(() => {
	const list = toasts.value;
	for (let i = list.length - 1; i >= 0; i--) {
		if (!list[i]!.exiting) return list[i]!.id;
	}
	return undefined;
});

const byPosition = computed(() => {
	const map = {} as Partial<Record<SileoPosition, SileoItem[]>>;
	for (const t of toasts.value) {
		const pos = t.position ?? props.position;
		const arr = map[pos];
		if (arr) {
			arr.push(t);
		} else {
			map[pos] = [t];
		}
	}
	return map;
});

/* ----------------------------- Stack Metadata ----------------------------- */

const stackMeta = computed(() => {
	const meta = new Map<string, SileoStackProps>();
	for (const [pos, items] of Object.entries(byPosition.value) as [SileoPosition, SileoItem[]][]) {
		if (!items) continue;
		const size = items.length;
		const expanded = stackExpanded.value.get(pos) ?? false;
		const fh = frontHeights.value.get(pos) ?? 40;
		for (let i = 0; i < size; i++) {
			const stackIndex = size - 1 - i;
			meta.set(items[i]!.id, {
				stackIndex,
				stackSize: size,
				frontHeight: fh,
				stackExpanded: expanded,
				stackVisible: stackIndex < props.maxVisibleToasts,
			});
		}
	}
	return meta;
});

function getStackProps(id: string): SileoStackProps {
	return stackMeta.value.get(id) ?? {
		stackIndex: 0,
		stackSize: 1,
		frontHeight: 40,
		stackExpanded: false,
		stackVisible: true,
	};
}

const stackCollapseTimers = new Map<SileoPosition, number>();

function expandStack(pos: SileoPosition) {
	const timer = stackCollapseTimers.get(pos);
	if (timer) {
		clearTimeout(timer);
		stackCollapseTimers.delete(pos);
	}
	if (stackExpanded.value.get(pos)) return;
	stackExpanded.value = new Map(stackExpanded.value.set(pos, true));
}

function collapseStack(pos: SileoPosition) {
	// Debounce collapse so moving between toasts in a group doesn't flicker
	const existing = stackCollapseTimers.get(pos);
	if (existing) clearTimeout(existing);
	stackCollapseTimers.set(pos, window.setTimeout(() => {
		stackCollapseTimers.delete(pos);
		stackExpanded.value = new Map(stackExpanded.value.set(pos, false));
	}, 100));
}

function trackToastEl(id: string, pos: SileoPosition, el: HTMLElement | null) {
	if (!el) {
		toastElMap.delete(id);
		return;
	}
	toastElMap.set(id, el);
	const items = byPosition.value[pos];
	if (!items || items.length === 0) return;
	const frontId = items[items.length - 1]?.id;
	if (id !== frontId || pendingHeightRaf) return;
	pendingHeightRaf = true;
	requestAnimationFrame(() => {
		pendingHeightRaf = false;
		const h = el.offsetHeight;
		if (h > 0 && frontHeights.value.get(pos) !== h) {
			frontHeights.value = new Map(frontHeights.value.set(pos, h));
		}
	});
}

/* ------------------------------- Watchers -------------------------------- */

watch(latest, (val) => {
	latestId = val;
	activeId.value = val;
});

watch(
	() => props.position,
	(pos) => {
		store.position = pos;
	},
	{ immediate: true },
);

watch(
	() => props.options,
	(opts) => {
		store.options = opts;
	},
	{ immediate: true },
);

watch(toasts, (current) => {
	// Cleanup stale timers and handler caches
	const toastKeys = new Set(current.map(timeoutKey));
	const toastIds = new Set(current.map((t) => t.id));

	for (const [key, timer] of timers) {
		if (!toastKeys.has(key)) {
			clearTimeout(timer);
			timers.delete(key);
		}
	}
	for (const id of handlersCache.keys()) {
		if (!toastIds.has(id)) handlersCache.delete(id);
	}

	schedule(current);
}, { deep: true });

/* -------------------------------- Handlers -------------------------------- */

function handleMouseEnter() {
	if (hovering) return;
	hovering = true;
	clearAllTimers();
}

function handleMouseLeave() {
	if (!hovering) return;
	hovering = false;
	schedule(toasts.value);
}

function getToastPosition(toastId: string): SileoPosition | undefined {
	const item = toasts.value.find((t) => t.id === toastId);
	return item?.position ?? props.position;
}

function getHandlers(toastId: string): CachedHandlers {
	let cached = handlersCache.get(toastId);
	if (cached) return cached;

	cached = {
		enter: (_e: MouseEvent) => {
			if (activeId.value !== toastId) activeId.value = toastId;
			handleMouseEnter();
			const pos = getToastPosition(toastId);
			if (pos) expandStack(pos);
		},
		leave: (_e: MouseEvent) => {
			if (activeId.value !== latestId) activeId.value = latestId;
			handleMouseLeave();
			const pos = getToastPosition(toastId);
			if (pos) collapseStack(pos);
		},
		dismiss: () => dismissToast(toastId),
	};

	handlersCache.set(toastId, cached);
	return cached;
}

function getViewportStyle(pos: SileoPosition): CSSProperties | undefined {
	if (props.offset === undefined) return undefined;

	const o =
		typeof props.offset === "object"
			? (props.offset as SileoOffsetConfig)
			: { top: props.offset, right: props.offset, bottom: props.offset, left: props.offset } as SileoOffsetConfig;

	const s: Record<string, string> = {};
	const px = (v: SileoOffsetValue) =>
		typeof v === "number" ? `${v}px` : v;

	if (pos.startsWith("top") && o.top) s.top = px(o.top);
	if (pos.startsWith("bottom") && o.bottom) s.bottom = px(o.bottom);
	if (pos.endsWith("left") && o.left) s.left = px(o.left);
	if (pos.endsWith("right") && o.right) s.right = px(o.right);

	return s as CSSProperties;
}

/* ------------------------------ Lifecycle -------------------------------- */
const mounted = ref(false)

onMounted(() => {
	mounted.value = true

	store.listeners.add((next) => {
		toasts.value = [...next];
	});
});

onUnmounted(() => {
	store.listeners.clear();
	clearAllTimers();
	for (const t of stackCollapseTimers.values()) clearTimeout(t);
	stackCollapseTimers.clear();
});
</script>

<template>
	<slot />
	<Teleport v-if="mounted" to="body">
		<template v-for="pos in SILEO_POSITIONS" :key="pos">
		<section
			v-if="byPosition[pos]?.length"
			data-sileo-viewport
			:data-position="pos"
			:data-stacked="(byPosition[pos]?.length ?? 0) > 1 ? '' : undefined"
			:data-stack-expanded="stackExpanded.get(pos) ? '' : undefined"
			:data-theme="resolvedTheme"
			aria-live="polite"
			:style="getViewportStyle(pos)"
			@mouseenter="expandStack(pos)"
			@mouseleave="collapseStack(pos)"
		>
			<Sileo
				v-for="item in byPosition[pos]"
				:key="item.id"
				:ref="(el: any) => trackToastEl(item.id, pos, el?.$el ?? el)"
				:id="item.id"
				:state="item.state"
				:title="item.title"
				:description="item.description"
				:position="pillAlign(pos)"
				:expand="expandDir(pos)"
				:icon="item.icon"
				:fill="item.fill"
				:styles="item.styles"
				:button="item.button"
				:description-align="item.descriptionAlign"
				:roundness="item.roundness"
				:exiting="item.exiting"
				:auto-expand-delay-ms="item.autoExpandDelayMs"
				:auto-collapse-delay-ms="item.autoCollapseDelayMs"
				:refresh-key="item.instanceId"
				:can-expand="activeId === undefined || activeId === item.id"
				:stack="getStackProps(item.id)"
				@mouseenter="getHandlers(item.id).enter($event)"
				@mouseleave="getHandlers(item.id).leave($event)"
				@dismiss="getHandlers(item.id).dismiss()"
			/>
		</section>
	</template>
	</Teleport>
</template>
