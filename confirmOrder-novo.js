/* =========================================================
   URL do backend Vercel — troca pela URL real depois do deploy
   ========================================================= */
const BACKEND_URL = 'https://SEU-PROJETO.vercel.app/api/criar-pagamento';

/* =========================================================
   Confirmar pedido — Mercado Pago via Backend
   ========================================================= */
async function confirmOrder(){
  if(!cart.length){ alert('Sua sacola está vazia.'); return; }

  const name   =(el('ckName').value||'').trim();
  const phone  =(el('ckPhone').value||'').trim();
  const addr   =(el('ckAddr').value||'').trim();
  const num    =(el('ckNumero').value||'').trim();
  const cidade =(el('ckCidade').value||'').trim();

  if(!name||!phone){ alert('Preencha Nome e WhatsApp.'); return; }
  if(!addr||!num||!cidade){ alert('Preencha o endereço completo (rua, número e cidade).'); return; }

  const total   = parseBR(el('ckTotalLbl').textContent);
  const endereco= `${addr}, ${num} - ${cidade}`;

  // Pega o frete selecionado
  const shipOpt = document.querySelector('input[name="shipOpt"]:checked')?.value || 'PAC';
  const freteVal= parseBR(el('ckShipLbl')?.textContent || '0');

  // Nome e preço do primeiro produto do carrinho
  const item    = cart[0];
  const produto = cart.map(c => `${c.name} (${c.color} - ${c.size}) x${c.qty}`).join(' | ');
  const precoSemFrete = cart.reduce((s,c)=>s+(c.price||0)*(c.qty||0),0);

  // Registra na planilha e no perfil
  enviarParaPlanilha(name, phone, endereco, total);
  if(typeof registrarPedido==='function'){
    registrarPedido(cart.map(it=>({name:it.name,size:it.size,qty:it.qty})), fmtBR(total));
  }

  // Botão de loading
  const btn = el('pmAddBtn') || document.querySelector('.btn-primary[onclick*="confirmOrder"]');
  if(btn){ btn.disabled=true; btn.textContent='Aguarde...'; }

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto:    produto,
        preco:      precoSemFrete,
        frete:      freteVal,
        tipofrete:  shipOpt,
      })
    });

    const data = await response.json();

    if(data.link){
      closeCheckout();
      window.open(data.link, '_blank', 'noopener');
      showToast('Redirecionando para o Mercado Pago ✓');
    } else {
      alert('Erro ao gerar pagamento. Tente novamente.');
      console.error('Backend erro:', data);
    }
  } catch(err) {
    console.error('Erro na requisição:', err);
    alert('Erro de conexão. Verifique sua internet e tente novamente.');
  } finally {
    if(btn){ btn.disabled=false; btn.textContent='confirmar pedido'; }
  }
}
