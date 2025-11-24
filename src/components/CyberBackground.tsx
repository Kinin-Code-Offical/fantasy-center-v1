"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();

  // Route değiştiğinde loading'i durdur (Reset)
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
    let animationId: number;

    canvas.width = width;
    canvas.height = height;

    // --- AYARLAR ---
    const particleCount = Math.min(width / 8, 150); // Reduced particle count for safety
    const connectionDistance = Math.min(width, height) * 0.12;
    const sphereRadius = Math.min(width, height) * 0.20;

    // Mouse Interaction
    let mouseX = width / 2;
    let mouseY = height / 2;

    // Şekil Sistemi (Sadece İstenenler)
    type ShapeType = 'SPHERE' | 'TORUS' | 'HOURGLASS';
    let currentShape: ShapeType = 'SPHERE';
    let shapeTimer = 0;
    const SHAPE_DURATION = 800; // Şekiller arası geçiş süresi (yavaşlatıldı)
    let isLoading = false;

    // --- EVENT LISTENERS ---
    const startLoading = () => { 
        isLoading = true; 
        currentShape = 'HOURGLASS'; // Yüklenirken direkt Kum Saati
    };
    
    const stopLoading = () => { 
        isLoading = false; 
        currentShape = 'SPHERE'; // Yükleme bitince Küreye dön
    };

    window.addEventListener('cyber-loading-start', startLoading);
    window.addEventListener('cyber-loading-stop', stopLoading);

    // Particle System
    const particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      isSphere: boolean;
      
      // Hedef ve Mevcut Pozisyonlar (Morphing için)
      sphereAnglePhi: number;
      sphereAngleTheta: number;
      targetX: number = 0;
      targetY: number = 0;
      targetZ: number = 0;
      currentX: number = 0;
      currentY: number = 0;
      currentZ: number = 0;

      constructor(isSphere = false) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5; // Arka plan parçacıkları daha yavaş
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1.0;
        this.isSphere = isSphere;

        // Küre koordinatları (Rastgele başlangıç)
        this.sphereAnglePhi = Math.random() * Math.PI * 2;
        this.sphereAngleTheta = Math.random() * Math.PI;

        // 3D Pozisyonu başlat
        const r = sphereRadius;
        this.currentX = r * Math.sin(this.sphereAngleTheta) * Math.cos(this.sphereAnglePhi);
        this.currentY = r * Math.sin(this.sphereAngleTheta) * Math.sin(this.sphereAnglePhi);
        this.currentZ = r * Math.cos(this.sphereAngleTheta);
      }

      calculateTargetPosition() {
        const r = sphereRadius;

        // Dönüş Hızı
        const rotationSpeed = isLoading ? 0.04 : 0.005; // Yüklenirken hızlı dön
        this.sphereAnglePhi += rotationSpeed;
        this.sphereAngleTheta += 0.002;

        switch (currentShape) {
          case 'SPHERE':
            this.targetX = r * Math.sin(this.sphereAngleTheta) * Math.cos(this.sphereAnglePhi);
            this.targetY = r * Math.sin(this.sphereAngleTheta) * Math.sin(this.sphereAnglePhi);
            this.targetZ = r * Math.cos(this.sphereAngleTheta);
            break;

          case 'TORUS':
            const R = r * 0.8; // Büyük yarıçap
            const tubeR = r * 0.3; // Tüp yarıçapı
            // Torus Matematiği
            this.targetX = (R + tubeR * Math.cos(this.sphereAngleTheta * 3)) * Math.cos(this.sphereAnglePhi);
            this.targetY = (R + tubeR * Math.cos(this.sphereAngleTheta * 3)) * Math.sin(this.sphereAnglePhi);
            this.targetZ = tubeR * Math.sin(this.sphereAngleTheta * 3);
            break;

          case 'HOURGLASS':
            // Kum Saati (Double Cone) Matematiği
            const hgH = r * 2.0; // Yükseklik
            const hgW = r * 1.5; // Genişlik
            
            // Theta'yı yüksekliğe map et (-1 ile 1 arası)
            const yNorm = Math.cos(this.sphereAngleTheta); 
            this.targetY = yNorm * (hgH / 2);

            // Yarıçap yüksekliğe bağlı (belde ince, uçlarda geniş)
            // abs(yNorm) kullanarak kum saati şekli veriyoruz
            const hgR = Math.abs(yNorm) * hgW + 20; // +20 merkez çok ince olmasın diye

            this.targetX = hgR * Math.cos(this.sphereAnglePhi);
            this.targetZ = hgR * Math.sin(this.sphereAnglePhi);
            break;
        }
      }

      update() {
        if (this.isSphere) {
          // 1. Hedefi Hesapla
          this.calculateTargetPosition();

          // 2. Smooth Geçiş (Lerp)
          // Yüklenirken daha sert ve hızlı geçiş (0.1), normalde yumuşak (0.03)
          const lerpSpeed = isLoading ? 0.1 : 0.03;
          this.currentX += (this.targetX - this.currentX) * lerpSpeed;
          this.currentY += (this.targetY - this.currentY) * lerpSpeed;
          this.currentZ += (this.targetZ - this.currentZ) * lerpSpeed;

          // 3. Mouse Etkileşimi (CAZİBE / UZANMA EFEKTİ)
          let x3d = this.currentX;
          let y3d = this.currentY;
          let z3d = this.currentZ;

          const centerX = width / 2;
          const centerY = height / 2;
          const dx = mouseX - centerX;
          const dy = mouseY - centerY;

          // Mouse'a doğru genel eğilim
          const shiftX = dx * 0.05;
          const shiftY = dy * 0.05;

          // Manyetik Çekim (Bulge Effect)
          // Mouse'un olduğu yöne doğru noktaları kabartır
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          // Normalize vektörler
          const normDx = distToMouse > 0 ? dx / distToMouse : 0;
          const normDy = distToMouse > 0 ? dy / distToMouse : 0;

          // Nokta merkeze göre nerede?
          const distToCenter = Math.sqrt(x3d * x3d + y3d * y3d);
          const normPx = distToCenter > 0 ? x3d / distToCenter : 0;
          const normPy = distToCenter > 0 ? y3d / distToCenter : 0;

          // Mouse yönü ile nokta yönü eşleşiyor mu? (Dot Product)
          const alignment = normDx * normPx + normDy * normPy;

          if (alignment > 0.5 && !isLoading) { // Sadece yüklenmezken etkileşime gir
            // Hizalanan noktaları dışarı doğru çek
            const attractionStrength = 0.3; 
            const bulge = alignment * alignment * (distToMouse * attractionStrength);
            x3d += normDx * bulge;
            y3d += normDy * bulge;
          }

          // 4. 3D -> 2D Projeksiyon
          const perspective = 800;
          const safeZ = Math.min(z3d, perspective - 10); // Kameranın arkasına geçmesini engelle
          let scale = perspective / (perspective - safeZ);
          
          this.x = centerX + shiftX + x3d * scale;
          this.y = centerY + shiftY + y3d * scale;
          
          // Derinlik algısı için boyut ayarı
          this.size = Math.max(0.5, (z3d > 0 ? 2.5 : 1.5) * scale);

        } else {
          // ARKA PLAN PARÇACIKLARI (Floating Dust)
          this.x += this.vx;
          this.y += this.vy;

          // Ekrandan çıkarsa geri döndür
          if (this.x < 0) this.x = width;
          if (this.x > width) this.x = 0;
          if (this.y < 0) this.y = height;
          if (this.y > height) this.y = 0;
        }
      }

      draw() {
        if (!ctx || this.size <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // RENK AYARI: Neon Yeşil
        // Arkadaki parçacıklar daha soluk
        const alpha = this.isSphere ? 1 : 0.3;
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.fill();
      }
    }

    // --- BAŞLATMA ---
    // %60'ı Ana Şekil, %40'ı Arka Plan
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(i < particleCount * 0.6));
    }

    // FPS Limiting Logic
    let lastTime = 0;
    const fps = 30;
    const interval = 1000 / fps;

    function animate(timeStamp: number) {
      const deltaTime = timeStamp - lastTime;

      if (deltaTime > interval) {
        lastTime = timeStamp - (deltaTime % interval);

        if (!ctx) return;
        ctx.clearRect(0, 0, width, height); // Clear canvas first

        // Şekil Döngüsü Mantığı
        if (!isLoading) {
            shapeTimer++;
            if (shapeTimer > SHAPE_DURATION) {
            shapeTimer = 0;
            // Sadece SPHERE ve TORUS arasında geçiş yap
            currentShape = currentShape === 'SPHERE' ? 'TORUS' : 'SPHERE';
            }
        }

        // Çizim Ayarları
        ctx.lineWidth = 0.5; // İnce çizgiler

        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            p1.update();
            p1.draw();

            // --- BAĞLANTILAR (Lines) ---
            // Sadece ana şekli oluşturan noktaları bağla
            if (p1.isSphere) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    if (!p2.isSphere) continue;

                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Mesafe yakınsa çizgi çek
                    if (dist < connectionDistance) {
                        // Opaklık mesafeye göre azalsın
                        const alpha = 0.4 * (1 - dist / connectionDistance);
                        ctx.strokeStyle = `rgba(0, 255, 65, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
        }
      }

      animationId = requestAnimationFrame(animate);
    }
    
    animationId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    // Mouse Handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId); // Cleanup animation loop
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