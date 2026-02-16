<script setup lang="ts">
import {
	ref,
	computed,
	watch,
	onMounted,
	onUnmounted,
	type CSSProperties,
} from "vue";
import Sileo from "./Sileo.vue";
import { SILEO_POSITIONS, type SileoPosition } from "./types";
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
});

/* ---------------------------------- State --------------------------------- */

const toasts = ref<SileoItem[]>(store.toasts);
const activeId = ref<string>();
let hovering = false;
const timers = new Map<string, number>();
let latestId: string | undefined;

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

		const dur = item.duration ?? DEFAULT_DURATION;
		if (dur === null || dur <= 0) continue;

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

function getHandlers(toastId: string): CachedHandlers {
	let cached = handlersCache.get(toastId);
	if (cached) return cached;

	cached = {
		enter: (_e: MouseEvent) => {
			if (activeId.value !== toastId) activeId.value = toastId;
			handleMouseEnter();
		},
		leave: (_e: MouseEvent) => {
			if (activeId.value !== latestId) activeId.value = latestId;
			handleMouseLeave();
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

onMounted(() => {
	store.listeners.add((next) => {
		toasts.value = [...next];
	});
});

onUnmounted(() => {
	store.listeners.clear();
	clearAllTimers();
});
</script>

<template>
	<slot />
	<template v-for="pos in SILEO_POSITIONS" :key="pos">
		<section
			v-if="byPosition[pos]?.length"
			data-sileo-viewport
			:data-position="pos"
			aria-live="polite"
			:style="getViewportStyle(pos)"
		>
			<Sileo
				v-for="item in byPosition[pos]"
				:key="item.id"
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
				:roundness="item.roundness"
				:exiting="item.exiting"
				:auto-expand-delay-ms="item.autoExpandDelayMs"
				:auto-collapse-delay-ms="item.autoCollapseDelayMs"
				:refresh-key="item.instanceId"
				:can-expand="activeId === undefined || activeId === item.id"
				@mouseenter="getHandlers(item.id).enter($event)"
				@mouseleave="getHandlers(item.id).leave($event)"
				@dismiss="getHandlers(item.id).dismiss()"
			/>
		</section>
	</template>
</template>
