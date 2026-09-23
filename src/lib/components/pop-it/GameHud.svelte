<script lang="ts">
	import type { GameSnapshot } from '$lib/games/pop-it/types';
	import GameTimer from './GameTimer.svelte';
	import GameProgress from './GameProgress.svelte';

	interface Props {
		snapshot: GameSnapshot;
		onToggleSound: () => void;
		soundEnabled: boolean;
	}

	let { snapshot, onToggleSound, soundEnabled }: Props = $props();
</script>

<div class="w-full max-w-xl mx-auto flex flex-col gap-2 select-none">
	<!-- Top Bar: Level, Best Score, Sound Toggle -->
	<div class="flex items-center justify-between gap-2">
		<!-- Level Badge (High contrast dark ink & bright yellow) -->
		<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] text-white border-2 border-[#111111] shadow-[3px_3px_0_#FF5C35]">
			<span class="text-[10px] font-black uppercase tracking-wider text-[#FFD23F]">STAGE</span>
			<span class="font-display text-lg sm:text-xl font-black text-white">{snapshot.level}</span>
		</div>

		<!-- Combo Badge (High contrast yellow & dark ink) -->
		{#if snapshot.combo >= 2 && snapshot.state === 'playing'}
			<div class="animate-bounce flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFD23F] text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0_#111111]">
				<span class="text-xs">🔥</span>
				<span class="font-display text-sm sm:text-base font-black tracking-wider">COMBO ×{snapshot.combo}</span>
			</div>
		{/if}

		<div class="flex items-center gap-2">
			<!-- Personal Best High Score indicator -->
			{#if snapshot.bestScore > 0}
				<div class="hidden sm:flex flex-col items-end px-2.5 py-1 rounded-xl bg-white border-2 border-[#111111] text-xs shadow-[2px_2px_0_#111111]">
					<span class="text-[9px] font-black text-[#111111]/70 uppercase">BEST</span>
					<span class="font-mono-tabular font-black text-[#111111]">{snapshot.bestScore.toLocaleString()}</span>
				</div>
			{/if}

			<!-- Audio Mute / Unmute Button with high contrast icon -->
			<button
				type="button"
				onclick={onToggleSound}
				aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
				class="btn-pressable w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer border-2 border-[#111111] {soundEnabled
					? 'bg-[#4ECDC4] text-[#111111]'
					: 'bg-[#E5E5E5] text-[#111111]'}"
			>
				{#if soundEnabled}
					<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
						<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
					</svg>
				{:else}
					<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
						<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Main HUD Grid: Score, Timer, Progress -->
	<div class="grid grid-cols-3 gap-2">
		<!-- Score panel with bold dark ink score -->
		<div class="flex flex-col items-center justify-center p-2 rounded-2xl bg-white border-3 border-[#111111] shadow-[4px_4px_0_#111111]">
			<div class="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#111111]/70">
				SCORE
			</div>
			<div class="font-display font-mono-tabular text-xl sm:text-2xl md:text-3xl font-black text-[#D84315] leading-none my-0.5">
				{snapshot.score.toLocaleString()}
			</div>
			<div class="text-[9px] font-black text-[#111111]/60 uppercase tracking-widest mt-1">
				POINTS
			</div>
		</div>

		<!-- Timer panel -->
		<GameTimer
			remainingTime={snapshot.remainingTime}
			baseTime={snapshot.baseTime}
		/>

		<!-- Progress panel (Target count vs Pressed count) -->
		<GameProgress
			pressed={snapshot.pressedCount}
			total={snapshot.activeCount}
		/>
	</div>
</div>
