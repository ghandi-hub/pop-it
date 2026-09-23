<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		deviceType?: 'phone' | 'tablet' | 'desktop';
		children?: Snippet;
	}

	let { deviceType = 'phone', children }: Props = $props();
</script>

<div class="relative w-full mx-auto flex flex-col items-center justify-center p-0.5 sm:p-4">
	<!-- Cabinet / Device Outer Shell (Streamlined on mobile to maximize board width) -->
	<div
		class="relative w-full rounded-2xl sm:rounded-[2.5rem] bg-[#111111] p-1.5 sm:p-5 border-2 sm:border-4 border-[#111111] shadow-[4px_4px_0px_#111111] sm:shadow-[12px_12px_0px_rgba(0,0,0,0.85)] max-w-xl transition-all duration-300"
	>
		<!-- Retro Arcade Speaker Grill & Status Header -->
		<div class="flex items-center justify-between px-2 sm:px-3 py-1 mb-1.5 select-none">
			<div class="flex items-center gap-1.5">
				<span class="w-2.5 h-2.5 rounded-full bg-[#FF4D4D] border border-black"></span>
				<span class="w-2.5 h-2.5 rounded-full bg-[#FFD23F] border border-black"></span>
				<span class="w-2.5 h-2.5 rounded-full bg-[#06D6A0] border border-black"></span>
			</div>

			<!-- Speaker Holes -->
			<div class="flex gap-1 opacity-60">
				<div class="w-1.5 h-1.5 rounded-full bg-[#F4EBD0]"></div>
				<div class="w-1.5 h-1.5 rounded-full bg-[#F4EBD0]"></div>
				<div class="w-1.5 h-1.5 rounded-full bg-[#F4EBD0]"></div>
				<div class="w-1.5 h-1.5 rounded-full bg-[#F4EBD0]"></div>
				<div class="w-1.5 h-1.5 rounded-full bg-[#F4EBD0]"></div>
			</div>

			<span class="text-[9px] font-black uppercase tracking-widest text-[#F4EBD0]/80">
				ARCADE TOY
			</span>
		</div>

		<!-- Inner Screen Glass -->
		<div
			class="relative rounded-xl sm:rounded-[2rem] bg-[#F4EBD0] p-2 sm:p-5 border-2 sm:border-3 border-[#111111] overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.25)] min-h-[500px] flex flex-col justify-between"
		>
			<!-- Subtle Glass Glare Diagonal Ribbon -->
			<div
				class="absolute -top-32 -left-32 w-80 h-96 bg-white/10 transform rotate-25 pointer-events-none blur-sm"
			></div>

			<!-- Embedded Screen Content -->
			<div class="relative z-10 w-full flex-1 flex flex-col justify-between">
				{@render children?.()}
			</div>
		</div>

		<!-- Bottom Cabinet Coin Door Detail -->
		<div class="flex items-center justify-between px-3 pt-2 pb-0.5 select-none text-[9px] font-black text-[#F4EBD0]/70 uppercase tracking-widest">
			<span>FREE PLAY</span>
			<div class="w-10 h-1 rounded-full bg-[#F4EBD0]/30 border border-[#F4EBD0]/20"></div>
			<span>QUICK PUSH EDITION</span>
		</div>
	</div>
</div>
