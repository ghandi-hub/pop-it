<script lang="ts">
	import type { BubbleType } from '$lib/games/pop-it/types';
	import hazardSvg from '$lib/assets/hazard.svg';

	interface Props {
		id: number;
		active: boolean; // true if this bubble is lit up / target
		pressed: boolean;
		type?: BubbleType;
		colorIndex?: number;
		goldenTimeLeft?: number;
		isExpiring?: boolean;
		disabled?: boolean;
		onPop: (id: number) => void;
	}

	let {
		id,
		active,
		pressed,
		type = 'normal',
		colorIndex = 0,
		goldenTimeLeft = 2.0,
		isExpiring = false,
		disabled = false,
		onPop
	}: Props = $props();

	// Special themes for hazard and golden bubbles
	const HAZARD_THEME = {
		lit: 'from-[#ff2d55] via-[#d50000] to-[#7f0000]',
		glow: 'shadow-[0_0_20px_rgba(239,68,68,0.95),0_0_30px_rgba(185,28,28,0.7)] animate-pulse',
		sunken: 'from-[#2d0f0f] to-[#140606]',
		cavity: 'bg-[#3a0606]'
	};

	const GOLDEN_THEME = {
		lit: 'from-[#fffde7] via-[#ffd600] to-[#ff6f00]',
		glow: 'shadow-[0_0_22px_rgba(255,215,0,0.95),0_0_35px_rgba(255,179,0,0.7)] ring-2 ring-yellow-300/80',
		sunken: 'from-[#b28900] to-[#594200]',
		cavity: 'bg-[#473600]'
	};

	// Palette of rich tactile silicone colors
	const BUBBLE_COLORS = [
		{
			// Coral / Neon Red-Orange
			lit: 'from-[#ff784e] via-[#ff5722] to-[#d84315]',
			glow: 'shadow-[0_0_16px_rgba(255,87,34,0.9),0_4px_6px_rgba(0,0,0,0.35)]',
			sunken: 'from-[#bf360c] to-[#7f1d1d]',
			cavity: 'bg-[#5e1906]'
		},
		{
			// Sunshine Neon Yellow
			lit: 'from-[#fff566] via-[#ffd600] to-[#f57f17]',
			glow: 'shadow-[0_0_16px_rgba(255,214,0,0.95),0_4px_6px_rgba(0,0,0,0.35)]',
			sunken: 'from-[#e65100] to-[#8c3100]',
			cavity: 'bg-[#5c3100]'
		},
		{
			// Neon Cyan / Mint
			lit: 'from-[#64ffda] via-[#00e5ff] to-[#00b0ff]',
			glow: 'shadow-[0_0_16px_rgba(0,229,255,0.9),0_4px_6px_rgba(0,0,0,0.35)]',
			sunken: 'from-[#006064] to-[#00363a]',
			cavity: 'bg-[#002f33]'
		},
		{
			// Bubblegum Neon Pink
			lit: 'from-[#ff80ab] via-[#ff4081] to-[#f50057]',
			glow: 'shadow-[0_0_16px_rgba(255,64,129,0.9),0_4px_6px_rgba(0,0,0,0.35)]',
			sunken: 'from-[#ad1457] to-[#560027]',
			cavity: 'bg-[#480021]'
		},
		{
			// Electric Purple / Violet
			lit: 'from-[#d1c4e9] via-[#b388ff] to-[#7c4dff]',
			glow: 'shadow-[0_0_16px_rgba(179,136,255,0.9),0_4px_6px_rgba(0,0,0,0.35)]',
			sunken: 'from-[#512da8] to-[#311b92]',
			cavity: 'bg-[#29115c]'
		}
	];

	let theme = $derived.by(() => {
		if (type === 'hazard') return HAZARD_THEME;
		if (type === 'golden') {
			if (isExpiring) {
				return {
					...GOLDEN_THEME,
					glow: 'shadow-[0_0_24px_rgba(239,68,68,0.95),0_0_35px_rgba(255,215,0,0.9)] animate-pulse ring-2 ring-red-500'
				};
			}
			return GOLDEN_THEME;
		}
		return BUBBLE_COLORS[colorIndex % BUBBLE_COLORS.length];
	});

	function handlePointerDown(e: PointerEvent) {
		e.stopPropagation();
		if (disabled) return;
		onPop(id);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (!disabled) {
				onPop(id);
			}
		}
	}
</script>

<div class="relative flex items-center justify-center touch-manipulation">
	{#if type === 'golden' && active && !pressed}
		<!-- Urgent countdown pill badge floating prominently on top of golden bubble -->
		<div
			class="absolute -top-3 sm:-top-3.5 z-30 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black border-2 border-[#111111] shadow-[2px_2px_0_#111111] font-mono-tabular tracking-tight flex items-center gap-1 pointer-events-none select-none transition-all {isExpiring
				? 'bg-[#EF4444] text-white animate-bounce ring-2 ring-yellow-300'
				: 'bg-[#FFD23F] text-[#111111]'}"
		>
			<span class="text-[9px] sm:text-[10px]">{isExpiring ? '⚡' : '⭐'}</span>
			<span>{Math.max(0.1, goldenTimeLeft ?? 2.0).toFixed(1)}s</span>
		</div>
	{/if}

	<!-- Cavity socket in the silicone body (large, generous touch target) -->
	<div
		class="relative w-13 h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full {theme.cavity} p-1 shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)] flex items-center justify-center transition-opacity duration-150 {active
			? 'border border-black/40'
			: 'opacity-40 border border-black/20'}"
	>
		<!-- Interactive Bubble Dome Button -->
		<button
			type="button"
			{disabled}
			aria-label="Bubble {id + 1} {type === 'hazard' ? 'Hazard Bomb' : type === 'golden' ? 'Golden Bonus' : !active ? 'Inactive' : pressed ? 'Popped' : 'Lit target'}"
			aria-pressed={pressed}
			onpointerdown={handlePointerDown}
			onkeydown={handleKeyDown}
			class="relative w-full h-full rounded-full select-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-black focus-visible:ring-offset-2 transition-[transform,box-shadow,opacity] duration-75 ease-out {active
				? pressed
					? 'scale-[0.84] translate-y-1 shadow-[inset_0_4px_6px_rgba(0,0,0,0.8)] cursor-pointer'
					: `cursor-pointer active:scale-[0.88] active:translate-y-0.5 hover:scale-[1.04] ${theme.glow}`
				: 'scale-[0.92] cursor-pointer opacity-50'}"
		>
			<!-- Bubble dome surface -->
			<div
				class="w-full h-full rounded-full border border-black/30 bg-gradient-to-b flex items-center justify-center {active
					? pressed
						? theme.sunken
						: theme.lit
					: 'from-[#424242] to-[#212121]'}"
			>
				{#if type === 'hazard'}
					{#if active && !pressed}
						<!-- Hazard pulsating custom SVG icon -->
						<div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none p-2 sm:p-2.5">
							<img
								src={hazardSvg}
								alt="Hazard"
								class="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] animate-pulse"
							/>
						</div>
					{:else if active && pressed}
						<!-- Detonated explosion state -->
						<div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-85">
							<span class="text-xs sm:text-sm">💥</span>
						</div>
					{/if}
				{:else if type === 'golden'}
					{#if active && !pressed}
						<!-- Golden gleaming star bonus -->
						<div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none {isExpiring ? 'animate-pulse' : ''}">
							<span class="text-base sm:text-lg animate-spin [animation-duration:2s] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">⭐</span>
						</div>
						<div class="absolute top-1.5 left-2 w-3.5 h-2 rounded-[50%] bg-white/90 blur-[0.3px] transform -rotate-15 pointer-events-none"></div>
					{:else if active && pressed}
						<!-- Collected golden state -->
						<div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-70">
							<span class="text-xs">✨</span>
						</div>
					{/if}
				{:else}
					{#if active && !pressed}
						<!-- Glowing LED inner core -->
						<div
							class="absolute inset-1 rounded-full bg-white/30 blur-[1px] pointer-events-none"
						></div>
						<!-- Silicone specular highlight -->
						<div
							class="absolute top-1.5 left-2 w-3.5 h-2 rounded-[50%] bg-white/80 blur-[0.3px] transform -rotate-15 pointer-events-none"
						></div>
						<div
							class="absolute bottom-1 right-2 w-2 h-1 rounded-[50%] bg-white/40 blur-[0.2px] pointer-events-none"
						></div>
					{:else if active && pressed}
						<!-- Depressed inner concave reflection -->
						<div
							class="absolute inset-1 rounded-full border border-black/40 bg-black/30 pointer-events-none"
						></div>
					{:else}
						<!-- Inactive / unlit matte surface -->
						<div
							class="absolute top-1.5 left-2 w-2.5 h-1.5 rounded-[50%] bg-white/10 pointer-events-none"
						></div>
					{/if}
				{/if}
			</div>
		</button>
	</div>
</div>

<style>
	button {
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}
</style>
