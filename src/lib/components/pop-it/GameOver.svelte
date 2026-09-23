<script lang="ts">
  import type { GameSnapshot } from "$lib/games/pop-it/types";
  import PopItButton from "./PopItButton.svelte";

  interface Props {
    snapshot: GameSnapshot;
    onRestart: () => void;
    onHome?: () => void;
  }

  let { snapshot, onRestart, onHome }: Props = $props();

  let playerName = $state("");
  let isSubmitting = $state(false);
  let submitMessage = $state("");
  let submitted = $state(false);

  async function handleSubmitScore(e: Event) {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || submitted) return;

    isSubmitting = true;
    submitMessage = "";

    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim(),
          score: snapshot.score,
          level: snapshot.level,
          maxCombo: snapshot.maxCombo,
          bubblesPopped: snapshot.pressedCount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        submitted = true;
        submitMessage = "Score submitted to leaderboard!";
      } else {
        submitMessage = data.message || "Saved locally!";
      }
    } catch {
      submitMessage = "Saved locally to browser!";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div
  class="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-30 flex items-center justify-center p-4 select-none"
>
  <div
    class="relative w-full max-w-md rounded-3xl bg-[#F4EBD0] border-4 border-[#111111] p-6 shadow-[10px_10px_0_#111111] animate-in zoom-in-95 duration-200 text-[#111111]"
  >
    <!-- Red Header Ribbon (High contrast dark red with bold white text) -->
    <div
      class="inline-block px-4 py-1.5 rounded-xl bg-[#D32F2F] text-white border-3 border-[#111111] shadow-[3px_3px_0_#111111] mb-2 transform -rotate-1"
    >
      <span class="font-display text-sm font-black uppercase tracking-wider"
        >GAME OVER</span
      >
    </div>

    <h2
      class="font-display text-4xl sm:text-5xl font-black text-[#111111] tracking-tight uppercase leading-none"
    >
      TIME'S UP!
    </h2>

    <!-- Results Grid with high contrast -->
    <div class="grid grid-cols-2 gap-2.5 my-4">
      <!-- Final Score -->
      <div
        class="p-3 rounded-2xl bg-white border-3 border-[#111111] shadow-[3px_3px_0_#111111] flex flex-col"
      >
        <span
          class="text-[10px] font-black text-[#111111]/70 uppercase tracking-widest"
          >FINAL SCORE</span
        >
        <span
          class="font-display font-mono-tabular text-2xl sm:text-3xl font-black text-[#D84315]"
        >
          {snapshot.score.toLocaleString()}
        </span>
      </div>

      <!-- Best Score -->
      <div
        class="p-3 rounded-2xl bg-white border-3 border-[#111111] shadow-[3px_3px_0_#111111] flex flex-col relative overflow-hidden"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[10px] font-black text-[#111111]/70 uppercase tracking-widest"
            >BEST SCORE</span
          >
          {#if snapshot.isNewBest}
            <span
              class="text-[9px] font-black bg-[#4ECDC4] text-[#111111] px-1.5 py-0.5 rounded border border-[#111111] uppercase animate-pulse"
            >
              NEW!
            </span>
          {/if}
        </div>
        <span
          class="font-display font-mono-tabular text-2xl sm:text-3xl font-black text-[#111111]"
        >
          {Math.max(snapshot.score, snapshot.bestScore).toLocaleString()}
        </span>
      </div>

      <!-- Level Reached -->
      <div
        class="p-2.5 rounded-xl bg-white border-2 border-[#111111] flex items-center justify-between"
      >
        <span class="text-xs font-black text-[#111111]/70 uppercase">STAGE</span
        >
        <span class="font-display font-black text-lg text-[#111111]"
          >STAGE {snapshot.level}</span
        >
      </div>

      <!-- Max Combo -->
      <div
        class="p-2.5 rounded-xl bg-white border-2 border-[#111111] flex items-center justify-between"
      >
        <span class="text-xs font-black text-[#111111]/70 uppercase"
          >MAX COMBO</span
        >
        <span class="font-display font-black text-lg text-[#D84315]"
          >×{snapshot.maxCombo}</span
        >
      </div>
    </div>

    <!-- Leaderboard Submission Form -->
    <!-- <form onsubmit={handleSubmitScore} class="mb-5 p-3 rounded-2xl bg-white border-2 border-[#111111]">
			<label for="player-name-input" class="block text-[10px] font-black uppercase tracking-wider text-[#111111] mb-1.5">
				ENTER NAME FOR LEADERBOARD
			</label>
			<div class="flex gap-2">
				<input
					id="player-name-input"
					type="text"
					bind:value={playerName}
					maxlength={20}
					placeholder="Player Name"
					disabled={submitted}
					class="flex-1 px-3 py-1.5 rounded-xl bg-[#F4EBD0]/50 border-2 border-[#111111] text-sm font-bold text-[#111111] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5C35] disabled:opacity-50"
				/>
				<PopItButton
					type="submit"
					size="sm"
					variant="secondary"
					disabled={!playerName.trim() || isSubmitting || submitted}
				>
					{submitted ? 'SENT!' : isSubmitting ? '...' : 'SUBMIT'}
				</PopItButton>
			</div>
			{#if submitMessage}
				<p class="text-[11px] font-black text-[#D84315] mt-1.5">
					{submitMessage}
				</p>
			{/if}
		</form> -->

    <!-- Action Buttons -->
    <div class="flex flex-col gap-2.5 mt-2">
      <PopItButton
        variant="primary"
        size="lg"
        onclick={onRestart}
        class="w-full text-lg shadow-[4px_4px_0_#111111]"
      >
        TRY AGAIN ↺
      </PopItButton>

      {#if onHome}
        <PopItButton
          variant="paper"
          size="md"
          onclick={onHome}
          class="w-full text-sm font-black uppercase shadow-[3px_3px_0_#111111]"
        >
          MAIN MENU
        </PopItButton>
      {/if}
    </div>
  </div>
</div>
