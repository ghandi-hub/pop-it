<script lang="ts">
	import { fade } from 'svelte/transition';

	interface Props {
		level: number;
		timeBonus: number;
	}

	let { level, timeBonus }: Props = $props();
</script>

<div
	transition:fade={{ duration: 150 }}
	class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none p-3 select-none"
>
	<div
		class="px-6 py-3 sm:px-8 sm:py-3.5 rounded-2xl bg-[#111111] text-white border-3 border-[#111111] shadow-[5px_5px_0_rgba(0,0,0,0.35)] flex flex-col items-center justify-center animate-pop"
	>
		<h2 class="font-display text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-[#FFD23F] leading-none">
			STAGE {level} CLEAR!
		</h2>
		<span class="font-mono-tabular font-black text-xs sm:text-sm text-[#00E5FF] tracking-wide mt-1">
			+{timeBonus.toFixed(1)}s TIME BONUS
		</span>
	</div>
</div>

<style>
	@keyframes pop {
		0% {
			transform: scale(0.85);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	.animate-pop {
		animation: pop 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
	}
</style>
