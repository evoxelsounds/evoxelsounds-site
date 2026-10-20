/* ============================================================
   EVOXEL SOUNDS — accessibility tools
   Load in <head> (no defer) so saved settings apply before the
   page paints. Any element with [data-a11y-open] opens the panel.
   ============================================================ */
(function(){
  var KEY = 'evx-a11y', root = document.documentElement;
  var STATEMENT = (window.EVX_BASE || '') + 'accessibility.html';

  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  var state = load();

  function apply(){
    root.classList.remove('a11y-fs-1','a11y-fs-2','a11y-fs-3');
    if (state.fs) root.classList.add('a11y-fs-' + state.fs);
    ['contrast','links','font','still','cursor'].forEach(function(k){ root.classList.toggle('a11y-' + k, !!state[k]); });
  }
  apply();   // runs in <head>, before first paint

  var OPTS = [
    { k:'fs',       label:'Larger text',      icon:'<path d="M4 18 9 6l5 12M5.6 14h6.8M15 18l3-7 3 7M15.8 16h4.4"/>' },
    { k:'contrast', label:'High contrast',    icon:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>' },
    { k:'links',    label:'Highlight links',  icon:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>' },
    { k:'font',     label:'Readable font',    icon:'<path d="M5 20 11 4h2l6 16M7.5 14h9"/>' },
    { k:'still',    label:'Stop animations',  icon:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>' },
    { k:'cursor',   label:'Large cursor',     icon:'<path d="M5 3l14 9-6 1 3 7-3 1-3-7-5 4z"/>' }
  ];

  function build(){
    // skip links
    if (!document.querySelector('.a11y-skip')){
      var main = document.getElementById('main') || document.querySelector('main') || document.querySelector('section');
      if (main && !main.id) main.id = 'main';
      if (main){
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex','-1');
        var s1 = document.createElement('a'); s1.className = 'a11y-skip'; s1.href = '#' + main.id; s1.textContent = 'Skip to content';
        document.body.insertBefore(s1, document.body.firstChild);
      }
      var s2 = document.createElement('a'); s2.className = 'a11y-skip'; s2.href = '#'; s2.textContent = 'Accessibility options';
      s2.addEventListener('click', function(e){ e.preventDefault(); open(s2); });
      document.body.insertBefore(s2, (s1 || document.body.firstChild).nextSibling);
    }

    var panel = document.createElement('div');
    panel.className = 'a11y-panel'; panel.id = 'a11yPanel'; panel.hidden = true;
    panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','false'); panel.setAttribute('aria-labelledby','a11yTitle');
    var html = '<div class="a11y-head"><h2 id="a11yTitle">Accessibility</h2><button class="a11y-x" type="button" aria-label="Close accessibility options">&times;</button></div><div class="a11y-grid">';
    OPTS.forEach(function(o){
      html += '<button type="button" class="a11y-opt" data-k="' + o.k + '" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true">' + o.icon + '</svg>' + o.label + (o.k === 'fs' ? ' <small data-fs-label></small>' : '') + '</button>';
    });
    html += '</div><div class="a11y-foot"><button type="button" data-reset>Reset all</button><a href="' + STATEMENT + '">Accessibility statement</a></div>';
    panel.innerHTML = html;
    document.body.appendChild(panel);

    var opener = null;
    function sync(){
      panel.querySelectorAll('.a11y-opt').forEach(function(b){
        var k = b.getAttribute('data-k');
        b.setAttribute('aria-pressed', k === 'fs' ? String(!!state.fs) : String(!!state[k]));
      });
      var l = panel.querySelector('[data-fs-label]');
      l.textContent = state.fs ? ['','115%','125%','140%'][state.fs] : '100%';
    }
    function open(from){ opener = from || document.activeElement; panel.hidden = false; sync(); panel.querySelector('.a11y-opt').focus(); }
    function close(){ panel.hidden = true; if (opener && opener.focus) opener.focus(); }
    window.EVX_A11Y_OPEN = open;

    panel.addEventListener('click', function(e){
      var b = e.target.closest('.a11y-opt');
      if (b){
        var k = b.getAttribute('data-k');
        if (k === 'fs') state.fs = ((state.fs || 0) + 1) % 4;   // 100 → 115 → 125 → 140 → 100
        else state[k] = !state[k];
        save(state); apply(); sync();
        window.dispatchEvent(new Event('resize'));               // lets canvases (waveform) redraw
        return;
      }
      if (e.target.closest('[data-reset]')){ state = {}; save(state); apply(); sync(); window.dispatchEvent(new Event('resize')); return; }
      if (e.target.closest('.a11y-x')) close();
    });
    panel.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){ e.preventDefault(); close(); return; }
      if (e.key === 'Tab'){   // keep focus inside while open
        var f = panel.querySelectorAll('button,a[href]'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    });
    document.addEventListener('click', function(e){
      var t = e.target.closest('[data-a11y-open]');
      if (t){ e.preventDefault(); panel.hidden ? open(t) : close(); return; }
      if (!panel.hidden && !panel.contains(e.target)) close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
