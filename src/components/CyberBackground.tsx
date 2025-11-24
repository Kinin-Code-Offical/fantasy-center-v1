"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();

  // Reset loading state on route change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cyber-loading-stop'));
    }
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Particle System
    const particles: Particle[] = [];
    const isMobile = width < 768;
    const particleCount = isMobile ? 50 : Math.min(width / 5, 300); // Reduced on mobile
    const connectionDistance = Math.min(width, height) * 0.12;
    const sphereRadius = Math.min(width, height) * 0.20; // Reduced radius to prevent overflow (was 0.25)

    // Mouse interaction
    let mouseX = width / 2;
    let mouseY = height / 2;

    // Shape Morphing System
    type ShapeType = 'SPHERE' | 'CUBE' | 'TORUS' | 'DNA' | 'PYRAMID' | 'HOURGLASS' | 'RING';
    let currentShape: ShapeType = 'SPHERE';
    let shapeTimer = 0;
    const SHAPE_DURATION = 600; // Slower shape transitions (approx 10s)
    let isLoading = false; // Loading state

    // Listen for custom events
    const startLoading = () => { isLoading = true; currentShape = 'RING'; };
    const stopLoading = () => { isLoading = false; };

    window.addEventListener('cyber-loading-start', startLoading);
    window.addEventListener('cyber-loading-stop', stopLoading);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      isSphere: boolean;
      sphereAnglePhi: number;
      sphereAngleTheta: number;

      // Morphing properties
      targetX: number = 0;
      targetY: number = 0;
      targetZ: number = 0;
      currentX: number = 0;
      currentY: number = 0;
      currentZ: number = 0;

      constructor(isSphere = false) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.5; // Faster floating
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2 + 1.5;
        this.isSphere = isSphere;

        // Sphere coordinates (initial)
        this.sphereAnglePhi = Math.random() * Math.PI * 2;
        this.sphereAngleTheta = Math.random() * Math.PI;

        // Initialize 3D position
        const r = sphereRadius;
        this.currentX = r * Math.sin(this.sphereAngleTheta) * Math.cos(this.sphereAnglePhi);
        this.currentY = r * Math.sin(this.sphereAngleTheta) * Math.sin(this.sphereAnglePhi);
        this.currentZ = r * Math.cos(this.sphereAngleTheta);
      }

      calculateTargetPosition() {
        const r = sphereRadius;

        // Faster rotation for all shapes
        // If loading, rotate much faster
        const rotationSpeed = isLoading ? 0.05 : 0.01;
        this.sphereAnglePhi += rotationSpeed;
        this.sphereAngleTheta += 0.005;

        switch (currentShape) {
          case 'SPHERE':
            this.targetX = r * Math.sin(this.sphereAngleTheta) * Math.cos(this.sphereAnglePhi);
            this.targetY = r * Math.sin(this.sphereAngleTheta) * Math.sin(this.sphereAnglePhi);
            this.targetZ = r * Math.cos(this.sphereAngleTheta);
            break;

          case 'CUBE':
            // Map spherical coordinates to cube surface
            const side = r * 1.2;
            // This is a simplified "cloud cube"
            const u = Math.sin(this.sphereAnglePhi * 3) * side;
            const v = Math.cos(this.sphereAngleTheta * 3) * side;
            const w = Math.sin(this.sphereAngleTheta * 3 + this.sphereAnglePhi) * side;

            // Clamp to cube bounds
            this.targetX = Math.max(-side, Math.min(side, u));
            this.targetY = Math.max(-side, Math.min(side, v));
            this.targetZ = Math.max(-side, Math.min(side, w));
            break;

          case 'TORUS':
            const R = r * 0.8; // Major radius
            const tubeR = r * 0.3; // Minor radius
            this.targetX = (R + tubeR * Math.cos(this.sphereAngleTheta * 3)) * Math.cos(this.sphereAnglePhi);
            this.targetY = (R + tubeR * Math.cos(this.sphereAngleTheta * 3)) * Math.sin(this.sphereAnglePhi);
            this.targetZ = tubeR * Math.sin(this.sphereAngleTheta * 3);
            break;

          case 'DNA':
            // Double Helix
            const helixR = r * 0.6;
            const heightRange = r * 2;
            const turns = 3;

            // Map theta to height
            const h = ((this.sphereAngleTheta % Math.PI) / Math.PI) * heightRange - heightRange / 2;
            const angle = (h / heightRange) * Math.PI * 2 * turns + this.sphereAnglePhi;

            // Two strands based on index parity (simulated by phi)
            const strandOffset = Math.sin(this.sphereAnglePhi) > 0 ? 0 : Math.PI;

            this.targetX = helixR * Math.cos(angle + strandOffset);
            this.targetY = h;
            this.targetZ = helixR * Math.sin(angle + strandOffset);
            break;

          case 'PYRAMID':
            // Tetrahedron (Pyramid)
            const pyrH = r * 1.5;
            const pyrBase = r * 1.2;

            // Use phi to select one of 4 faces
            const face = Math.floor((this.sphereAnglePhi / (Math.PI * 2)) * 4) % 4;
            // Use theta for position on face (barycentric-ish)
            const t = (this.sphereAngleTheta / Math.PI); // 0 to 1 (top to bottom)

            // Vertices
            const top = { x: 0, y: -pyrH / 2, z: 0 };
            const v1 = { x: pyrBase, y: pyrH / 2, z: pyrBase };
            const v2 = { x: -pyrBase, y: pyrH / 2, z: pyrBase };
            const v3 = { x: 0, y: pyrH / 2, z: -pyrBase };

            let A, B, C;
            if (face === 0) { A = top; B = v1; C = v2; }
            else if (face === 1) { A = top; B = v2; C = v3; }
            else if (face === 2) { A = top; B = v3; C = v1; }
            else { A = v1; B = v2; C = v3; } // Base

            // Random point on triangle (barycentric)
            let r1 = Math.random(); // We use random here for distribution, but for stability we should use fixed props
            // To keep particles stable, we map theta/phi to barycentric coords
            // Simplified: Linear interpolation from A to B/C

            // Let's use a simpler mapping for stability
            // Interpolate between Top and Base Ring
            const ringAnglePyr = this.sphereAnglePhi;
            const radiusAtH = t * pyrBase;

            this.targetX = radiusAtH * Math.cos(ringAnglePyr);
            this.targetY = -pyrH / 2 + t * pyrH;
            this.targetZ = radiusAtH * Math.sin(ringAnglePyr);

            // Snap to 3 sides to make it look like a pyramid
            const snapAngle = (Math.PI * 2) / 3;
            const sector = Math.floor((ringAnglePyr + Math.PI) / snapAngle);
            const sectorAngle = sector * snapAngle;
            // Flatten the curve between vertices
            // This is a cone, let's keep it as a cone/pyramid hybrid for smoother motion
            break;

          case 'HOURGLASS':
            // Double Cone
            const hgH = r * 1.8;
            const hgW = r * 1.2;

            // Map theta to height (-1 to 1)
            const yNorm = Math.cos(this.sphereAngleTheta);
            this.targetY = yNorm * (hgH / 2);

            // Radius depends on height (absolute value for hourglass shape)
            const hgR = Math.abs(yNorm) * hgW;

            this.targetX = hgR * Math.cos(this.sphereAnglePhi);
            this.targetZ = hgR * Math.sin(this.sphereAnglePhi);
            break;

          case 'RING':
            // Simple rotating ring (Loading effect)
            const ringR = r * 1.0;
            // Use theta to distribute particles around the circle
            // Add some wave motion to Z for "breathing"
            const ringAngle = this.sphereAngleTheta * 2 + this.sphereAnglePhi; // Rotate with phi

            this.targetX = ringR * Math.cos(ringAngle);
            this.targetY = ringR * Math.sin(ringAngle);
            // Slight wobble in Z
            this.targetZ = Math.sin(ringAngle * 3) * (r * 0.1);
            break;
        }
      }

      update() {
        if (this.isSphere) {
          // 1. Calculate Target for current shape
          this.calculateTargetPosition();

          // 2. Lerp current position to target (Smooth Morphing)
          const lerpSpeed = 0.02; // Softer transition
          this.currentX += (this.targetX - this.currentX) * lerpSpeed;
          this.currentY += (this.targetY - this.currentY) * lerpSpeed;
          this.currentZ += (this.targetZ - this.currentZ) * lerpSpeed;

          // 3. Apply Mouse Interaction (Reaching/Bulge)
          let x3d = this.currentX;
          let y3d = this.currentY;
          let z3d = this.currentZ;

          const centerX = width / 2;
          const centerY = height / 2;
          const dx = mouseX - centerX;
          const dy = mouseY - centerY;

          // Global Reach (Move center)
          const reachFactor = 0.1;
          const shiftX = dx * reachFactor;
          const shiftY = dy * reachFactor;

          // Local Reach (Bulge)
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          const normDx = distToMouse > 0 ? dx / distToMouse : 0;
          const normDy = distToMouse > 0 ? dy / distToMouse : 0;

          const distToCenter = Math.sqrt(x3d * x3d + y3d * y3d);
          const normPx = distToCenter > 0 ? x3d / distToCenter : 0;
          const normPy = distToCenter > 0 ? y3d / distToCenter : 0;

          const alignment = normDx * normPx + normDy * normPy;

          if (alignment > 0.5) {
            const bulge = alignment * alignment * (distToMouse * 0.15);
            x3d += normDx * bulge;
            y3d += normDy * bulge;
          }

          // 4. Project to 2D
          // Clamp z3d to prevent extreme scaling when points get too close to camera
          const safeZ = Math.min(z3d, 1000);
          let scale = 1200 / (1200 - safeZ);
          if (scale < 0) scale = 0; // Handle points behind camera

          this.x = centerX + shiftX + x3d * scale;
          this.y = centerY + shiftY + y3d * scale;
          this.size = Math.max(0, (z3d > 0 ? 3 : 1.5) * scale);

        } else {
          // Floating background particles
          this.x += this.vx;
          this.y += this.vy;

          // Mouse repulsion
          const dx = this.x - mouseX;
          const dy = this.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 200;

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            this.vx += (dx / dist) * force * 0.05;
            this.vy += (dy / dist) * force * 0.05;
          }

          // Damping
          const maxSpeed = 2;
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
          }

          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;
        }
      }

      draw() {
        if (!ctx || this.size <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.isSphere ? "#00ff41" : "rgba(0, 255, 65, 0.5)";
        ctx.fill();
      }
    }    // Initialize particles
    // 70% forming the sphere (ball), 30% floating
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(i < particleCount * 0.7));
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Shape Cycle Logic (Only if not loading)
      if (!isLoading) {
        shapeTimer++;
        if (shapeTimer > SHAPE_DURATION) {
          shapeTimer = 0;
          const shapes: ShapeType[] = ['SPHERE', 'CUBE', 'TORUS', 'DNA', 'PYRAMID', 'HOURGLASS'];
          const nextIndex = (shapes.indexOf(currentShape) + 1) % shapes.length;
          currentShape = shapes[nextIndex];
        }
      }

      // Draw connections
      ctx.lineWidth = 0.8; // Thicker lines

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            // Stronger connections for sphere
            if (p1.isSphere && p2.isSphere && dist < 80) {
              // Brighter lines for sphere
              ctx.strokeStyle = `rgba(0, 255, 65, ${0.6 * (1 - dist / 80)})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            } else if (!p1.isSphere && !p2.isSphere) {
              ctx.strokeStyle = `rgba(0, 255, 65, ${0.2 * (1 - dist / connectionDistance)})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      requestAnimationFrame(animate);
    } animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener('cyber-loading-start', startLoading);
      window.removeEventListener('cyber-loading-stop', stopLoading);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] bg-[#050a05]"
    />
  );
}
