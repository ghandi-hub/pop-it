<script lang="ts">
	import type { Bubble, GameFeedbackEvent, GameState } from '$lib/games/pop-it/types';
	import PopBubble from './PopBubble.svelte';

	interface Props {
		bubbles: Bubble[];
		activeCount: number;
		hazardCount?: number;
		lastFeedback?: GameFeedbackEvent | null;
		gameState: GameState;
		onPop: (id: number) => void;
	}

	let { bubbles, activeCount, hazardCount = 0, lastFeedback = null, gameState, onPop }: Props = $props();

	// 4 columns on mobile gives generous breathing room so buttons never crowd each other
	let gridColsClass = $derived.by(() => {
		const count = bubbles.length;
		if (count <= 20) return 'grid-cols-4 sm:grid-cols-5';
		if (count <= 24) return 'grid-cols-4 sm:grid-cols-6';
		return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6';
	});

	let isLevelClear = $derived(gameState === 'level-clear');
	let isGameOver = $derived(gameState === 'game-over');
	let isDisabled = $derived(gameState !== 'playing');

	let hasGolden = $derived(bubbles.some(b => b.type === 'golden' && !b.pressed));
	let hasActiveHazard = $derived(bubbles.some(b => b.type === 'hazard' && !b.pressed));

	let isShaking = $state(false);

	$effect(() => {
		if (lastFeedback && lastFeedback.type === 'hazard') {
			isShaking = true;
			const timer = setTimeout(() => {
				isShaking = false;
			}, 350);
			return () => clearTimeout(timer);
		}
	});
</script>

<div class="relative w-full max-w-xl mx-auto flex flex-col items-center justify-center p-0.5 sm:p-2">
	<!-- Dynamic Floating Feedback Banner on Special Event -->
	{#if lastFeedback && gameState === 'playing'}
		<div
			class="absolute -top-3 sm:-top-4 z-20 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider border-2 border-[#111111] shadow-[3px_3px_0_#111111] animate-bounce pointer-events-none {lastFeedback.type === 'hazard' ? 'bg-[#EF4444] text-white' : 'bg-[#FFD23F] text-[#111111]'}"
		>
			{lastFeedback.message}
		</div>
	{/if}

	<!-- Toy Pop It Outer Silicone Casing -->
	<div
		class="relative w-full rounded-2xl sm:rounded-3xl bg-[#FFD166] border-3 sm:border-4 border-[#111111] p-2.5 sm:p-4 shadow-[5px_5px_0_#111111] sm:shadow-[8px_8px_0_#111111] transition-all duration-200 {isShaking ? 'animate-shake' : ''} {isLevelClear
			? 'scale-[1.02] shadow-[10px_10px_0_#111111]'
			: ''} {isGameOver ? 'opacity-85 filter contrast-90' : ''}"
	>
		<!-- Embossed top toy branding -->
		<div class="flex items-center justify-between pb-2 px-1 text-xs font-black uppercase tracking-wider text-[#111111]/80 select-none">
			<span class="flex items-center gap-1.5">
				<span class="w-2.5 h-2.5 rounded-full bg-[#EF476F] border border-[#111111]"></span>
				<span>QUICK PUSH TOY</span>
			</span>
			<div class="flex items-center gap-1.5 font-mono-tabular tracking-wide text-[10px]">
				<span class="bg-[#111111] text-[#00E5FF] px-2 py-0.5 rounded font-black border border-[#111111]">
					{activeCount} TARGETS
				</span>
				{#if hasActiveHazard}
					<span class="bg-[#EF4444] text-white px-2 py-0.5 rounded font-black border border-[#111111] animate-pulse">
						⚠️ AVOID BOMB
					</span>
				{/if}
				{#if hasGolden}
					<span class="bg-[#FFD23F] text-[#111111] px-1.5 py-0.5 rounded font-black border border-[#111111] animate-bounce">
						⭐ 2s BONUS
					</span>
				{/if}
			</div>
		</div>

		<!-- Inner recessed silicone pad with generous gap between buttons -->
		<div
			class="relative rounded-xl sm:rounded-2xl bg-[#FFE494] border-2 border-[#111111]/30 p-2 sm:p-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)]"
		>
			<!-- Dynamic Grid of Bubbles with ample separation -->
			<div class="grid {gridColsClass} gap-2.5 sm:gap-3.5 md:gap-4 justify-items-center items-center">
				{#each bubbles as bubble (bubble.id)}
					<PopBubble
						id={bubble.id}
						active={bubble.active}
						pressed={bubble.pressed}
						type={bubble.type ?? 'normal'}
						goldenTimeLeft={bubble.goldenTimeLeft}
						isExpiring={bubble.isExpiring}
						colorIndex={bubble.colorIndex ?? (Math.floor(bubble.id / 4))}
						disabled={isDisabled}
						{onPop}
					/>
				{/each}
			</div>
		</div>

		<!-- Bottom decorative toy vents/feet -->
		<div class="flex justify-between items-center pt-2 px-2 select-none">
			<div class="flex gap-1">
				<div class="w-3 h-1.5 rounded-full bg-[#111111]/30"></div>
				<div class="w-3 h-1.5 rounded-full bg-[#111111]/30"></div>
				<div class="w-3 h-1.5 rounded-full bg-[#111111]/30"></div>
			</div>
			<div class="text-[9px] font-black uppercase tracking-widest text-center {hasActiveHazard ? 'text-[#D32F2F]' : hasGolden ? 'text-[#B78103]' : 'text-[#111111]/70'}">
				{#if hasActiveHazard}
					⚠️ DANGER: AVOID POPPING THE 💣 BOMB BUBBLE!
				{:else if hasGolden}
					⭐ QUICK! POP GOLDEN STAR IN 2 SECONDS (+2.0s & 100 PTS)!
				{:else}
					POP ONLY THE LIT BUBBLES
				{/if}
			</div>
			<div class="flex gap-1">
				<div class="w-3 h-1.5 rounded-full bg-[#111111]/30"></div>
				<div class="w-3 h-1.5 rounded-full bg-[#111111]/30"></div>
				<div class="w-3 h-1.5 rounded-full bg-[#111111]/30"></div>
			</div>
		</div>
	</div>
</div>
