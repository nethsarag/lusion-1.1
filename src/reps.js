import { TORSO_METERS, MAX_PLAUSIBLE_SPEED } from "./dashboard/config.js";

const MARGIN = 0.1; // in torso lengths, stops flickering at the thresholds

export class RepDetector {
  constructor({ onRep, onState }) {
    this.onRep = onRep;
    this.onState = onState;
    this.state = "WAIT_SETUP";
    this.rep = null;
    this.lastSetupBack = null;
    this.prevWrist = null; // last wrist sample, for bar speed
    this.speeds = []; // last few upward speeds, averaged to calm jitter
  }

  setState(s) {
    if (this.state !== s) {
      this.state = s;
      this.onState?.(s);
    }
  }

  // Upward wrist speed in m/s. The wrists stand in for the bar, and the torso length for a ruler.
  trackSpeed(m, t) {
    const y = m.p.wrist.y;
    const prev = this.prevWrist;
    this.prevWrist = { y, t };
    if (!prev) return 0;
    const dt = t - prev.t;
    if (dt < 10 || dt > 100) return 0; // skipped frames: no reliable speed
    const v = ((prev.y - y) / dt) * 1000 * (TORSO_METERS / m.torso);
    if (v > 0 && v <= MAX_PLAUSIBLE_SPEED) this.speeds.push(v);
    else this.speeds.push(0);
    if (this.speeds.length > 3) this.speeds.shift();
    return this.speeds.reduce((a, b) => a + b, 0) / this.speeds.length;
  }

  update(m, t) {
    if (m.minVis < 0.5) {
      this.prevWrist = null; // body lost: do not measure across the gap
      return;
    }

    const speed = this.trackSpeed(m, t);
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
            peakVelocity: speed, // m/s, highest bar speed in this rep
            rom: null, // joint angles at the deepest point of the catch
          };
          this.setState("PULL");
        }
        break;

      case "PULL": {
        const r = this.rep;
        r.peakHip = Math.max(r.peakHip, m.hipAngle);
        r.peakKnee = Math.max(r.peakKnee, m.kneeAngle);
        r.drift = Math.max(r.drift, Math.abs(p.wrist.x - p.ankle.x) / torso);
        r.peakVelocity = Math.max(r.peakVelocity, speed);
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
        // the deepest frame so far (smallest knee angle) is the one the dashboard records
        if (m.kneeAngle <= r.minKnee) {
          r.rom = {
            shoulder: m.shoulderFlexion,
            hip: m.hipFlexion,
            knee: m.kneeFlexion,
            ankle: m.ankleDorsi,
          };
        }
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