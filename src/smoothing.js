export class LandmarkSmoother {
  constructor(alpha = 0.4) {
    this.alpha = alpha;
    this.prev = null;
  }
  update(lms) {
    if (!this.prev) {
      this.prev = lms.map((p) => ({ ...p }));
      return this.prev;
    }
    this.prev = lms.map((p, i) => {
      const o = this.prev[i];
      const a = this.alpha;
      return {
        x: o.x + a * (p.x - o.x),
        y: o.y + a * (p.y - o.y),
        z: o.z + a * (p.z - o.z),
        visibility: p.visibility,
      };
    });
    return this.prev;
  }
}