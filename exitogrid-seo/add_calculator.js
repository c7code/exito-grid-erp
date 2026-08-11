const fs = require('fs');

const path = 'c:/Users/Carlos Mendes/Downloads/public_html (4)/exitosun/index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Add CSS
const css = `
/* ........... CALCULATOR MODAL ........... */
.calc-modal{position:fixed;inset:0;z-index:999;background:rgba(7,10,18,0.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all .35s ease}
.calc-modal.open{opacity:1;visibility:visible}
.calc-content{background:var(--bg2);border:1px solid var(--subtle);border-radius:24px;width:100%;max-width:540px;padding:40px;position:relative;transform:translateY(40px);transition:all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275)}
.calc-modal.open .calc-content{transform:translateY(0)}
.calc-close{position:absolute;top:20px;right:20px;background:none;border:none;color:var(--muted);cursor:pointer;padding:8px}
.calc-close:hover{color:var(--orange)}
.calc-header{text-align:center;margin-bottom:32px}
.calc-header h3{font-size:24px;font-weight:800;color:var(--text);margin-bottom:8px}
.calc-header h3 span{color:var(--orange)}
.calc-header p{font-size:14px;color:var(--muted)}
.calc-row{margin-bottom:20px}
.calc-row label{display:block;font-size:13px;font-weight:600;color:var(--muted);margin-bottom:8px}
.calc-input{width:100%;padding:14px 16px;background:var(--bg);border:1px solid var(--subtle);border-radius:12px;color:var(--text);font-family:var(--font);font-size:16px;outline:none;transition:border-color .2s}
.calc-input:focus{border-color:var(--orange)}
.calc-results{background:var(--bg);border-radius:16px;padding:24px;margin-top:32px;display:none}
.calc-results.show{display:block;animation:fadeIn .5s ease}
.res-item{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;margin-bottom:16px;border-bottom:1px dashed var(--subtle)}
.res-item:last-child{border-bottom:none;padding-bottom:0;margin-bottom:0}
.res-label{font-size:14px;color:var(--muted)}
.res-val{font-size:20px;font-weight:800;color:var(--orange)}
.res-val.large{font-size:28px}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
</style>
`;
if (!html.includes('calc-modal')) {
  html = html.replace('</style>', css);
}

// 2. Add Button in Header
if (!html.includes('openCalc()')) {
  html = html.replace('<a href="#contato" class="btn btn-p btn-sm">Solicitar Orçamento</a>', 
                      '<button onclick="openCalc()" class="btn btn-o btn-sm" style="margin-right:12px">Calculadora de Economia</button><a href="#contato" class="btn btn-p btn-sm">Solicitar Orçamento</a>');
  
  // Also add in mobile menu
  html = html.replace('<a href="#contato" class="btn btn-p" onclick="this.parentElement.classList.remove(\'open\')">Solicitar Orçamento</a>',
                      '<button onclick="openCalc(); document.getElementById(\'mobileMenu\').classList.remove(\'open\')" class="btn btn-o" style="margin-bottom:12px">Calculadora de Economia</button><a href="#contato" class="btn btn-p" onclick="this.parentElement.classList.remove(\'open\')">Solicitar Orçamento</a>');
}

// 3. Add Modal HTML before </body>
const modalHtml = `
<!-- ........... CALCULATOR MODAL ........... -->
<div class="calc-modal" id="calcModal">
  <div class="calc-content">
    <button class="calc-close" onclick="closeCalc()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <div class="calc-header">
      <h3>Simule sua <span>Economia</span></h3>
      <p>Descubra quanto você pode economizar com energia solar.</p>
    </div>
    <div class="calc-form">
      <div class="calc-row">
        <label>Valor médio da conta de luz (R$)</label>
        <input type="number" id="calcBill" class="calc-input" placeholder="Ex: 850" oninput="calculateSavings()">
      </div>
      <div class="calc-row">
        <label>Estado</label>
        <select id="calcState" class="calc-input" onchange="calculateSavings()">
          <option value="PE">Pernambuco (PE)</option>
          <option value="BA">Bahia (BA)</option>
          <option value="RN">Rio Grande do Norte (RN)</option>
          <option value="PB">Paraíba (PB)</option>
          <option value="AL">Alagoas (AL)</option>
          <option value="CE">Ceará (CE)</option>
          <option value="MA">Maranhão (MA)</option>
          <option value="PI">Piauí (PI)</option>
          <option value="SE">Sergipe (SE)</option>
        </select>
      </div>
      <button class="btn btn-p" style="width:100%;justify-content:center;margin-top:10px" onclick="calculateSavings()">Calcular Economia</button>
    </div>
    
    <div class="calc-results" id="calcResults">
      <div class="res-item">
        <div class="res-label">Economia Mensal Estimada</div>
        <div class="res-val" id="resMonthly">R$ 0,00</div>
      </div>
      <div class="res-item">
        <div class="res-label">Economia em 25 anos</div>
        <div class="res-val large" id="res25Years">R$ 0,00</div>
      </div>
      <div class="res-item">
        <div class="res-label">Tamanho do Sistema</div>
        <div class="res-val" style="color:var(--text)" id="resSize">0 kWp</div>
      </div>
      <div style="text-align:center;margin-top:24px">
        <a href="https://wa.me/5581988906429?text=Fiz%20uma%20simulação%20na%20calculadora%20e%20gostaria%20de%20um%20projeto." target="_blank" class="btn btn-o" style="width:100%;justify-content:center">Quero um orçamento preciso</a>
      </div>
    </div>
  </div>
</div>

<script>
function openCalc() {
  document.getElementById('calcModal').classList.add('open');
}
function closeCalc() {
  document.getElementById('calcModal').classList.remove('open');
}
// State data (average tariff R$/kWh and irradiation)
const stateData = {
  'PE': { tariff: 0.95, irrad: 5.2 },
  'BA': { tariff: 0.92, irrad: 5.4 },
  'RN': { tariff: 0.91, irrad: 5.6 },
  'PB': { tariff: 0.93, irrad: 5.5 },
  'AL': { tariff: 0.94, irrad: 5.3 },
  'CE': { tariff: 0.96, irrad: 5.7 },
  'MA': { tariff: 0.89, irrad: 5.1 },
  'PI': { tariff: 0.88, irrad: 5.5 },
  'SE': { tariff: 0.93, irrad: 5.2 }
};

function formatCurrency(val) {
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateSavings() {
  const billStr = document.getElementById('calcBill').value;
  if (!billStr || isNaN(billStr) || billStr <= 0) return;
  
  const bill = parseFloat(billStr);
  const stateCode = document.getElementById('calcState').value;
  const data = stateData[stateCode];
  
  // System calculations
  const monthlySavings = bill * 0.95; // 95% reduction
  // Energy inflation assumed 5% per year approx, for simplicity we just multiply by 12 * 25 * 1.5 multiplier or plain math
  const years25Savings = monthlySavings * 12 * 25 * 1.2; // 20% extra due to tariff inflation
  
  const consumption = bill / data.tariff;
  // Size = Consumption / (30 * irrad * 0.75 efficiency)
  const sizeKwp = consumption / (30 * data.irrad * 0.75);
  
  document.getElementById('resMonthly').innerText = formatCurrency(monthlySavings);
  document.getElementById('res25Years').innerText = formatCurrency(years25Savings);
  document.getElementById('resSize').innerText = sizeKwp.toFixed(1).replace('.', ',') + ' kWp';
  
  document.getElementById('calcResults').classList.add('show');
}
</script>
</body>`;
if (!html.includes('id="calcModal"')) {
  html = html.replace('</body>', modalHtml);
}

fs.writeFileSync(path, html, 'utf8');
console.log('Calculator added successfully.');
