<script lang="ts">
	interface Props {
		level: number;
		timeBonus: number;
	}

	let { level, timeBonus }: Props = $props();
</script>

<div class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none p-4">
	<div
		class="relative flex flex-col items-center justify-center p-6 rounded-3xl bg-[#FFD23F] border-4 border-[#111111] shadow-[8px_8px_0_#111111] animate-in zoom-in-95 duration-200"
	>
		<!-- Top star banner -->
		<div class="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#111111] mb-1">
			<span>★</span>
			<span>STAGE COMPLETED</span>
			<span>★</span>
		</div>

		<!-- Title -->
		<h2 class="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#111111] tracking-tight uppercase leading-none drop-shadow-sm">
			STAGE {level} CLEAR!
		</h2>

		<!-- Time Bonus Banner (High contrast dark ink & yellow neon) -->
		<div
			class="mt-3 flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#111111] text-[#FFD23F] border-3 border-[#111111] shadow-[4px_4px_0_#FF5C35] transform -rotate-1 animate-pulse"
		>
			<span class="text-lg">⏱️</span>
			<span class="font-display text-xl sm:text-2xl font-black tracking-wider text-[#FFD23F]">
				+{timeBonus.toFixed(1)}s TIME BONUS
			</span>
		</div>

		<p class="text-xs font-black text-[#111111] uppercase tracking-widest mt-3">
			GET READY FOR STAGE {level + 1}...
		</p>
	</div>
</div>
