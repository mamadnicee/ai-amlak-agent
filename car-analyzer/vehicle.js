/* =========================================================
   AI REAL ESTATE — VEHICLE INTELLIGENCE
   Motion Controller + NHTSA + CarQuery + Wikipedia
   ========================================================= */

(function () {
  'use strict';

  /* =====================================================
     LOADER
     ===================================================== */

  const loader = document.getElementById('loader');
  const loaderProgress = document.getElementById('loaderProgress');

  window.addEventListener('load', () => {
    if (loaderProgress) loaderProgress.style.width = '100%';
    setTimeout(() => {
      if (loader) loader.classList.add('hide');
    }, 800);
  });


  /* =====================================================
     NAVBAR — hide down, show on top / scroll up
     ===================================================== */

  const navbar = document.getElementById('navbar');
  let lastY = 0;
  let hidden = false;

  window.addEventListener('scroll', () => {
    const y = window.scrollY || window.pageYOffset;

    if (y < 40) {
      if (hidden) {
        navbar.classList.remove('nav-hidden');
        hidden = false;
      }
      lastY = y;
      return;
    }

    if (y > lastY + 6 && !hidden) {
      navbar.classList.add('nav-hidden');
      hidden = true;
    }

    if (y < lastY - 6 && hidden) {
      navbar.classList.remove('nav-hidden');
      hidden = false;
    }

    lastY = y;
  }, { passive: true });


  /* =====================================================
     REVEAL — same as property
     ===================================================== */

  const revealItems = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('reveal'));
  }


  /* =====================================================
     SIGNAL BARS
     ===================================================== */

  const signals = document.querySelectorAll('.signal');

  if (signals.length && 'IntersectionObserver' in window) {
    const sigIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          sigIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    signals.forEach((el) => sigIO.observe(el));
  }


  /* =====================================================
     API
     ===================================================== */

  const NHTSA = 'https://vpic.nhtsa.dot.gov/api/vehicles';


  /* =====================================================
     DOM
     ===================================================== */

  const brandSelect = document.getElementById('brandSelect');
  const yearSelect  = document.getElementById('yearSelect');
  const modelSelect = document.getElementById('modelSelect');
  const analyzeBtn  = document.getElementById('analyzeBtn');

  const carImage          = document.getElementById('carImage');
  const visualPlaceholder = document.getElementById('visualPlaceholder');
  const carTitle          = document.getElementById('carTitle');
  const carSub            = document.getElementById('carSub');

  const specMake   = document.getElementById('specMake');
  const specModel  = document.getElementById('specModel');
  const specYear   = document.getElementById('specYear');
  const specBody   = document.getElementById('specBody');
  const specEngine = document.getElementById('specEngine');
  const specPower  = document.getElementById('specPower');
  const specTorque = document.getElementById('specTorque');
  const specFuel   = document.getElementById('specFuel');


  /* =====================================================
     YEARS
     ===================================================== */

  const CURRENT_YEAR = new Date().getFullYear();

  for (let y = CURRENT_YEAR; y >= 1990; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }


  /* =====================================================
     BRANDS
     ===================================================== */

  async function loadBrands() {
    try {
      const res = await fetch(`${NHTSA}/GetMakesForVehicleType/car?format=json`);
      const data = await res.json();

      const brands = data.Results
        .map(b => b.MakeName)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();

      brandSelect.innerHTML = '<option value="">Select brand</option>';

      brands.forEach((b) => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        brandSelect.appendChild(opt);
      });

    } catch (e) {
      console.error('Brands error:', e);
      brandSelect.innerHTML = '<option value="">Brands unavailable</option>';
    }
  }


  /* =====================================================
     MODELS
     ===================================================== */

  async function loadModels(brand, year) {
    modelSelect.innerHTML = '<option value="">Loading models…</option>';
    modelSelect.disabled = true;

    try {
      const res = await fetch(
        `${NHTSA}/GetModelsForMakeYear/make/${encodeURIComponent(brand)}/modelyear/${year}?format=json`
      );
      const data = await res.json();

      const models = data.Results
        .map(m => m.Model_Name)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();

      modelSelect.innerHTML = '<option value="">Select model</option>';

      models.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.appendChild(opt);
      });

      modelSelect.disabled = false;

    } catch (e) {
      console.error('Models error:', e);
      modelSelect.innerHTML = '<option value="">Models unavailable</option>';
    }
  }


  /* =====================================================
     CarQuery — multi-proxy
     ===================================================== */

  async function carQueryFetch(query) {
    const target = 'https://www.carqueryapi.com/api/0.3/?' + query;

    const proxies = [
      'https://corsproxy.io/?url=' + encodeURIComponent(target),
      'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(target),
      'https://api.allorigins.win/get?url=' + encodeURIComponent(target)
    ];

    for (const url of proxies) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;

        const text = await res.text();
        let json;

        try {
          const wrapper = JSON.parse(text);
          json = wrapper.contents ? JSON.parse(wrapper.contents) : wrapper;
        } catch {
          continue;
        }

        if (json && json.Trims) return json;
      } catch {
        continue;
      }
    }

    return null;
  }


  /* =====================================================
     SPECS
     ===================================================== */

  async function fetchSpecs(brand, year, model) {
    const specs = {
      make: brand,
      model: model,
      year: year,
      body: '—',
      engine: '—',
      power: '—',
      torque: '—',
      fuel: '—'
    };

    /* NHTSA body */
    try {
      const res = await fetch(
        `${NHTSA}/GetModelsForMakeYear/make/${encodeURIComponent(brand)}/modelyear/${year}?format=json`
      );
      const data = await res.json();

      const found = data.Results.find(
        r => r.Model_Name.toLowerCase() === model.toLowerCase()
      );

      if (found && found.VehicleTypeName && found.VehicleTypeName.trim()) {
        specs.body = found.VehicleTypeName;
      }
    } catch {}

    /* CarQuery */
    const brandQ = brand.toLowerCase().replace(/\s+/g, '_');
    const modelQ = model.toLowerCase().replace(/\s+/g, '_');

    const cq = await carQueryFetch(
      `cmd=getTrims&make=${encodeURIComponent(brandQ)}&year=${year}&model=${encodeURIComponent(modelQ)}`
    );

    if (cq && cq.Trims && cq.Trims.length > 0) {
      const t = cq.Trims[0];

      if (t.model_engine_cc) {
        const cc = parseInt(t.model_engine_cc);
        if (cc > 0) specs.engine = (cc / 1000).toFixed(1) + 'L';
      }
      if (t.model_engine_cyl) {
        specs.engine = specs.engine === '—'
          ? t.model_engine_cyl + ' cyl'
          : specs.engine + ' · ' + t.model_engine_cyl + ' cyl';
      }
      if (t.model_engine_power_ps && parseFloat(t.model_engine_power_ps) > 0) {
        specs.power = Math.round(t.model_engine_power_ps) + ' hp';
      }
      if (t.model_engine_torque_nm && parseFloat(t.model_engine_torque_nm) > 0) {
        specs.torque = Math.round(t.model_engine_torque_nm) + ' Nm';
      }
      if (t.model_engine_fuel) {
        specs.fuel = t.model_engine_fuel;
      } else if (t.model_engine_type) {
        specs.fuel = t.model_engine_type;
      }
      if (t.model_body && specs.body === '—') {
        specs.body = t.model_body;
      }
    }

    return specs;
  }


  /* =====================================================
     IMAGE — Wikipedia
     ===================================================== */

  async function fetchWikipediaImage(brand, model) {
    try {
      const search = encodeURIComponent(`${brand} ${model}`);

      const direct =
        'https://en.wikipedia.org/w/api.php' +
        '?action=query&format=json&origin=*' +
        '&prop=pageimages&piprop=original&redirects=1' +
        '&titles=' + search;

      const r1 = await fetch(direct);
      const d1 = await r1.json();
      const p1 = Object.values(d1.query.pages)[0];

      if (p1 && p1.original && p1.original.source) {
        return p1.original.source;
      }

      const open =
        'https://en.wikipedia.org/w/api.php' +
        '?action=opensearch&format=json&origin=*' +
        '&search=' + search + '&limit=1';

      const r2 = await fetch(open);
      const d2 = await r2.json();

      if (d2[1] && d2[1].length) {
        const title = encodeURIComponent(d2[1][0]);

        const page =
          'https://en.wikipedia.org/w/api.php' +
          '?action=query&format=json&origin=*' +
          '&prop=pageimages&piprop=original' +
          '&titles=' + title;

        const r3 = await fetch(page);
        const d3 = await r3.json();
        const p3 = Object.values(d3.query.pages)[0];

        if (p3 && p3.original && p3.original.source) {
          return p3.original.source;
        }
      }

      return null;

    } catch (e) {
      console.error('Image error:', e);
      return null;
    }
  }


  /* =====================================================
     RENDER
     ===================================================== */

  async function renderResult(brand, year, model) {
    carTitle.textContent = `${brand} ${model}`;
    carSub.textContent = `${year} · Global specification`;

    const specs = await fetchSpecs(brand, year, model);

    specMake.textContent   = specs.make   || '—';
    specModel.textContent  = specs.model  || '—';
    specYear.textContent   = specs.year   || '—';
    specBody.textContent   = specs.body   || '—';
    specEngine.textContent = specs.engine || '—';
    specPower.textContent  = specs.power  || '—';
    specTorque.textContent = specs.torque || '—';
    specFuel.textContent   = specs.fuel   || '—';

    carImage.style.display = 'none';
    visualPlaceholder.style.display = 'flex';

    const img = await fetchWikipediaImage(brand, model);

    if (img) {
      carImage.onload = () => {
        carImage.style.display = 'block';
        visualPlaceholder.style.display = 'none';
      };
      carImage.src = img;
    }

    document.getElementById('result').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }


  /* =====================================================
     EVENTS
     ===================================================== */

  brandSelect.addEventListener('change', () => {
    const brand = brandSelect.value;
    const year  = yearSelect.value;

    modelSelect.innerHTML = '<option value="">Select brand & year</option>';
    modelSelect.disabled = true;
    analyzeBtn.disabled = true;

    if (brand && year) loadModels(brand, year);
  });

  yearSelect.addEventListener('change', () => {
    const brand = brandSelect.value;
    const year  = yearSelect.value;

    modelSelect.innerHTML = '<option value="">Select brand & year</option>';
    modelSelect.disabled = true;
    analyzeBtn.disabled = true;

    if (brand && year) loadModels(brand, year);
  });

  modelSelect.addEventListener('change', () => {
    analyzeBtn.disabled = !modelSelect.value;
  });

  analyzeBtn.addEventListener('click', async () => {
    const brand = brandSelect.value;
    const year  = yearSelect.value;
    const model = modelSelect.value;

    if (!brand || !year || !model) return;

    analyzeBtn.disabled = true;
    analyzeBtn.querySelector('span').textContent = 'Analyzing…';

    await renderResult(brand, year, model);

    analyzeBtn.disabled = false;
    analyzeBtn.querySelector('span').textContent = 'Analyze vehicle';
  });


  /* =====================================================
     INIT
     ===================================================== */

  loadBrands();

})();
