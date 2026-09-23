<script lang="ts">
	interface Props {
		id: number;
		active: boolean; // true if this bubble is lit up / target
		pressed: boolean;
		colorIndex?: number;
		disabled?: boolean;
		onPop: (id: number) => void;
	}

	let { id, active, pressed, colorIndex = 0, disabled = false, onPop }: Props = $props();

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

	let theme = $derived(BUBBLE_COLORS[colorIndex % BUBBLE_COLORS.length]);

	function handlePointerDown(e: PointerEvent) {
		// Only active and unpressed bubbles can be popped
		if (!active || pressed || disabled) return;
		onPop(id);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (active && !pressed && !disabled) {
				onPop(id);
			}
		}
	}
</script>

<div class="relative flex items-center justify-center p-1 sm:p-1.5 touch-manipulation">
	<!-- Cavity socket in the silicone body -->
	<div
		class="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full {theme.cavity} p-1 shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)] flex items-center justify-center transition-all duration-150 {active
			? 'border border-black/40'
			: 'opacity-40 border border-black/20'}"
	>
		<!-- Interactive Bubble Dome Button -->
		<button
			type="button"
			disabled={disabled || !active}
			aria-label="Bubble {id + 1} {!active ? 'Inactive' : pressed ? 'Popped' : 'Lit target'}"
			aria-pressed={pressed}
			onpointerdown={handlePointerDown}
			onkeydown={handleKeyDown}
			class="relative w-full h-full rounded-full select-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-black focus-visible:ring-offset-2 transition-all duration-100 ease-out {active
				? pressed
					? 'scale-[0.84] translate-y-1 shadow-[inset_0_4px_6px_rgba(0,0,0,0.8)] cursor-default'
					: `cursor-pointer active:scale-[0.88] active:translate-y-0.5 hover:scale-[1.04] ${theme.glow}`
				: 'scale-[0.92] cursor-not-allowed opacity-50'}"
		>
			<!-- Bubble dome surface -->
			<div
				class="w-full h-full rounded-full border border-black/30 bg-gradient-to-b transition-all duration-150 {active
					? pressed
						? theme.sunken
						: `${theme.lit} animate-[pulse_1.8s_ease-in-out_infinite]`
					: 'from-[#424242] to-[#212121]'}"
			>
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
