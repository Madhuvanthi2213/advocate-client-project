(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  // Mobile navigation
  const menuToggle = $('#menuToggle');
  const nav = $('#nav');
  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  // Subtle reveal animation
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(el => observer.observe(el));
  } else revealItems.forEach(el => el.classList.add('visible'));

  // Prefill the booking service from practice-area links.
  $$('.card-link[data-service]').forEach(link => link.addEventListener('click', () => {
    const service = $('select[name="service"]');
    if (service) service.value = link.dataset.service;
  }));

  $('#year').textContent = new Date().getFullYear();

  // Booking form posts to PHP. Static preview fallback gives a clear local setup message.
  const form = $('#bookingForm');
  const status = $('#formStatus');
  const submitButton = $('.submit-button', form);

  // "Request sent" confirmation card.
  const successBox = $('#bookingSuccess');
  function showBookingSuccess(name) {
    if (!successBox) {
      status.classList.add('success');
      status.textContent = 'Request sent. We will contact you shortly.';
      return;
    }
    $('#bsName').textContent = (name || 'there').split(' ')[0];
    form.hidden = true;
    successBox.hidden = false;
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  $('#bsAnother')?.addEventListener('click', () => {
    successBox.hidden = true; form.hidden = false; status.className = 'form-status'; status.textContent = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    if (!form.reportValidity()) return;

    const date = form.elements.preferred_date.value;
    const today = new Date();
    today.setHours(0,0,0,0);
    if (new Date(`${date}T00:00:00`) < today) {
      status.classList.add('error');
      status.textContent = 'Please choose today or a future date.';
      return;
    }
    const original = $('.submit-label', submitButton).textContent;
    $('.submit-label', submitButton).textContent = 'Sending request…';
    submitButton.disabled = true;
    try {
      const response = await fetch('api/bookings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to submit the request.');
      const bookedName = form.elements.full_name.value.trim();
      form.reset();
      showBookingSuccess(bookedName);
    } catch (error) {
      status.classList.add('error');
      status.textContent = error.message === 'Failed to fetch'
        ? 'Could not connect to the PHP backend. Open this site through XAMPP (http://localhost/advocate-3d-portfolio/), not by double-clicking index.html.'
        : (error.message || 'Something went wrong. Please try again.');
    } finally {
      $('.submit-label', submitButton).textContent = original;
      submitButton.disabled = false;
    }
  });

  // Contact details. Fill these in with verified information; empty values show a neutral fallback.
  const CONTACT = { address: '', phone: '+91 97894 59599', email: 'priyankaladvocate@gmail.com', hours: '', whatsapp: '919789459599', instagram: '' }; // instagram: username or full profile URL
  $$('[data-contact]').forEach(el => {
    const key = el.dataset.contact, val = (CONTACT[key] || '').trim();
    if (key === 'phone') { if (val) { el.href = 'tel:' + val.replace(/[^+\d]/g, ''); el.textContent = val; } else { el.removeAttribute('href'); el.classList.add('is-empty'); } }
    else if (key === 'email') { if (val) { el.href = 'mailto:' + val; el.textContent = val; } else { el.removeAttribute('href'); el.classList.add('is-empty'); } }
    else if (key === 'whatsapp') { el.href = val ? 'https://wa.me/' + val.replace(/\D/g, '') : el.dataset.empty; }
    else if (val) el.textContent = val; else if (key === 'address') el.classList.add('is-empty');
  });
  $$('[data-social="instagram"]').forEach(el => {
    const v = (CONTACT.instagram || '').trim();
    if (v) { el.href = /^https?:/i.test(v) ? v : 'https://www.instagram.com/' + v.replace(/^@/, '').replace(/\/$/, '') + '/'; }
    else { el.removeAttribute('href'); el.removeAttribute('target'); el.title = 'Instagram ID coming soon'; el.classList.add('is-empty'); }
  });
  if (CONTACT.address) { const f = $('#mapFrame'); if (f) f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(CONTACT.address) + '&output=embed'; }


  // Hero video: muted autoplay loop, sound toggle, pauses when off-screen.
  const hv = $('#heroVideo'), sb = $('#soundBtn');
  if (hv) {
    const tryPlay = () => { const p = hv.play(); if (p && p.catch) p.catch(() => {}); };
    tryPlay();
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => en.isIntersecting ? tryPlay() : hv.pause()), { threshold: .15 }).observe(hv);
    sb?.addEventListener('click', () => {
      hv.muted = !hv.muted; tryPlay();
      sb.setAttribute('aria-pressed', String(!hv.muted));
      sb.setAttribute('aria-label', hv.muted ? 'Turn sound on' : 'Turn sound off');
      sb.classList.toggle('on', !hv.muted);
    });
  }
})();
