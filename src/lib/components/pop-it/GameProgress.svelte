<script lang="ts">
	interface Props {
		pressed: number;
		total: number;
	}

	let { pressed, total }: Props = $props();

	let percentage = $derived.by(() => {
		if (total <= 0) return 0;
		return Math.min(100, Math.round((pressed / total) * 100));
	});
</script>

<div class="flex flex-col items-center justify-center p-2 rounded-2xl bg-white border-3 border-[#111111] shadow-[4px_4px_0_#111111] text-[#111111]">
	<div class="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#111111]/70">
		TARGETS
	</div>

	<div class="font-display font-mono-tabular text-xl sm:text-2xl md:text-3xl font-black leading-none my-0.5">
		<span class="text-[#D84315]">{pressed}</span>
		<span class="text-sm font-sans font-black text-[#111111]/40">/</span>
		<span class="text-base sm:text-lg text-[#111111] font-black">{total}</span>
	</div>

	<!-- Progress track -->
	<div class="w-full bg-[#111111]/25 h-2 rounded-full overflow-hidden border border-[#111111] mt-1">
		<div
			class="h-full bg-[#00BFA5] transition-all duration-100 ease-out"
			style="width: {percentage}%;"
		></div>
	</div>
</div>
