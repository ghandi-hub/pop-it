<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { PopItGame } from '$lib/games/pop-it/game';
	import { sound } from '$lib/games/pop-it/sound';
	import type { GameSnapshot } from '$lib/games/pop-it/types';
	import GameHud from '$lib/components/pop-it/GameHud.svelte';
	import PopItBoard from '$lib/components/pop-it/PopItBoard.svelte';
	import PopItButton from '$lib/components/pop-it/PopItButton.svelte';
	import LevelClear from '$lib/components/pop-it/LevelClear.svelte';
	import GameOver from '$lib/components/pop-it/GameOver.svelte';
	import DeviceMockup from '$lib/components/pop-it/DeviceMockup.svelte';

	let game: PopItGame | null = null;
	let snapshot = $state<GameSnapshot>({
		state: 'idle',
		level: 1,
		bubbles: [],
		totalBubbles: 20,
		activeCount: 4,
		pressedCount: 0,
		remainingTime: 10.0,
		baseTime: 10.0,
		score: 0,
		combo: 0,
		maxCombo: 0,
		bestScore: 0,
		bestLevel: 1,
		timeBonusAwarded: 2.0,
		isNewBest: false
	});

	let soundEnabled = $state(true);
	let showLeaderboard = $state(false);
	let leaderboardData = $state<any[]>([]);
	let loadingLeaderboard = $state(false);

	onMount(() => {
		soundEnabled = sound.isSoundEnabled();
		game = new PopItGame();
		const unsubscribe = game.subscribe((snap) => {
			snapshot = snap;
		});

		return () => {
			unsubscribe();
			game?.destroy();
		};
	});

	onDestroy(() => {
		game?.destroy();
	});

	function handleStartGame() {
		sound.init();
		game?.start();
	}

	function handlePop(id: number) {
		game?.popBubble(id);
	}

	function handleRestart() {
		game?.restart();
	}

	function handleToggleSound() {
		soundEnabled = sound.toggleSound();
	}

	async function fetchLeaderboard() {
		showLeaderboard = true;
		loadingLeaderboard = true;
		try {
			const res = await fetch('/api/leaderboard?limit=10');
			const json = await res.json();
			if (json.success && Array.isArray(json.data)) {
				leaderboardData = json.data;
			}
		} catch {
			leaderboardData = [];
		} finally {
			loadingLeaderboard = false;
		}
	}
</script>

<svelte:head>
	<title>Pop It Time Attack — See it. Pop it. Beat the clock.</title>
	<meta name="description" content="Fast-paced tactile brutalist Pop It web game. Press all bubbles before the timer expires!" />
</svelte:head>

<div class="min-h-screen w-full bg-[#F4EBD0] py-2 px-1 sm:py-4 sm:px-4 flex flex-col items-center justify-between text-[#111111]">
	<!-- Top Navigation / Title Header -->
	<header class="w-full max-w-xl flex items-center justify-between py-2 px-1 select-none">
		<div class="flex items-center gap-2">
			<span class="w-4 h-4 rounded-full bg-[#FF5C35] border-2 border-[#111111]"></span>
			<span class="font-display font-black text-lg tracking-tight uppercase">POP IT TIME ATTACK</span>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/games/pop-it"
				class="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white border-2 border-[#111111] hover:bg-[#FFD23F] transition-colors"
			>
				FULLSCREEN
			</a>
		</div>
	</header>

	<main class="w-full max-w-xl flex-1 flex flex-col items-center justify-center my-2">
		<DeviceMockup>
			<!-- IDLE SCREEN -->
			{#if snapshot.state === 'idle'}
				<div class="flex-1 flex flex-col items-center justify-between text-center py-6 px-3">
					<div class="flex flex-col items-center">
						<div class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#111111] text-[#FFD23F] border-2 border-[#111111] shadow-[3px_3px_0_#FF5C35] mb-3">
							<span class="text-xs">⚡</span>
							<span class="text-[11px] font-black uppercase tracking-widest">TACTILE ARCADE ACTION</span>
						</div>

						<h1 class="font-display text-5xl sm:text-6xl font-black text-[#111111] uppercase tracking-tighter leading-none">
							POP IT!
						</h1>
						<h2 class="font-display text-2xl sm:text-3xl font-black text-[#D84315] uppercase tracking-wider mt-1">
							TIME ATTACK
						</h2>
						<p class="text-xs sm:text-sm font-bold text-[#111111]/80 max-w-xs mt-2 uppercase tracking-wide">
							"See it. Pop it. Beat the clock."
						</p>
					</div>

					<!-- Visual Toy Preview -->
					<div class="my-4 p-4 rounded-3xl bg-white border-3 border-[#111111] shadow-[5px_5px_0_#111111] max-w-xs w-full">
						<div class="flex justify-center gap-3 mb-3">
							<div class="w-10 h-10 rounded-full bg-gradient-to-b from-[#ff7043] to-[#d84315] border-2 border-black shadow-[0_3px_4px_rgba(0,0,0,0.3)] animate-bounce"></div>
							<div class="w-10 h-10 rounded-full bg-gradient-to-b from-[#ffeb3b] to-[#fbc02d] border-2 border-black shadow-[0_3px_4px_rgba(0,0,0,0.3)] animate-bounce [animation-delay:150ms]"></div>
							<div class="w-10 h-10 rounded-full bg-gradient-to-b from-[#4dd0e1] to-[#00acc1] border-2 border-black shadow-[0_3px_4px_rgba(0,0,0,0.3)] animate-bounce [animation-delay:300ms]"></div>
							<div class="w-10 h-10 rounded-full bg-gradient-to-b from-[#ff80ab] to-[#f50057] border-2 border-black shadow-[0_3px_4px_rgba(0,0,0,0.3)] animate-bounce [animation-delay:450ms]"></div>
						</div>

						<div class="flex items-center justify-between text-xs font-black text-[#111111] border-t-2 border-[#111111]/20 pt-2.5">
							<span>RECORD:</span>
							<span class="font-mono-tabular font-black text-[#D84315]">
								{snapshot.bestScore > 0 ? `${snapshot.bestScore.toLocaleString()} PTS (LVL ${snapshot.bestLevel})` : 'NO RECORD YET'}
							</span>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-col gap-2.5 w-full max-w-xs">
						<PopItButton variant="primary" size="lg" onclick={handleStartGame} class="w-full text-xl shadow-[6px_6px_0_#111111]">
							PLAY NOW ▶
						</PopItButton>

						<div class="grid grid-cols-2 gap-2">
							<PopItButton variant="paper" size="sm" onclick={handleToggleSound}>
								{soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
							</PopItButton>

							<PopItButton variant="secondary" size="sm" onclick={fetchLeaderboard}>
								🏆 RANKS
							</PopItButton>
						</div>
					</div>
				</div>
			{:else}
				<!-- ACTIVE GAMEPLAY -->
				<div class="flex-1 flex flex-col justify-between py-1 relative">
					<GameHud
						{snapshot}
						{soundEnabled}
						onToggleSound={handleToggleSound}
					/>

					<div class="relative my-auto py-2">
						<PopItBoard
							bubbles={snapshot.bubbles}
							activeCount={snapshot.activeCount}
							gameState={snapshot.state}
							onPop={handlePop}
						/>

						{#if snapshot.state === 'level-clear'}
							<LevelClear
								level={snapshot.level}
								timeBonus={snapshot.timeBonusAwarded}
							/>
						{/if}
					</div>

					{#if snapshot.state === 'game-over'}
						<GameOver
							{snapshot}
							onRestart={handleRestart}
						/>
					{/if}

					<div class="flex items-center justify-between px-2 pt-1 text-[10px] font-bold text-[#111111]/60 uppercase tracking-wider select-none">
						<span>TAP OR CLICK BUBBLES QUICKLY</span>
						<span>POPS NEVER WAIT</span>
					</div>
				</div>
			{/if}
		</DeviceMockup>
	</main>

	<!-- Footer rules summary -->
	<footer class="w-full max-w-xl text-center py-2 text-xs font-bold text-[#111111]/60 uppercase tracking-wider select-none">
		Press all bubbles before the timer expires • Rapid pops build combo multiplier
	</footer>

	<!-- Leaderboard Modal -->
	{#if showLeaderboard}
		<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
			<div class="w-full max-w-md rounded-3xl bg-[#F4EBD0] border-4 border-[#111111] p-5 shadow-[8px_8px_0_#111111] flex flex-col max-h-[85vh]">
				<div class="flex items-center justify-between border-b-3 border-[#111111] pb-3 mb-3">
					<div class="flex items-center gap-2">
						<span class="text-2xl">🏆</span>
						<h3 class="font-display text-2xl font-black text-[#111111] uppercase tracking-wide">
							LEADERBOARD
						</h3>
					</div>
					<button
						type="button"
						onclick={() => (showLeaderboard = false)}
						class="w-8 h-8 rounded-full bg-[#111111] text-white font-bold flex items-center justify-center cursor-pointer border border-[#111111]"
					>
						✕
					</button>
				</div>

				<div class="flex-1 overflow-y-auto space-y-2 pr-1">
					{#if loadingLeaderboard}
						<div class="p-6 text-center text-sm font-bold text-[#111111]/70">
							Loading top scores...
						</div>
					{:else if leaderboardData.length === 0}
						<div class="p-6 text-center rounded-2xl bg-white border-2 border-[#111111]">
							<p class="font-bold text-sm text-[#111111]">No scores recorded yet!</p>
							<p class="text-xs text-[#111111]/60 mt-1">Play a game and submit your score to appear here.</p>
						</div>
					{:else}
						{#each leaderboardData as entry, index}
							<div class="flex items-center justify-between p-2.5 rounded-xl bg-white border-2 border-[#111111] shadow-[2px_2px_0_#111111]">
								<div class="flex items-center gap-2.5">
									<span class="w-6 h-6 rounded-full bg-[#FFD23F] border border-[#111111] font-display font-black text-xs flex items-center justify-center">
										{index + 1}
									</span>
									<div>
										<div class="font-extrabold text-sm text-[#111111]">{entry.playerName}</div>
										<div class="text-[10px] text-[#111111]/60">Stage {entry.level} • {entry.maxCombo ? `×${entry.maxCombo} Combo` : ''}</div>
									</div>
								</div>
								<div class="font-display font-mono-tabular font-black text-base text-[#D84315]">
									{entry.score.toLocaleString()} PTS
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<div class="mt-4 pt-3 border-t-2 border-[#111111]/20 flex justify-end">
					<PopItButton variant="ink" size="sm" onclick={() => (showLeaderboard = false)}>
						CLOSE
					</PopItButton>
				</div>
			</div>
		</div>
	{/if}
</div>
