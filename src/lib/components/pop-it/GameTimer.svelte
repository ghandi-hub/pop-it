<script lang="ts">
	interface Props {
		remainingTime: number; // in seconds
		baseTime: number;
		isWarning?: boolean;
		isCritical?: boolean;
	}

	let { remainingTime, baseTime }: Props = $props();

	let formattedTime = $derived.by(() => {
		const clamped = Math.max(0, remainingTime);
		const seconds = Math.floor(clamped);
		const centis = Math.floor((clamped - seconds) * 100);
		const secStr = seconds.toString().padStart(2, '0');
		const centiStr = centis.toString().padStart(2, '0');
		return `${secStr}.${centiStr}`;
	});

	let progressPercent = $derived.by(() => {
		if (baseTime <= 0) return 0;
		return Math.min(100, Math.max(0, (remainingTime / baseTime) * 100));
	});

	let isWarning = $derived(remainingTime <= 3.0 && remainingTime > 1.5);
	let isCritical = $derived(remainingTime <= 1.5 && remainingTime > 0);
</script>

<div
	class="flex flex-col items-center justify-center p-2 rounded-2xl border-3 border-[#111111] shadow-[4px_4px_0_#111111] transition-colors duration-150 {isCritical
		? 'bg-[#D32F2F] text-white animate-pulse'
		: isWarning
			? 'bg-[#FFD23F] text-[#111111]'
			: 'bg-white text-[#111111]'}"
>
	<div class="text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1">
		{#if isCritical}
			<span class="tracking-wider">CRITICAL!</span>
		{:else if isWarning}
			<span class="tracking-wider">HURRY UP!</span>
		{:else}
			<span class="text-[#111111]/70">TIME LEFT</span>
		{/if}
	</div>

	<!-- Tabular time counter -->
	<div class="font-display font-mono-tabular text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none my-0.5">
		{formattedTime}<span class="text-xs sm:text-sm font-sans font-bold ml-0.5">s</span>
	</div>

	<!-- Segmented brutalist time bar with high contrast -->
	<div class="w-full bg-[#111111]/25 h-2 rounded-full overflow-hidden border border-[#111111] mt-1">
		<div
			class="h-full transition-all duration-75 ease-linear {isCritical
				? 'bg-white'
				: isWarning
					? 'bg-[#D84315]'
					: 'bg-[#00BFA5]'}"
			style="width: {progressPercent}%;"
		></div>
	</div>
</div>
