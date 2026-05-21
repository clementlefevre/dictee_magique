<script lang="ts">
  type Op = "+" | "−";

  interface Problem {
    a: number;
    b: number;
    op: Op;
    ans: number;
  }

  function rand(lo: number, hi: number): number {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }

  function toDigits(n: number): [number, number, number] {
    return [Math.floor(n / 100), Math.floor((n % 100) / 10), n % 10];
  }

  function makeProblem(): Problem {
    const op: Op = Math.random() < 0.5 ? "+" : "−";
    let a: number, b: number;
    if (op === "+") {
      a = rand(10, 99);
      b = rand(1, 99);
    } else {
      a = rand(12, 99);
      b = rand(1, a - 1);
    }
    const ans = op === "+" ? a + b : a - b;
    return { a, b, op, ans };
  }

  // Returns [retenue_C, retenue_D, 0].
  // Addition  → retenue = carry produced by that column.
  // Subtraction → retenue = borrow taken FROM that column.
  function computeRetenues(
    op: Op,
    dA: [number, number, number],
    dB: [number, number, number],
  ): [number, number, number] {
    const [, dA_d, dA_u] = dA;
    const [, dB_d, dB_u] = dB;
    if (op === "+") {
      const c_D = Math.floor((dA_u + dB_u) / 10);
      const c_C = Math.floor((dA_d + dB_d + c_D) / 10);
      return [c_C, c_D, 0];
    } else {
      const b_D = dA_u < dB_u ? 1 : 0;
      const b_C = dA_d - b_D < dB_d ? 1 : 0;
      return [b_C, b_D, 0];
    }
  }

  let problem = $state(makeProblem());
  let userDigits = $state<string[]>(["", "", ""]);
  let userRetenues = $state<string[]>(["", "", ""]);
  let score = $state(0);
  let played = $state(0);
  let streak = $state(0);
  let result = $state<"" | "correct" | "wrong">("");

  let digA = $derived(toDigits(problem.a));
  let digB = $derived(toDigits(problem.b));
  let digAns = $derived(toDigits(problem.ans));
  let correctRetenues = $derived(computeRetenues(problem.op, digA, digB));

  function isLeadingZero(digs: [number, number, number], i: number): boolean {
    return digs[i] === 0 && digs.slice(0, i).every((d: number) => d === 0);
  }

  function cellText(digs: [number, number, number], i: number): string {
    return isLeadingZero(digs, i) ? "" : String(digs[i]);
  }

  function onRetenueInput(i: number, e: Event) {
    const digit = (e.target as HTMLInputElement).value
      .replace(/\D/g, "")
      .slice(-1);
    userRetenues[i] = digit;
    if (digit !== "") {
      setTimeout(() => {
        const nxt =
          i === 0
            ? document.querySelectorAll<HTMLInputElement>(".ret-row input")[1]
            : document.querySelectorAll<HTMLInputElement>(".ans-row input")[0];
        nxt?.focus();
      }, 0);
    }
  }

  function onInput(i: number, e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    const digit = raw.replace(/\D/g, "").slice(-1);
    userDigits[i] = digit;
    if (digit !== "" && i < 2) {
      setTimeout(() => {
        document
          .querySelectorAll<HTMLInputElement>(".ans-row input")
          [i + 1]?.focus();
      }, 0);
    }
  }

  function check() {
    const ansOk = userDigits.every((v, i) => Number(v || "0") === digAns[i]);
    const retOk = [0, 1].every(
      (i) => Number(userRetenues[i] || "0") === correctRetenues[i],
    );
    const correct = ansOk && retOk;
    played++;
    result = correct ? "correct" : "wrong";
    if (correct) {
      score++;
      streak++;
    } else {
      streak = 0;
    }
  }

  function next() {
    problem = makeProblem();
    userDigits = ["", "", ""];
    userRetenues = ["", "", ""];
    result = "";
    setTimeout(() => {
      document.querySelectorAll<HTMLInputElement>(".ret-row input")[0]?.focus();
    }, 50);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      if (result === "") check();
      else next();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<main>
  <header>
    <h1>🧮 Kalkuk</h1>
    <div class="stats">
      <span class="stat-box">⭐ {score} / {played}</span>
      {#if streak >= 3}
        <span class="streak-box">🔥 ×{streak}</span>
      {/if}
    </div>
  </header>

  <div class="card">
    <p class="subtitle">Addition &amp; Soustraction en colonnes</p>

    <table class="calc-table">
      <thead>
        <tr>
          <th class="th-op"></th>
          <th class="th-col"
            ><span class="col-full">Centaines</span><span class="col-short"
              >C</span
            ></th
          >
          <th class="th-col"
            ><span class="col-full">Dizaines</span><span class="col-short"
              >D</span
            ></th
          >
          <th class="th-col"
            ><span class="col-full">Unités</span><span class="col-short">U</span
            ></th
          >
        </tr>
      </thead>
      <tbody>
        <!-- Retenue row (carries for + / borrows for −) -->
        <tr class="ret-row">
          <td class="ret-label">{problem.op === "+" ? "carry" : "empr."}</td>
          {#each [0, 1, 2] as i (i)}
            {#if i < 2}
              <td class="ret-cell">
                <input
                  class="ret-input"
                  class:input-ok={result === "correct"}
                  class:input-ko={result === "wrong" &&
                    Number(userRetenues[i] || "0") !== correctRetenues[i]}
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  disabled={result !== ""}
                  value={userRetenues[i]}
                  oninput={(e) => onRetenueInput(i, e)}
                />
              </td>
            {:else}
              <td></td>
            {/if}
          {/each}
        </tr>

        <!-- First number -->
        <tr class="num-row">
          <td class="op-cell"></td>
          {#each [0, 1, 2] as i (i)}
            <td class="digit-cell" class:faded={isLeadingZero(digA, i)}>
              {cellText(digA, i)}
            </td>
          {/each}
        </tr>

        <!-- Operator + second number -->
        <tr class="num-row">
          <td class="op-cell">{problem.op}</td>
          {#each [0, 1, 2] as i (i)}
            <td class="digit-cell" class:faded={isLeadingZero(digB, i)}>
              {cellText(digB, i)}
            </td>
          {/each}
        </tr>

        <!-- Divider -->
        <tr>
          <td colspan="4" class="divider-cell"><div class="divider"></div></td>
        </tr>

        <!-- Answer row -->
        <tr class="ans-row">
          <td class="op-cell ans-eq">=</td>
          {#each userDigits as val, i (i)}
            <td class="input-cell">
              <input
                class="digit-input"
                class:input-ok={result === "correct"}
                class:input-ko={result === "wrong" &&
                  Number(val || "0") !== digAns[i]}
                type="text"
                inputmode="numeric"
                maxlength="2"
                disabled={result !== ""}
                value={val}
                oninput={(e) => onInput(i, e)}
              />
            </td>
          {/each}
        </tr>
      </tbody>
    </table>

    <!-- Feedback & actions -->
    <div class="actions">
      {#if result === ""}
        <p class="hint-text">
          Remplis la réponse chiffre par chiffre, puis clique sur Vérifier.
        </p>
        <button class="btn btn-check" onclick={check}> Vérifier ✓ </button>
      {:else if result === "correct"}
        <p class="msg msg-correct">🎉 Bravo, c'est exact !</p>
        <button class="btn btn-next" onclick={next}>Suivant →</button>
      {:else}
        <p class="msg msg-wrong">
          💪 La réponse était <strong>{problem.ans}</strong>
        </p>
        <button class="btn btn-next" onclick={next}>Réessayer →</button>
      {/if}
    </div>
  </div>
</main>
