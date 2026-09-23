<script lang="ts">
	import PopItButton from './PopItButton.svelte';
	import hazardSvg from '$lib/assets/hazard.svg';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
	>
		<div
			class="w-full max-w-md rounded-3xl bg-[#F4EBD0] border-4 border-[#111111] p-4 sm:p-5 shadow-[8px_8px_0_#111111] flex flex-col max-h-[90vh] animate-pop-in select-none text-[#111111]"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b-3 border-[#111111] pb-3 mb-3">
				<div class="flex items-center gap-2">
					<div>
						<h3 class="font-display text-xl sm:text-2xl font-black uppercase tracking-wide leading-none">
							CARA BERMAIN
						</h3>
					</div>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="w-8 h-8 rounded-full bg-[#111111] text-white font-bold flex items-center justify-center cursor-pointer border border-[#111111] hover:bg-[#D84315] transition-colors"
					aria-label="Tutup petunjuk"
				>
					✕
				</button>
			</div>

			<!-- Scrollable Content -->
			<div class="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
				<!-- Tipe Bubble -->
				<div class="p-3 rounded-2xl bg-white border-2 border-[#111111] shadow-[2px_2px_0_#111111]">
					<h4 class="font-display font-black text-sm uppercase tracking-wide text-[#111111] mb-2 flex items-center gap-1.5">
						<span>🔮</span> JENIS-JENIS BUBBLE
					</h4>

					<div class="space-y-2.5">
						<!-- Target Normal -->
						<div class="flex items-center gap-2.5 p-2 rounded-xl bg-[#F4EBD0]/60 border border-[#111111]/20">
							<div class="w-8 h-8 rounded-full bg-gradient-to-b from-[#ff7043] to-[#d84315] border-2 border-black flex-shrink-0 flex items-center justify-center shadow-sm">
								<div class="w-2 h-2 rounded-full bg-white/70"></div>
							</div>
							<div>
								<div class="font-black text-xs uppercase text-[#111111]">BUBBLE TARGET (MENYALA)</div>
								<div class="text-[10px] text-[#111111]/70 font-bold leading-tight">
									Pencet semua target ini untuk membersihkan stage dan melaju ke level berikutnya.
								</div>
							</div>
						</div>

						<!-- Golden Star -->
						<div class="flex items-center gap-2.5 p-2 rounded-xl bg-[#FFF9C4]/70 border border-[#111111]/20">
							<div class="w-8 h-8 rounded-full bg-gradient-to-b from-[#fffde7] to-[#ffd600] border-2 border-black flex-shrink-0 flex items-center justify-center shadow-sm ring-2 ring-yellow-400">
								<span class="text-sm">⭐</span>
							</div>
							<div>
								<div class="font-black text-xs uppercase text-[#B78103]">GOLDEN STAR (BONUS CEPAT)</div>
								<div class="text-[10px] text-[#111111]/70 font-bold leading-tight">
									Pencet dalam <strong>2 detik</strong>! Berhadiah <strong>+2.0 detik waktu</strong> dan <strong>+100 poin ekstra</strong>.
								</div>
							</div>
						</div>

						<!-- Hazard Bomb -->
						<div class="flex items-center gap-2.5 p-2 rounded-xl bg-[#FFEBEE]/80 border border-[#111111]/20">
							<div class="w-8 h-8 rounded-full bg-gradient-to-b from-[#ff2d55] to-[#7f0000] border-2 border-black flex-shrink-0 flex items-center justify-center shadow-sm p-1.5">
								<img src={hazardSvg} alt="Hazard" class="w-full h-full object-contain" />
							</div>
							<div>
								<div class="font-black text-xs uppercase text-[#D32F2F]">HAZARD BOMB (HINDARI!)</div>
								<div class="text-[10px] text-[#D32F2F] font-bold leading-tight">
									<strong>JANGAN DIPENCET!</strong> Terkena bom memotong waktu <strong>-3.0 detik</strong> dan me-reset combo!
								</div>
							</div>
						</div>

						<!-- Combo System -->
						<div class="flex items-center gap-2.5 p-2 rounded-xl bg-[#FFFDE7]/80 border border-[#111111]/20">
							<div class="w-8 h-8 rounded-full bg-[#FFD23F] border-2 border-black flex-shrink-0 flex items-center justify-center shadow-sm text-sm">
								🔥
							</div>
							<div>
								<div class="font-black text-xs uppercase text-[#111111]">SISTEM COMBO STREAK</div>
								<div class="text-[10px] text-[#111111]/70 font-bold leading-tight">
									Pencet target terus tanpa henti untuk akumulasi combo antar level! Hitungan combo <strong>direset</strong> jika meleset (misal ke layar kosong/bubble mati) atau terkena bom.
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Footer CTA -->
			<div class="mt-3 pt-3 border-t-2 border-[#111111]/20 flex justify-end">
				<PopItButton
					variant="primary"
					size="md"
					onclick={onClose}
					class="w-full text-base shadow-[4px_4px_0_#111111]"
				>
					SIAP MAIN! ▶
				</PopItButton>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes popIn {
		from { transform: scale(0.92); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
	.animate-fade-in {
		animation: fadeIn 0.15s ease-out forwards;
	}
	.animate-pop-in {
		animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
	}
</style>
