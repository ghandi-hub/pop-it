<script lang="ts">
	interface Props {
		countdown: number;
	}

	let { countdown }: Props = $props();

	let label = $derived.by(() => {
		if (countdown === 3) return { text: '3', sub: 'GET READY...', color: 'bg-[#FF5C35] text-white' };
		if (countdown === 2) return { text: '2', sub: 'FOCUS...', color: 'bg-[#FFD23F] text-[#111111]' };
		if (countdown === 1) return { text: '1', sub: 'READY?!', color: 'bg-[#00E5FF] text-[#111111]' };
		return { text: 'POP IT!', sub: 'BEAT THE CLOCK!', color: 'bg-[#10B981] text-white' };
	});
</script>

<div
	class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl sm:rounded-3xl pointer-events-none select-none transition-all duration-200"
>
	{#key countdown}
		<div class="flex flex-col items-center animate-count-pop">
			<!-- Main Badge -->
			<div
				class="px-6 py-3 sm:px-8 sm:py-4 rounded-3xl border-4 border-[#111111] shadow-[8px_8px_0_#111111] {label.color} flex flex-col items-center justify-center transform"
			>
				<span class="font-display font-black text-6xl sm:text-7xl md:text-8xl tracking-wider leading-none drop-shadow-sm">
					{label.text}
				</span>
			</div>

			<!-- Subtitle pill -->
			<div
				class="mt-3 px-4 py-1 rounded-full bg-[#111111] text-[#FFD23F] font-black text-xs sm:text-sm uppercase tracking-widest border-2 border-white shadow-[3px_3px_0_rgba(0,0,0,0.5)]"
			>
				{label.sub}
			</div>
		</div>
	{/key}
</div>

<style>
	@keyframes countPop {
		0% {
			transform: scale(0.4) rotate(-10deg);
			opacity: 0;
		}
		55% {
			transform: scale(1.15) rotate(3deg);
			opacity: 1;
		}
		80% {
			transform: scale(0.96) rotate(-1deg);
		}
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}

	.animate-count-pop {
		animation: countPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
	}
</style>
