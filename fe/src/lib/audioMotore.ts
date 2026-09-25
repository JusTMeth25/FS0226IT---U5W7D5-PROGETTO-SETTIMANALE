/**
 * Rombo sintetizzato con WebAudio: due oscillatori filtrati il cui tono segue
 * il regime. Nessun file audio da scaricare. Per le elettriche, un sibilo.
 * Parte solo dopo un gesto dell'utente (regola dei browser).
 */
export class AudioMotore {
  private ctx: AudioContext | null = null
  private osc1: OscillatorNode | null = null
  private osc2: OscillatorNode | null = null
  private filtro: BiquadFilterNode | null = null
  private volume: GainNode | null = null

  private readonly elettrica: boolean

  constructor(elettrica: boolean) {
    this.elettrica = elettrica
  }

  avvia() {
    if (this.ctx) return
    try {
      const ctx = new AudioContext()
      this.ctx = ctx
      this.volume = ctx.createGain()
      this.volume.gain.value = 0
      this.filtro = ctx.createBiquadFilter()
      this.filtro.type = 'lowpass'
      this.filtro.frequency.value = this.elettrica ? 3000 : 900
      this.osc1 = ctx.createOscillator()
      this.osc2 = ctx.createOscillator()
      this.osc1.type = this.elettrica ? 'sine' : 'sawtooth'
      this.osc2.type = this.elettrica ? 'triangle' : 'square'
      this.osc1.connect(this.filtro)
      this.osc2.connect(this.filtro)
      this.filtro.connect(this.volume)
      this.volume.connect(ctx.destination)
      this.osc1.start()
      this.osc2.start()
      this.volume.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3)
    } catch {
      this.ctx = null
    }
  }

  /** regime 0..1 della marcia, velocita' 0..1 rispetto alla massima. */
  aggiorna(regime: number, velocita: number, nitro: boolean) {
    if (!this.ctx || !this.osc1 || !this.osc2 || !this.filtro) return
    const t = this.ctx.currentTime
    if (this.elettrica) {
      const f = 180 + velocita * 1400
      this.osc1.frequency.setTargetAtTime(f, t, 0.03)
      this.osc2.frequency.setTargetAtTime(f * 1.5, t, 0.03)
    } else {
      const f = 45 + regime * 190
      this.osc1.frequency.setTargetAtTime(f, t, 0.02)
      this.osc2.frequency.setTargetAtTime(f / 2, t, 0.02)
      this.filtro.frequency.setTargetAtTime(500 + regime * 1600 + (nitro ? 1200 : 0), t, 0.05)
    }
  }

  ferma() {
    const ctx = this.ctx
    this.ctx = null
    if (!ctx) return
    try {
      this.volume?.gain.setTargetAtTime(0, ctx.currentTime, 0.1)
      setTimeout(() => ctx.close().catch(() => {}), 400)
    } catch {
      /* gia' chiuso */
    }
  }
}
