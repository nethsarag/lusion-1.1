const MARGIN = 0.1; // in torso lengths, stops flickering at the thresholds

export class RepDetector {
  constructor({ onRep, onState }) {
    this.onRep = onRep;
    this.onState = onState;
    this.state = "WAIT_SETUP";
    this.rep = null;
    this.lastSetupBack = null;
  }

  setState(s) {
    if (this.state !== s) {
      this.state = s;
      this.onState?.(s);
    }
  }

  update(m, t) {
    if (m.minVis < 0.5) return; // body not clearly visible

    const { p, nose, torso } = m;
    const below = p.wrist.y > p.knee.y + MARGIN * torso; // wrists below knee
    const above = p.wrist.y < p.knee.y - MARGIN * torso; // wrists above knee
    const overhead = p.wrist.y < nose.y; // wrists above head
    const standing = m.kneeAngle > 160 && m.hipAngle > 155;

    switch (this.state) {
      case "WAIT_SETUP":
        if (below && !standing) this.setState("READY");
        break;

      case "READY":
        this.lastSetupBack = m.backAngle;
        if (above) {
          this.rep = {
            start: t,
            setupBack: this.lastSetupBack,
            peakHip: 0,
            peakKnee: 0,
            drift: 0,
            catchDepth: -Infinity,
            minKnee: 180,
            lockoutElbow: 0,
          };
          this.setState("PULL");
        }
        break;

      case "PULL": {
        const r = this.rep;
        r.peakHip = Math.max(r.peakHip, m.hipAngle);
        r.peakKnee = Math.max(r.peakKnee, m.kneeAngle);
        r.drift = Math.max(r.drift, Math.abs(p.wrist.x - p.ankle.x) / torso);
        if (overhead) this.setState("CATCH");
        else if (below || t - r.start > 4000) {
          this.rep = null; // abandoned pull
          this.setState("READY");
        }
        break;
      }

      case "CATCH": {
        const r = this.rep;
        r.catchDepth = Math.max(r.catchDepth, (p.hip.y - p.knee.y) / torso); // > 0 = hip below knee
        r.minKnee = Math.min(r.minKnee, m.kneeAngle);
        if (standing && r.minKnee < 150) {
          r.lockoutElbow = m.elbowAngle;
          r.durationMs = t - r.start;
          this.onRep?.(r);
          this.rep = null;
          this.setState("WAIT_SETUP");
        } else if (t - r.start > 10000) {
          this.rep = null;
          this.setState("WAIT_SETUP");
        }
        break;
      }
    }
  }
}