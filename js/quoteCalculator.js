// =========================================================================
// QUOTE CALCULATOR MODULE
// Standalone calculator logic for the Trip Quote Calculator card.
// =========================================================================
(function initQuoteCalculator() {
  // Guard against double-init (e.g. script loaded or evaluated twice)
  if (window._quoteCalcReady) return;
  window._quoteCalcReady = true;

  const $ = (id) => document.getElementById(id);

  // ── DOM refs ──────────────────────────────────────────────────────────
  const els = {
    ldRate: $("quoteLDRate"),
    seasonalRate: $("quoteSeasonalRate"),
    deadMiles: $("quoteDeadMiles"),
    deadMilesRate: $("quoteDeadMilesRate"),
    reliefToggle: $("quoteReliefDriver"),
    halfDayToggle: $("quoteHalfDay"),
    ccFeeToggle: $("quoteCCFeeToggle"),
    totalDaysInput: $("quoteTotalDaysInput"),
    totalMilesInput: $("quoteTotalMilesInput"),
    // Summary
    totalMilesField: $("quoteTotalMiles"),
    totalDaysCount: $("quoteTotalDaysCount"),
    billedDaysCount: $("quoteBilledDaysCount"),
    freeDaysCount: $("quoteFreeDaysCount"),
    baseRateField: $("quoteBaseRate"),
    seasonalRateRow: $("quoteSeasonalRateRow"),
    seasonalRateVal: $("quoteSeasonalRateVal"),
    ccFeeVal: $("quoteCCFeeVal"),
    driver1Pay: $("quoteDriver1Pay"),
    driver2Row: $("quoteDriver2Row"),
    driver2Pay: $("quoteDriver2Pay"),
    // Discount
    discountValue: $("quoteDiscountValue"),
    discountType: $("quoteDiscountType"),
    discountRow: $("quoteDiscountRow"),
    discountAmount: $("quoteDiscountAmount"),
    finalTotal: $("quoteFinalTotal"),
    // Info Modal
    infoBtn: $("quoteInfoBtn"),
    infoModal: $("quoteInfoModal"),
    infoCloseBtn: $("quoteInfoCloseBtn"),
    infoBackdrop: $("quoteInfoBackdrop"),
    // Copy button
    copySummaryBtn: $("quoteCopySummary"),
  };

  // Bail if the calculator card isn't on the page
  if (!els.totalDaysInput || !els.totalMilesInput) return;

  // ── Info Modal Management ─────────────────────────────────────────────
  function openInfoModal() {
    if (els.infoModal) els.infoModal.hidden = false;
  }

  function closeInfoModal() {
    if (els.infoModal) els.infoModal.hidden = true;
  }

  if (els.infoBtn) els.infoBtn.addEventListener("click", openInfoModal);
  if (els.infoCloseBtn) els.infoCloseBtn.addEventListener("click", closeInfoModal);
  if (els.infoBackdrop) els.infoBackdrop.addEventListener("click", closeInfoModal);

  // ── Constants ─────────────────────────────────────────────────────────
  const LOCAL_DAILY_RATE = 1400;
  const LD_EXTRA_DAY = 950;
  const HALF_DAY_SURCHARGE = 475;
  const MILES_PER_FREE_DAY = 430; // every 430 miles earns 1 free day
  const MAX_DAYS = 30;

  // Driver pay rates (used for 2nd driver cost calculation)
  const DRIVER_RATE = 0.6; // per mile (≤1,000 mi)
  const DRIVER_RATE_OVER_1K = 0.5; // per mile (>1,000 mi, 2-driver trips)
  const DRIVER_EXTRA_DAY = 150; // per extra day for driver pay

  // ── Helpers ───────────────────────────────────────────────────────────
  function fmt(n) {
    if (!n || n === 0) return "";
    const isNegative = n < 0;
    const absN = Math.round(Math.abs(n)); // round to nearest dollar
    if (absN === 0) return "";
    const prefix = isNegative ? "-$" : "$";
    return (
      prefix +
      absN.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }

  // ── Calculation Engine ────────────────────────────────────────────────
  function recalcQuote() {
    const stdRate = parseFloat(els.ldRate.value) || 4.5;
    const seaRate = parseFloat(els.seasonalRate.value) || 0;
    const deadMiles = parseInt(els.deadMiles.value, 10) || 0;
    const deadMilesRate = parseFloat(els.deadMilesRate.value) || 3.80;
    const secondDriverOn = els.reliefToggle.value === "true";
    const halfDayOn = els.halfDayToggle.value === "true";
    const ccFeeOn = els.ccFeeToggle ? els.ccFeeToggle.value === "true" : false;
    const manualDiscountVal = parseFloat(els.discountValue.value) || 0;
    const manualDiscType = els.discountType.value;

    // Gather day miles
    const totalDays = parseInt(els.totalDaysInput.value, 10) || 1;
    let totalMiles = 0;
    for (let i = 1; i <= totalDays; i++) {
      const input = $(`quoteDay${i}`);
      if (input && input.value) {
        totalMiles += parseInt(input.value, 10) || 0;
      }
    }
    if (els.totalMilesInput) els.totalMilesInput.value = totalMiles;

    // Bus Earned Free Days (using the spreadsheet's exact FLOOR(miles/250) logic)
    const factor = Math.floor(totalMiles / 250);
    // Based on the SWITCH logic: 1->1, 2->1, 3->1.5, 4->2, 5->2.5 ...
    // Note: If factor is 0 (miles < 250), we default to 1 Free Day so Extra Days aren't aggressively
    // overcharged before the Local Daily Minimum overrides the quote.
    const busEarnedDays = factor < 3 ? 1 : factor / 2;
    const busExtraDays = Math.max(0, totalDays - busEarnedDays);

    // Driver Earned Free Days (straight 1 per 430 miles, whole numbers only)
    const driverEarnedDays = Math.floor(totalMiles / 430);
    const driverExtraDays = Math.max(0, totalDays - driverEarnedDays);

    // Common cost parts
    const localCostFloor = totalDays * LOCAL_DAILY_RATE;
    const driverRate = totalMiles > 1000 ? DRIVER_RATE_OVER_1K : DRIVER_RATE;

    const driver1Pay =
      totalMiles > 0 ? totalMiles * driverRate + driverExtraDays * DRIVER_EXTRA_DAY : 0;

    const driver2Surcharge =
      secondDriverOn && totalMiles > 0
        ? totalMiles * driverRate + driverExtraDays * DRIVER_EXTRA_DAY
        : 0;

    const halfDaySurcharge = halfDayOn ? HALF_DAY_SURCHARGE : 0;
    const totalSurcharges = driver2Surcharge + halfDaySurcharge;

    // Helper to calculate pure mileage/day cost
    function calculateBaseMileageCost(rate) {
      if (totalMiles === 0 && totalDays === 0 && busExtraDays === 0 && deadMiles === 0) return 0;
      const tripMiles = Math.max(0, totalMiles - deadMiles);
      const ldMileageBase = tripMiles * rate
        + deadMiles * deadMilesRate
        + busExtraDays * LD_EXTRA_DAY;
      return Math.max(ldMileageBase, localCostFloor);
    }

    // 1. Base Rates (excluding surcharges)
    const standardBaseCost = calculateBaseMileageCost(stdRate);

    // 2. Seasonal Discount
    let seasonalDiscount = 0;
    let seasonalBaseCost = 0;
    if (seaRate > 0 && seaRate < stdRate) {
      seasonalBaseCost = calculateBaseMileageCost(seaRate);
      seasonalDiscount = Math.max(0, standardBaseCost - seasonalBaseCost);
    }

    // 3. Subtotal before manual discount
    const subtotalBeforeManual = standardBaseCost + totalSurcharges;

    // 4. Manual Discount
    let manualDiscountAmount = 0;
    if (manualDiscountVal > 0) {
      if (manualDiscType === "percent") {
        manualDiscountAmount = subtotalBeforeManual * (manualDiscountVal / 100);
      } else {
        manualDiscountAmount = manualDiscountVal;
      }
    }

    // 5. Subtotal after all discounts
    const discountAmount = seasonalDiscount + manualDiscountAmount;
    const subtotalAfterDiscount = subtotalBeforeManual - discountAmount;

    // 6. Credit Card Fee (4% of subtotal after discounts)
    const ccFeeAmount = ccFeeOn ? subtotalAfterDiscount * 0.04 : 0;

    const finalQuote = subtotalAfterDiscount + ccFeeAmount;

    // ── Update UI ──
    if (els.totalMilesField) {
      els.totalMilesField.textContent = totalMiles ? totalMiles.toLocaleString() : "";
    }
    if (els.totalDaysCount) {
      els.totalDaysCount.textContent = totalDays > 0 ? totalDays : "";
    }
    if (els.billedDaysCount) {
      // Billed days are the base (1 day minimum) plus the "Extra Days" charged.
      // But it's clearer to just show the "Days" that directly cost something.
      // Actually, if a trip is 2 days, and has 1 free day, it's 1 billed, 1 free.
      // A trip is ALWAYS initially billed by the Day. So "Billed Days" = Total Days - Free Days
      // Which is exactly `busExtraDays` (plus any standard days implied by the Mileage base... wait).
      // Wait, let's keep it simple: Free Days = busEarnedDays. Billed = totalDays - busEarnedDays.
      els.billedDaysCount.textContent =
        totalDays > 0 ? totalDays - Math.min(busEarnedDays, totalDays) : "";
    }
    if (els.freeDaysCount) {
      els.freeDaysCount.textContent = totalDays > 0 ? Math.min(busEarnedDays, totalDays) : "";
    }
    if (els.baseRateField) {
      els.baseRateField.textContent = fmt(standardBaseCost);
    }
    if (els.seasonalRateVal) {
      els.seasonalRateVal.textContent = fmt(seasonalBaseCost);
    }
    if (els.ccFeeVal) {
      els.ccFeeVal.textContent = fmt(ccFeeAmount);
    }
    if (els.driver1Pay) {
      els.driver1Pay.textContent = driver1Pay > 0 ? `${fmt(driver1Pay)}` : "";
    }
    if (els.driver2Pay) {
      els.driver2Pay.textContent = fmt(driver2Surcharge);
    }

    // Discount UI
    if (els.discountAmount) {
      els.discountAmount.textContent = fmt(-discountAmount);
    }

    if (els.finalTotal) {
      els.finalTotal.textContent = fmt(finalQuote);
    }
  }

  // ── Copy Summary Logic ────────────────────────────────────────────────
  async function copySummary() {
    const btn = els.copySummaryBtn;
    if (!btn) return;

    // Grab raw values
    const miles = els.totalMilesField.textContent || "0";
    const total = els.finalTotal.textContent || "$0";
    
    // Check Driver 2 Pay
    const d2Text = els.driver2Pay.textContent || "";
    const d2Val = d2Text.replace(/[$,]/g, "");
    const hasD2 = parseFloat(d2Val) > 0;

    // Check Discount
    const discText = els.discountAmount.textContent || "";
    // discountAmount typically shows "-$VAL"
    const discVal = discText.replace(/[$,-]/g, "");
    const hasDisc = parseFloat(discVal) > 0;

    // Build parts
    let parts = [`${miles} mi`, total];
    if (hasD2) parts.push(`Dr2 ${d2Text}`);
    if (hasDisc) parts.push(`Dsc ${discText}`);

    const summaryText = parts.join(" | ");

    try {
      await navigator.clipboard.writeText(summaryText);
      
      // Visual feedback
      const originalHtml = btn.innerHTML;
      btn.classList.add("rux-btn--primary");
      btn.innerHTML = `<span class="material-symbols-outlined">check</span> <span>Copied!</span>`;
      
      setTimeout(() => {
        btn.classList.remove("rux-btn--primary");
        btn.innerHTML = originalHtml;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  // ── Dynamic Days Logic ────────────────────────────────────────────────
  function renderDynamicDays() {
    const totalDays = parseInt(els.totalDaysInput.value, 10) || 1;
    const container = $("quoteDynamicDaysContainer");
    if (!container) return;

    // Get current number of inputs
    const currentInputs = container.querySelectorAll('.day-mileage-input');
    const currentCount = currentInputs.length;

    // Create new inputs if needed
    for (let i = currentCount; i < totalDays; i++) {
      const dayNum = i + 1;
      const div = document.createElement('div');
      div.className = 'form-group';
      div.id = `quoteDayWrapper${dayNum}`;
      div.innerHTML = `
        <label for="quoteDay${dayNum}">Day ${dayNum} Mileage</label>
        <input type="text" id="quoteDay${dayNum}" class="quote-calculator__input day-mileage-input" value="0" inputmode="numeric" pattern="[0-9]*" />
      `;
      container.appendChild(div);

      // Add event listener to new input
      const input = div.querySelector('input');
      input.addEventListener('input', recalcQuote);
    }

    // Show/hide based on totalDays
    const maxCount = Math.max(currentCount, totalDays);
    for (let i = 1; i <= maxCount; i++) {
      const wrapper = $(`quoteDayWrapper${i}`);
      if (wrapper) {
        wrapper.style.display = i <= totalDays ? 'flex' : 'none';
      }
    }
  }

  // ── Event Wiring ──────────────────────────────────────────────────────
  els.ldRate.addEventListener("change", recalcQuote);
  els.seasonalRate.addEventListener("change", recalcQuote);
  els.deadMiles.addEventListener("input", recalcQuote);

  els.totalDaysInput.addEventListener("change", () => {
    renderDynamicDays();
    recalcQuote();
  });

  if (els.totalMilesInput) els.totalMilesInput.addEventListener("input", recalcQuote);

  els.reliefToggle.addEventListener("change", recalcQuote);
  els.halfDayToggle.addEventListener("change", recalcQuote);
  if (els.ccFeeToggle) els.ccFeeToggle.addEventListener("change", recalcQuote);

  els.discountValue.addEventListener("input", recalcQuote);
  els.discountType.addEventListener("change", recalcQuote);
  els.deadMilesRate.addEventListener("input", recalcQuote);

  if (els.copySummaryBtn) {
    els.copySummaryBtn.addEventListener("click", copySummary);
  }

  // ── Init ──────────────────────────────────────────────────────────────
  renderDynamicDays();
  recalcQuote();
})();
