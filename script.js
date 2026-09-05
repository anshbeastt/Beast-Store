(function () {
  const FRAME_COUNT = 238;
  const canvas = document.getElementById("animation-canvas");
  const ctx = canvas.getContext("2d");
  const loader = document.getElementById("loader");
  const loadPercentage = document.getElementById("load-percentage");
  const progressBar = document.getElementById("progress-bar");
  const scrollHint = document.getElementById("scroll-hint");
  const animSection = document.getElementById("animation-section");

  const images = [];
  let loadedCount = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawnFrame = -1;
  let isInitialFrameDrawn = false;

  // Generate frame path
  function getFramePath(index) {
    const padIndex = String(index + 1).padStart(3, "0");
    return `frames/ezgif-frame-${padIndex}.png`;
  }

  // High-DPI canvas resize handling
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.scale(dpr, dpr);

    // Force redraw on resize
    lastDrawnFrame = -1;
    drawFrame(Math.round(currentFrame));
  }

  // Draw specific frame preserving aspect ratio (contain)
  function drawFrame(frameIndex) {
    const img = images[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    // Calculate aspect ratios for contain fit
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const screenAspect = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (screenAspect > imgAspect) {
      // Screen is wider than image
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Screen is taller than image
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imgAspect;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    lastDrawnFrame = frameIndex;
  }

  // Preload all frames
  function preloadImages() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFramePath(i);

      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / FRAME_COUNT) * 100);
        if (loadPercentage) loadPercentage.textContent = percent;
        if (progressBar) progressBar.style.width = `${percent}%`;

        // Render first frame immediately once it is available
        if (i === 0 && !isInitialFrameDrawn) {
          isInitialFrameDrawn = true;
          drawFrame(0);
        }

        // When all images are loaded, hide loader
        if (loadedCount === FRAME_COUNT) {
          setTimeout(() => {
            if (loader) loader.classList.add("hidden");
          }, 300);
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT && loader) {
          loader.classList.add("hidden");
        }
      };

      images.push(img);
    }
  }

  // Update target frame based on scroll position inside the animation section
  function updateScroll() {
    if (!animSection) return;

    const rect = animSection.getBoundingClientRect();
    const totalScrollableDistance = animSection.offsetHeight - window.innerHeight;
    const currentScrollInSticky = -rect.top;

    if (window.scrollY > 20) {
      if (scrollHint) scrollHint.classList.add("fade-out");
    } else {
      if (scrollHint) scrollHint.classList.remove("fade-out");
    }

    if (totalScrollableDistance <= 0) {
      targetFrame = 0;
    } else {
      const progress = Math.min(1, Math.max(0, currentScrollInSticky / totalScrollableDistance));
      targetFrame = progress * (FRAME_COUNT - 1);
    }
  }

  // Smooth animation loop using lerp
  function renderLoop() {
    // Lerp towards target frame for smooth inertia
    currentFrame += (targetFrame - currentFrame) * 0.18;

    const roundedFrame = Math.round(currentFrame);
    const clampedFrame = Math.min(FRAME_COUNT - 1, Math.max(0, roundedFrame));

    if (clampedFrame !== lastDrawnFrame) {
      drawFrame(clampedFrame);
    }

    requestAnimationFrame(renderLoop);
  }

  // Event Listeners
  window.addEventListener("resize", () => {
    resizeCanvas();
    updateScroll();
  });
  window.addEventListener("scroll", updateScroll, { passive: true });

  // Initialize
  resizeCanvas();
  preloadImages();
  updateScroll();
  renderLoop();
})();
