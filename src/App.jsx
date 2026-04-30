import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const CAT_E = ["Honorários","Êxito/Acordo","Consultoria","Antecipação","Outras Receitas"];
const CAT_S = ["Aluguel","Salários","Impostos/OAB","Marketing","Tecnologia","Deslocamento","Tarifas","Outras Despesas"];
const CONTAS = ["Caixa","Banco do Brasil","Caixa Econômica","Bradesco","Itaú","Santander","Nubank","Sicoob","Sicredi","Outro"];
const M = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const fmt = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const fmtD = (s) => s ? new Date(s+"T12:00:00").toLocaleDateString("pt-BR") : "—";
const today = () => new Date().toISOString().split("T")[0];
const newP = (id) => ({ id, valor:"", dataVenc:today(), dataBaixa:"", status:"pendente" });
const emptyForm = () => ({
  tipo:"entrada", cliente:"", processo:"", parceria:"",
  categoria:CAT_E[0], descricao:"", formaPag:"avista",
  contaBancaria:"Bradesco", parcelas:[ newP(Date.now()) ]
});

const STORAGE_KEY = "fjur-data-v1";
const SENHA_CORRETA = "Espanha2026@";
const AUTH_KEY = "fjur-auth-v1";

// Componente de tela de login
function TelaLogin({ onSucesso }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [tentativas, setTentativas] = useState(0);

  const verificar = () => {
    if (senha === SENHA_CORRETA) {
      sessionStorage.setItem(AUTH_KEY, "true");
      onSucesso();
    } else {
      setErro(true);
      setTentativas(t => t + 1);
      setTimeout(() => setErro(false), 600);
      setSenha("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc", color: "#1e293b",
      fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        .shake { animation: shake .4s }
        .login-inp { background:#fff; border:1.5px solid #e2e8f0; color:#1e293b; padding:13px 14px; border-radius:10px; font-size:14px; width:100%; font-family:inherit; outline:none; transition:border-color .2s, box-shadow .2s }
        .login-inp:focus { border-color:#10b981; box-shadow:0 0 0 3px #10b98120 }
        .login-btn { background:#10b981; border:none; color:#fff; padding:13px; border-radius:10px; cursor:pointer; font-weight:600; font-size:14px; width:100%; font-family:inherit; transition:background .2s, transform .1s }
        .login-btn:hover { background:#059669 }
        .login-btn:active { transform:scale(.98) }
      `}</style>
      <div className={erro ? "shake" : ""} style={{
        background: "#ffffff", border: `1.5px solid ${erro ? "#f43f5e" : "#e2e8f0"}`,
        borderRadius: 16, padding: 36, maxWidth: 400, width: "100%",
        boxShadow: "0 10px 40px #0f172a15", textAlign: "center"
      }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>⚖️</div>
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 6, color: "#0f172a" }}>Financeiro Jurídico</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>Acesso restrito — informe sua senha</div>

        <input
          type="password"
          className="login-inp"
          placeholder="Digite sua senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === "Enter" && verificar()}
          autoFocus
          style={{ marginBottom: 14, textAlign: "center", letterSpacing: 2 }}
        />

        {erro && (
          <div style={{ color: "#f43f5e", fontSize: 12, marginBottom: 14, fontWeight: 500 }}>
            ⚠️ Senha incorreta{tentativas >= 3 ? " — tente novamente com calma" : ""}
          </div>
        )}

        <button className="login-btn" onClick={verificar}>🔓 Entrar</button>

        <div style={{ marginTop: 22, fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
          🛡️ Sistema protegido<br/>
          Esqueceu a senha? Entre em contato com a administradora.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  useEffect(() => {
    // Verifica se já está autenticado nesta sessão
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth === "true") setAutenticado(true);
    setVerificandoAuth(false);
  }, []);

  if (verificandoAuth) return <div style={{minHeight:"100vh",background:"#f8fafc"}}/>;
  if (!autenticado) return <TelaLogin onSucesso={() => setAutenticado(true)} />;

  return <AppProtegido onLogout={() => { sessionStorage.removeItem(AUTH_KEY); setAutenticado(false); }} />;
}

function AppProtegido({ onLogout }) {
  const [data, setData] = useState([]);
  const [view, setView] = useState("dashboard");
  const [m, setM] = useState(new Date().getMonth());
  const [y, setY] = useState(new Date().getFullYear());
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [fSit, setFSit] = useState("todos");
  const [fTipo, setFTipo] = useState("todos");
  const [fConta, setFConta] = useState("todas");
  const [fBusca, setFBusca] = useState("");
  const [baixaModal, setBaixaModal] = useState(null);

  // Carregar do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (e) { console.error(e); }
    setLoaded(true);
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error(e); }
  }, [data, loaded]);

  const tst = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),2600); };

  const flat = (mm, yy) => {
    const r = [];
    data.forEach(l => l.parcelas.forEach(p => {
      const d = new Date((p.status==="baixado" ? p.dataBaixa : p.dataVenc)+"T12:00:00");
      if (d.getMonth()===mm && d.getFullYear()===yy)
        r.push({...p, lid:l.id, tipo:l.tipo, cliente:l.cliente, processo:l.processo,
          parceria:l.parceria, categoria:l.categoria, descricao:l.descricao,
          contaBancaria:l.contaBancaria, formaPag:l.formaPag, nParcs:l.parcelas.length});
    }));
    return r;
  };

  const dadosMes = flat(m, y);
  const recebido = dadosMes.filter(p=>p.tipo==="entrada"&&p.status==="baixado").reduce((s,p)=>s+p.valor,0);
  const pago = dadosMes.filter(p=>p.tipo==="saida"&&p.status==="baixado").reduce((s,p)=>s+p.valor,0);
  const aReceber = dadosMes.filter(p=>p.tipo==="entrada"&&p.status==="pendente").reduce((s,p)=>s+p.valor,0);
  const aPagar = dadosMes.filter(p=>p.tipo==="saida"&&p.status==="pendente").reduce((s,p)=>s+p.valor,0);
  const saldoReal = recebido - pago;

  const filtrado = dadosMes.filter(p => {
    if (fTipo!=="todos" && p.tipo!==fTipo) return false;
    if (fSit==="aReceber" && !(p.tipo==="entrada"&&p.status==="pendente")) return false;
    if (fSit==="recebidos" && !(p.tipo==="entrada"&&p.status==="baixado")) return false;
    if (fSit==="aPagar" && !(p.tipo==="saida"&&p.status==="pendente")) return false;
    if (fSit==="pagos" && !(p.tipo==="saida"&&p.status==="baixado")) return false;
    if (fSit==="pendentes" && p.status!=="pendente") return false;
    if (fSit==="baixados" && p.status!=="baixado") return false;
    if (fConta!=="todas" && p.contaBancaria!==fConta) return false;
    if (fBusca && ![p.cliente,p.processo,p.parceria,p.descricao].some(x=>x?.toLowerCase().includes(fBusca.toLowerCase()))) return false;
    return true;
  }).sort((a,b)=>{
    const da = new Date((a.status==="baixado"?a.dataBaixa:a.dataVenc));
    const db = new Date((b.status==="baixado"?b.dataBaixa:b.dataVenc));
    return db - da;
  });

  const hist = Array.from({length:6},(_,i)=>{
    let mm=m-i, yy=y; if(mm<0){mm+=12;yy--;}
    const ps = flat(mm,yy);
    return { label:M[mm].slice(0,3)+"/"+String(yy).slice(2),
      r:ps.filter(p=>p.tipo==="entrada"&&p.status==="baixado").reduce((s,p)=>s+p.valor,0),
      pg:ps.filter(p=>p.tipo==="saida"&&p.status==="baixado").reduce((s,p)=>s+p.valor,0) };
  }).reverse();
  const maxBar = Math.max(...hist.flatMap(h=>[h.r,h.pg]),1);

  const setF = (k,v) => setForm(prev=>{ const u={...prev,[k]:v}; if(k==="tipo") u.categoria=v==="entrada"?CAT_E[0]:CAT_S[0]; return u; });
  const addP = () => setForm(p=>({...p, parcelas:[...p.parcelas, newP(Date.now())]}));
  const remP = (id) => setForm(p=>({...p, parcelas:p.parcelas.filter(x=>x.id!==id)}));
  const updP = (id,k,v) => setForm(p=>({...p, parcelas:p.parcelas.map(x=>x.id===id?{...x,[k]:v}:x)}));

  const submit = () => {
    if (!form.cliente.trim()) { tst("Informe o cliente / fornecedor.","err"); return; }
    const ps = form.parcelas.filter(p=>parseFloat(String(p.valor).replace(",","."))>0);
    if (!ps.length) { tst("Informe ao menos um valor.","err"); return; }
    const lanc = {
      id:editId||Date.now(), ...form,
      parcelas:ps.map((p,i)=>({...p, numero:i+1, valor:parseFloat(String(p.valor).replace(",","."))}))
    };
    if (editId) { setData(prev=>prev.map(l=>l.id===editId?lanc:l)); tst("Atualizado!"); }
    else { setData(prev=>[...prev,lanc]); tst("Lançamento salvo!"); }
    setForm(emptyForm()); setEditId(null); setView("extrato");
  };

  const editar = (lid) => {
    const l=data.find(x=>x.id===lid); if(!l) return;
    setForm({...l, parcelas:l.parcelas.map(p=>({...p, valor:String(p.valor)}))});
    setEditId(l.id); setView("lancamento");
  };

  const excluir = (lid) => { if(confirm("Excluir este lançamento e todas as parcelas?")) { setData(prev=>prev.filter(l=>l.id!==lid)); tst("Excluído.","err"); } };

  const baixar = (lid, pid, dataBaixa, conta) => {
    setData(prev=>prev.map(l=>{
      if(l.id!==lid) return l;
      return {...l, contaBancaria: conta||l.contaBancaria,
        parcelas:l.parcelas.map(p=>p.id===pid ? {...p, status:"baixado", dataBaixa} : p)};
    }));
    tst("Baixa registrada!");
    setBaixaModal(null);
  };

  const estornar = (lid, pid) => {
    setData(prev=>prev.map(l=>l.id!==lid?l:{...l, parcelas:l.parcelas.map(p=>p.id===pid?{...p,status:"pendente",dataBaixa:""}:p)}));
    tst("Estornado.","err");
  };

  // BACKUP / RESTORE
  const exportarBackup = () => {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Backup_Financeiro_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    tst("Backup baixado!");
  };

  const importarBackup = (e) => {
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const novo = JSON.parse(ev.target.result);
        if (!Array.isArray(novo)) throw new Error("Formato inválido");
        if (confirm(`Restaurar backup com ${novo.length} lançamentos? Os dados atuais serão substituídos.`)) {
          setData(novo); tst("Backup restaurado!");
        }
      } catch (err) { tst("Arquivo de backup inválido.","err"); }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const expExcel = () => {
    const rows = filtrado.map(p=>({
      "Tipo": p.tipo==="entrada"?"Entrada":"Saída",
      "Situação": p.status==="baixado" ? (p.tipo==="entrada"?"Recebido":"Pago") : (p.tipo==="entrada"?"A Receber":"A Pagar"),
      "Cliente/Fornecedor": p.cliente,
      "Nº Processo": p.processo||"",
      "Parceria": p.parceria||"",
      "Categoria": p.categoria,
      "Descrição": p.descricao||"",
      "Forma": p.formaPag==="avista"?"À Vista":`Parcelado (${p.nParcs}x)`,
      "Parcela": p.nParcs>1?`${p.numero}/${p.nParcs}`:"-",
      "Conta Bancária": p.contaBancaria,
      "Vencimento": fmtD(p.dataVenc),
      "Data Baixa": fmtD(p.dataBaixa),
      "Valor (R$)": p.valor,
    }));
    const resumo = [
      ["RELATÓRIO FINANCEIRO", `${M[m]} ${y}`],[],
      ["Recebido", recebido],["Pago", pago],["Saldo Realizado", recebido-pago],
      [],["A Receber (pendente)", aReceber],["A Pagar (pendente)", aPagar],
      ["Saldo Previsto", (recebido+aReceber)-(pago+aPagar)],
    ];
    const wb=XLSX.utils.book_new();
    const ws1=XLSX.utils.aoa_to_sheet(resumo); ws1["!cols"]=[{wch:24},{wch:18}];
    XLSX.utils.book_append_sheet(wb,ws1,"Resumo");
    const ws2=XLSX.utils.json_to_sheet(rows);
    ws2["!cols"]=Object.keys(rows[0]||{}).map(k=>({wch:Math.max(k.length+2,16)}));
    XLSX.utils.book_append_sheet(wb,ws2,`${M[m]} ${y}`);
    XLSX.writeFile(wb,`Financeiro_${M[m]}_${y}.xlsx`);
    tst("Excel exportado!");
  };

  const expPDF = () => {
    const linhas = filtrado.map(p=>{
      const sitLabel = p.status==="baixado" ? (p.tipo==="entrada"?"Recebido":"Pago") : (p.tipo==="entrada"?"A Receber":"A Pagar");
      const sitClass = p.status==="baixado" ? "tg" : (p.tipo==="entrada"?"ty":"to");
      return `<tr>
        <td><span class="${p.tipo==="entrada"?"te":"ts"}">${p.tipo==="entrada"?"Entrada":"Saída"}</span></td>
        <td><span class="${sitClass}">${sitLabel}</span></td>
        <td><b>${p.cliente}</b>${p.parceria?`<br><small>🤝 ${p.parceria}</small>`:""}</td>
        <td>${p.processo||"—"}</td>
        <td>${p.categoria}</td>
        <td style="text-align:center">${p.nParcs>1?`${p.numero}/${p.nParcs}`:"—"}</td>
        <td>${p.contaBancaria}</td>
        <td>${fmtD(p.dataVenc)}</td>
        <td>${fmtD(p.dataBaixa)}</td>
        <td style="text-align:right;font-weight:700;color:${p.tipo==="entrada"?"#166534":"#991b1b"}">${fmt(p.valor)}</td>
      </tr>`;
    }).join("");
    const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ${M[m]} ${y}</title>
    <style>body{font-family:Arial,sans-serif;font-size:10px;color:#111;padding:18px}
    h1{font-size:17px;color:#1e3a5f;margin:0 0 2px}
    .sh{color:#555;font-size:11px;margin-bottom:18px}
    .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
    .card{border:1px solid #ddd;border-radius:6px;padding:10px}
    .cl{font-size:9px;color:#777;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
    .cv{font-size:14px;font-weight:700}
    table{width:100%;border-collapse:collapse}
    th{background:#1e3a5f;color:#fff;padding:7px 5px;text-align:left;font-size:9px}
    td{padding:5px;border-bottom:1px solid #eee;vertical-align:middle}
    tr:nth-child(even) td{background:#f8fafc}
    .te,.tg{background:#dcfce7;color:#166534;padding:2px 7px;border-radius:10px;font-size:8px;font-weight:700;white-space:nowrap}
    .ts,.to{background:#fee2e2;color:#991b1b;padding:2px 7px;border-radius:10px;font-size:8px;font-weight:700;white-space:nowrap}
    .ty{background:#fef3c7;color:#92400e;padding:2px 7px;border-radius:10px;font-size:8px;font-weight:700;white-space:nowrap}
    small{color:#888;font-size:8px}
    .ft{margin-top:18px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px}
    @media print{@page{margin:10mm;size:A4 landscape}}</style></head><body>
    <h1>⚖️ Relatório Financeiro Jurídico</h1>
    <div class="sh">${M[m]} ${y} • ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")} • ${filtrado.length} lançamento(s)</div>
    <div class="cards">
      <div class="card"><div class="cl">Recebido</div><div class="cv" style="color:#166534">${fmt(recebido)}</div></div>
      <div class="card"><div class="cl">Pago</div><div class="cv" style="color:#991b1b">${fmt(pago)}</div></div>
      <div class="card"><div class="cl">A Receber</div><div class="cv" style="color:#92400e">${fmt(aReceber)}</div></div>
      <div class="card"><div class="cl">A Pagar</div><div class="cv" style="color:#92400e">${fmt(aPagar)}</div></div>
    </div>
    <div style="margin-bottom:14px;font-size:11px"><b>Saldo Realizado:</b> <span style="color:${saldoReal>=0?"#166534":"#991b1b"};font-weight:700">${fmt(saldoReal)}</span></div>
    <table><thead><tr><th>Tipo</th><th>Situação</th><th>Cliente/Fornecedor</th><th>Processo</th><th>Categoria</th><th>Parc.</th><th>Conta</th><th>Vencimento</th><th>Baixa</th><th>Valor</th></tr></thead>
    <tbody>${linhas}</tbody></table>
    <div class="ft">Gerado pelo Sistema Financeiro Jurídico</div></body></html>`;
    const w=window.open("","_blank","width=1100,height=700");
    w.document.write(html); w.document.close(); setTimeout(()=>w.print(),600);
    tst("PDF gerado!");
  };

  const cats = form.tipo==="entrada" ? CAT_E : CAT_S;
  const allClientes = [...new Set(data.map(l=>l.cliente).filter(Boolean))];

  const S = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box}
    ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#94a3b8}
    input,select{outline:none}
    .inp{background:#fff;border:1.5px solid #e2e8f0;color:#1e293b;padding:9px 12px;border-radius:8px;font-size:13px;width:100%;font-family:inherit;transition:border-color .2s, box-shadow .2s}
    .inp:focus{border-color:#10b981;box-shadow:0 0 0 3px #10b98115}
    .inp::placeholder{color:#94a3b8}
    .inp:disabled{background:#f8fafc;color:#94a3b8}
    .card{background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 1px 3px #0f172a08}
    .lbl{font-size:11px;color:#64748b;margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:.3px}
    .btn-p{background:#10b981;border:none;color:#fff;padding:10px 22px;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;font-family:inherit;transition:background .2s, transform .1s}
    .btn-p:hover{background:#059669}
    .btn-p:active{transform:scale(.98)}
    .btn-g{background:#fff;border:1.5px solid #e2e8f0;color:#475569;padding:7px 13px;border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;transition:all .2s;font-weight:500}
    .btn-g:hover{border-color:#10b981;color:#10b981;background:#f0fdf4}
    .btn-g:disabled{opacity:.4;cursor:not-allowed}
    .btn-g.act{border-color:#10b981;color:#10b981;background:#f0fdf4;font-weight:600}
    .btn-d{background:#fff;border:1.5px solid #fecdd3;color:#f43f5e;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;font-weight:500;transition:all .2s}
    .btn-d:hover{background:#fff1f2;border-color:#f43f5e}
    .btn-ed{background:#fff;border:1.5px solid #e2e8f0;color:#64748b;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;font-weight:500;transition:all .2s}
    .btn-ed:hover{border-color:#3b82f6;color:#3b82f6;background:#eff6ff}
    .btn-baixa{background:#10b981;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;transition:background .2s}
    .btn-baixa:hover{background:#059669}
    .nav-b{background:transparent;border:none;color:#64748b;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;font-family:inherit;white-space:nowrap;transition:all .2s}
    .nav-b.act{background:#f0fdf4;color:#10b981;font-weight:600}
    .nav-b:hover:not(.act){color:#10b981;background:#f8fafc}
    .row-i{display:flex;align-items:flex-start;padding:14px 0;border-bottom:1px solid #f1f5f9;gap:12px}
    .row-i:last-child{border-bottom:none}
    .tag{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;display:inline-block;letter-spacing:.2px}
    .t-ent{background:#dcfce7;color:#15803d}
    .t-sai{background:#fee2e2;color:#b91c1c}
    .t-rec{background:#dcfce7;color:#15803d}
    .t-pago{background:#dcfce7;color:#15803d}
    .t-arec{background:#fef3c7;color:#a16207}
    .t-apag{background:#fce7f3;color:#be185d}
    .sw{display:flex;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:8px;overflow:hidden;padding:3px}
    .sw-b{flex:1;padding:8px;background:transparent;border:none;color:#64748b;font-size:13px;font-family:inherit;cursor:pointer;border-radius:6px;font-weight:500;transition:all .2s}
    .sw-b.act{background:#10b981;color:#fff;font-weight:600}
    .sw-b.act-r{background:#f43f5e;color:#fff;font-weight:600}
    .pbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:10px}
    .pbox.pend{border-left:3px solid #f59e0b}
    .pbox.bx{border-left:3px solid #10b981}
    .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;box-shadow:0 10px 40px #0f172a25}
    .sec-t{font-weight:700;font-size:14px;margin-bottom:16px;color:#0f172a}
    .mono{font-family:'DM Mono',monospace}
    .mdl{position:fixed;inset:0;background:#0f172a90;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(2px)}
    .mdl-c{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:26px;max-width:420px;width:100%;box-shadow:0 20px 60px #0f172a30}
    @media (max-width: 720px) {
      .grid-resp { grid-template-columns: 1fr 1fr !important; }
      .grid-resp-1 { grid-template-columns: 1fr !important; }
      .grid-resp-2 { grid-template-columns: 1fr 1fr !important; }
      .nav-b { padding: 8px 10px !important; font-size: 12px !important; }
    }
  `;

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",color:"#1e293b",fontFamily:"'Inter','DM Sans','Segoe UI',sans-serif",paddingBottom:60}}>
      <style>{S}</style>

      {toast && <div className="toast" style={{background:toast.type==="err"?"#fff1f2":"#f0fdf4",color:toast.type==="err"?"#b91c1c":"#15803d",border:`1.5px solid ${toast.type==="err"?"#fecdd3":"#bbf7d0"}`}}>{toast.msg}</div>}

      {baixaModal && (
        <BaixaModal item={baixaModal} contas={CONTAS} onClose={()=>setBaixaModal(null)} onConfirm={(d,c)=>baixar(baixaModal.lid,baixaModal.id,d,c)} />
      )}

      <div style={{background:"#ffffff",borderBottom:"1px solid #e2e8f0",padding:"0 20px",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 3px #0f172a08"}}>
        <div style={{maxWidth:1080,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>⚖️</span>
            <span style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Financeiro Jurídico</span>
          </div>
          <div style={{display:"flex",gap:2}}>
            {[["dashboard","📊 Dashboard"],["lancamento","➕ Lançar"],["extrato","📋 Extrato"],["config","⚙️"]].map(([v,l])=>(
              <button key={v} className={`nav-b ${view===v?"act":""}`} onClick={()=>{setView(v);if(v==="lancamento"){setForm(emptyForm());setEditId(null);}}}>{l}</button>
            ))}
            <button className="nav-b" title="Sair" onClick={()=>{ if(confirm("Deseja sair do sistema?")) onLogout(); }} style={{color:"#f43f5e"}}>🔒</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1080,margin:"0 auto",padding:"24px 20px"}}>

        {view!=="config" && (
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
            <button className="btn-g" onClick={()=>{let mm=m-1,yy=y;if(mm<0){mm=11;yy--;}setM(mm);setY(yy);}}>‹</button>
            <span style={{fontWeight:600,fontSize:15,minWidth:160,textAlign:"center"}}>{M[m]} {y}</span>
            <button className="btn-g" onClick={()=>{let mm=m+1,yy=y;if(mm>11){mm=0;yy++;}setM(mm);setY(yy);}}>›</button>
          </div>
        )}

        {view==="dashboard" && (
          <>
            <div className="grid-resp" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[
                {l:"✓ Recebido",v:recebido,c:"#15803d",b:"#bbf7d0",bg:"#f0fdf4"},
                {l:"✓ Pago",v:pago,c:"#b91c1c",b:"#fecdd3",bg:"#fff1f2"},
                {l:"⏳ A Receber",v:aReceber,c:"#a16207",b:"#fde68a",bg:"#fffbeb"},
                {l:"⏳ A Pagar",v:aPagar,c:"#be185d",b:"#fbcfe8",bg:"#fdf2f8"},
              ].map(c=>(
                <div key={c.l} className="card" style={{borderColor:c.b,background:c.bg,padding:16}}>
                  <div style={{fontSize:11,color:"#64748b",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:.3}}>{c.l}</div>
                  <div className="mono" style={{color:c.c,fontSize:18,fontWeight:700}}>{fmt(c.v)}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:"#64748b",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.3}}>SALDO REALIZADO ({M[m]})</div>
                <div className="mono" style={{fontSize:26,fontWeight:700,color:saldoReal>=0?"#10b981":"#f43f5e"}}>{fmt(saldoReal)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:4,fontWeight:500,textTransform:"uppercase"}}>SALDO PREVISTO</div>
                <div className="mono" style={{fontSize:14,color:"#64748b"}}>{fmt((recebido+aReceber)-(pago+aPagar))}</div>
              </div>
            </div>

            <div className="card" style={{marginBottom:16}}>
              <div className="sec-t">📈 Realizado — últimos 6 meses</div>
              <div style={{display:"flex",gap:10,alignItems:"flex-end",height:130}}>
                {hist.map((h,i)=>(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{width:"100%",display:"flex",gap:3,alignItems:"flex-end",height:100}}>
                      <div title={`Recebido: ${fmt(h.r)}`} style={{flex:1,background:"#10b981",borderRadius:"4px 4px 0 0",height:`${(h.r/maxBar)*100}%`,minHeight:h.r>0?3:0}}/>
                      <div title={`Pago: ${fmt(h.pg)}`} style={{flex:1,background:"#f43f5e",borderRadius:"4px 4px 0 0",height:`${(h.pg/maxBar)*100}%`,minHeight:h.pg>0?3:0}}/>
                    </div>
                    <div style={{fontSize:10,color:"#64748b",fontWeight:500}}>{h.label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:14,marginTop:12}}>
                <span style={{fontSize:11,color:"#15803d",fontWeight:600}}>■ Recebido</span>
                <span style={{fontSize:11,color:"#b91c1c",fontWeight:600}}>■ Pago</span>
              </div>
            </div>

            {(aReceber>0 || aPagar>0) && (
              <div className="card">
                <div className="sec-t">⏳ Pendências do mês</div>
                {dadosMes.filter(p=>p.status==="pendente").sort((a,b)=>new Date(a.dataVenc)-new Date(b.dataVenc)).slice(0,8).map((p,i)=>(
                  <div key={i} className="row-i">
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                        <span className={`tag ${p.tipo==="entrada"?"t-arec":"t-apag"}`}>{p.tipo==="entrada"?"A Receber":"A Pagar"}</span>
                        <span style={{fontSize:11,color:"#64748b"}}>Vence {fmtD(p.dataVenc)}</span>
                      </div>
                      <div style={{fontWeight:600,fontSize:13,color:"#0f172a"}}>{p.cliente}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{p.categoria}{p.processo?` • ${p.processo}`:""}{p.nParcs>1?` • Parc. ${p.numero}/${p.nParcs}`:""}</div>
                    </div>
                    <div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                      <div className="mono" style={{fontSize:14,fontWeight:700,color:p.tipo==="entrada"?"#a16207":"#be185d"}}>{fmt(p.valor)}</div>
                      <button className="btn-baixa" onClick={()=>setBaixaModal(p)}>✓ Dar Baixa</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {dadosMes.length===0 && (
              <div style={{textAlign:"center",color:"#64748b",marginTop:40}}>
                <div style={{fontSize:36,marginBottom:12}}>📂</div>
                <div style={{fontSize:14,marginBottom:16,color:"#475569"}}>Nenhum lançamento em {M[m]}.</div>
                <button className="btn-p" onClick={()=>setView("lancamento")}>➕ Novo Lançamento</button>
              </div>
            )}
          </>
        )}

        {view==="lancamento" && (
          <div className="card" style={{maxWidth:740}}>
            <div className="sec-t">{editId?"✏️ Editar Lançamento":"➕ Novo Lançamento"}</div>
            <div style={{marginBottom:16}}>
              <div className="lbl">Tipo *</div>
              <div className="sw" style={{maxWidth:240}}>
                <button className={`sw-b ${form.tipo==="entrada"?"act":""}`} onClick={()=>setF("tipo","entrada")}>↑ Entrada</button>
                <button className={`sw-b ${form.tipo==="saida"?"act-r":""}`} onClick={()=>setF("tipo","saida")}>↓ Saída</button>
              </div>
            </div>
            <div className="grid-resp-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div className="lbl">{form.tipo==="entrada"?"Cliente *":"Fornecedor / Descrição *"}</div>
                <input className="inp" placeholder={form.tipo==="entrada"?"Nome do cliente":"Ex: Aluguel, Energia, Salário João..."} value={form.cliente} onChange={e=>setF("cliente",e.target.value)} list="cli-l"/>
                <datalist id="cli-l">{allClientes.map(c=><option key={c} value={c}/>)}</datalist>
              </div>
              <div>
                <div className="lbl">Nº do Processo</div>
                <input className="inp" placeholder="0000000-00.0000.0.00.0000" value={form.processo} onChange={e=>setF("processo",e.target.value)}/>
              </div>
              <div>
                <div className="lbl">Parceria</div>
                <input className="inp" placeholder="Parceiro / escritório" value={form.parceria} onChange={e=>setF("parceria",e.target.value)}/>
              </div>
              <div>
                <div className="lbl">Conta Bancária *</div>
                <select className="inp" value={form.contaBancaria} onChange={e=>setF("contaBancaria",e.target.value)}>
                  {CONTAS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="lbl">Categoria</div>
                <select className="inp" value={form.categoria} onChange={e=>setF("categoria",e.target.value)}>
                  {cats.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="lbl">Observações</div>
                <input className="inp" placeholder="Descrição adicional" value={form.descricao} onChange={e=>setF("descricao",e.target.value)}/>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div className="lbl">Forma de Pagamento</div>
              <div className="sw" style={{maxWidth:260}}>
                <button className={`sw-b ${form.formaPag==="avista"?"act":""}`} onClick={()=>setForm(p=>({...p,formaPag:"avista",parcelas:[newP(Date.now())]}))}>À Vista</button>
                <button className={`sw-b ${form.formaPag==="parcelado"?"act":""}`} onClick={()=>setF("formaPag","parcelado")}>Parcelado</button>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div className="lbl" style={{margin:0}}>{form.formaPag==="avista"?"Valor e vencimento":`Parcelas (${form.parcelas.length})`}</div>
                {form.formaPag==="parcelado" && <button className="btn-g" style={{padding:"5px 12px"}} onClick={addP}>+ Parcela</button>}
              </div>

              {form.parcelas.map((p,i)=>(
                <div key={p.id} className={`pbox ${p.status==="baixado"?"bx":"pend"}`}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontSize:12,color:"#64748b",fontWeight:600}}>
                      {form.formaPag==="parcelado"?`Parcela ${i+1}`:"Lançamento"}
                      {" "}<span className={`tag ${p.status==="baixado"?"t-rec":(form.tipo==="entrada"?"t-arec":"t-apag")}`} style={{marginLeft:6}}>
                        {p.status==="baixado" ? (form.tipo==="entrada"?"Recebido":"Pago") : (form.tipo==="entrada"?"A Receber":"A Pagar")}
                      </span>
                    </span>
                    {form.formaPag==="parcelado" && form.parcelas.length>1 && (
                      <button className="btn-d" style={{padding:"2px 10px"}} onClick={()=>remP(p.id)}>✕</button>
                    )}
                  </div>
                  <div className="grid-resp-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
                    <div>
                      <div className="lbl">Valor (R$) *</div>
                      <input className="inp" placeholder="0,00" value={p.valor} onChange={e=>updP(p.id,"valor",e.target.value)}/>
                    </div>
                    <div>
                      <div className="lbl">Vencimento</div>
                      <input type="date" className="inp" value={p.dataVenc} onChange={e=>updP(p.id,"dataVenc",e.target.value)}/>
                    </div>
                    <div>
                      <div className="lbl">Data Baixa</div>
                      <input type="date" className="inp" value={p.dataBaixa} onChange={e=>updP(p.id,"dataBaixa",e.target.value)} disabled={p.status==="pendente"}/>
                    </div>
                    <div>
                      <div className="lbl">Situação</div>
                      <select className="inp" value={p.status} onChange={e=>{
                        const ns=e.target.value;
                        updP(p.id,"status",ns);
                        if(ns==="baixado" && !p.dataBaixa) updP(p.id,"dataBaixa",today());
                        if(ns==="pendente") updP(p.id,"dataBaixa","");
                      }}>
                        <option value="pendente">⏳ Pendente</option>
                        <option value="baixado">✓ Baixado</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:10}}>
              <button className="btn-p" onClick={submit}>{editId?"💾 Salvar":"✓ Registrar"}</button>
              {editId && <button className="btn-g" onClick={()=>{setEditId(null);setForm(emptyForm());}}>Cancelar</button>}
            </div>
            <div style={{marginTop:16,padding:12,background:"#f8fafc",borderRadius:8,fontSize:11,color:"#64748b",lineHeight:1.6}}>
              💡 <b>Dica:</b> Lance todas as parcelas como <b>Pendente</b> (a receber/a pagar). Quando o pagamento ocorrer, dê baixa pelo Dashboard ou Extrato. Você pode também já registrar como <b>Baixado</b> se o valor já entrou/saiu.
            </div>
          </div>
        )}

        {view==="extrato" && (
          <>
            <div className="card" style={{marginBottom:14}}>
              <div className="lbl">Situação</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                {[["todos","Todos"],["pendentes","⏳ Pendentes"],["baixados","✓ Baixados"],["aReceber","↑ A Receber"],["recebidos","✓ Recebidos"],["aPagar","↓ A Pagar"],["pagos","✓ Pagos"]].map(([v,l])=>(
                  <button key={v} className={`btn-g ${fSit===v?"act":""}`} onClick={()=>setFSit(v)}>{l}</button>
                ))}
              </div>
              <div className="grid-resp-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div><div className="lbl">Tipo</div>
                  <select className="inp" value={fTipo} onChange={e=>setFTipo(e.target.value)}>
                    <option value="todos">Todos</option><option value="entrada">Entradas</option><option value="saida">Saídas</option>
                  </select>
                </div>
                <div><div className="lbl">Conta Bancária</div>
                  <select className="inp" value={fConta} onChange={e=>setFConta(e.target.value)}>
                    <option value="todas">Todas</option>{CONTAS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><div className="lbl">Cliente / Processo / Parceria</div>
                  <input className="inp" placeholder="Buscar..." value={fBusca} onChange={e=>setFBusca(e.target.value)}/>
                </div>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:"#64748b"}}>{filtrado.length} resultado(s)</span>
              <span className="mono" style={{color:"#15803d",fontSize:12}}>✓ {fmt(filtrado.filter(p=>p.tipo==="entrada"&&p.status==="baixado").reduce((s,p)=>s+p.valor,0))}</span>
              <span className="mono" style={{color:"#b91c1c",fontSize:12}}>✓ {fmt(filtrado.filter(p=>p.tipo==="saida"&&p.status==="baixado").reduce((s,p)=>s+p.valor,0))}</span>
              <span className="mono" style={{color:"#a16207",fontSize:12}}>⏳ {fmt(filtrado.filter(p=>p.status==="pendente").reduce((s,p)=>s+p.valor,0))}</span>
              <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                <button className="btn-g" onClick={expExcel} disabled={filtrado.length===0}>📊 Excel</button>
                <button className="btn-g" onClick={expPDF} disabled={filtrado.length===0}>📄 PDF</button>
              </div>
            </div>

            <div className="card">
              {filtrado.length===0 && (
                <div style={{textAlign:"center",color:"#64748b",padding:"36px 0"}}>
                  <div style={{fontSize:28,marginBottom:10}}>🔍</div>Nenhum registro encontrado.
                </div>
              )}
              {filtrado.map((p,i)=>{
                const sitLabel = p.status==="baixado" ? (p.tipo==="entrada"?"✓ Recebido":"✓ Pago") : (p.tipo==="entrada"?"⏳ A Receber":"⏳ A Pagar");
                const sitClass = p.status==="baixado" ? "t-rec" : (p.tipo==="entrada"?"t-arec":"t-apag");
                return (
                <div key={i} className="row-i">
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                      <span className={`tag ${p.tipo==="entrada"?"t-ent":"t-sai"}`}>{p.tipo==="entrada"?"↑ Entrada":"↓ Saída"}</span>
                      <span className={`tag ${sitClass}`}>{sitLabel}</span>
                      {p.nParcs>1 && <span style={{fontSize:10,color:"#64748b",background:"#e2e8f0",padding:"2px 8px",borderRadius:20}}>Parc. {p.numero}/{p.nParcs}</span>}
                    </div>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{p.cliente}</div>
                    <div style={{fontSize:11,color:"#64748b",display:"flex",gap:8,flexWrap:"wrap"}}>
                      <span>{p.categoria}</span>
                      {p.processo && <span>• 📁 {p.processo}</span>}
                      {p.parceria && <span>• 🤝 {p.parceria}</span>}
                      <span>• 🏦 {p.contaBancaria}</span>
                      <span>• Vence {fmtD(p.dataVenc)}</span>
                      {p.status==="baixado" && <span>• ✓ Baixa {fmtD(p.dataBaixa)}</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                    <div className="mono" style={{fontSize:15,fontWeight:700,color:p.tipo==="entrada"?(p.status==="baixado"?"#15803d":"#a16207"):(p.status==="baixado"?"#b91c1c":"#be185d")}}>
                      {p.tipo==="entrada"?"+":"-"}{fmt(p.valor)}
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {p.status==="pendente" && <button className="btn-baixa" onClick={()=>setBaixaModal(p)}>✓ Dar Baixa</button>}
                      {p.status==="baixado" && <button className="btn-g" style={{padding:"4px 10px",fontSize:10}} onClick={()=>estornar(p.lid,p.id)}>↺ Estornar</button>}
                      <button className="btn-g" style={{padding:"4px 10px",fontSize:10}} onClick={()=>editar(p.lid)}>✏️</button>
                      <button className="btn-d" onClick={()=>excluir(p.lid)}>🗑</button>
                    </div>
                  </div>
                </div>);
              })}
            </div>
          </>
        )}

        {view==="config" && (
          <div className="card" style={{maxWidth:560}}>
            <div className="sec-t">⚙️ Configurações e Backup</div>
            <div style={{padding:14,background:"#f8fafc",borderRadius:8,marginBottom:18,fontSize:12,color:"#64748b",lineHeight:1.6}}>
              📦 <b style={{color:"#0f172a"}}>Backup dos dados</b><br/>
              Seus dados ficam salvos automaticamente no navegador deste dispositivo. Recomendamos exportar um backup periódico (ex: toda semana) para garantir a segurança das informações. O arquivo .json gerado pode ser restaurado a qualquer momento neste ou em outro dispositivo.
            </div>
            <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
              <button className="btn-p" onClick={exportarBackup}>📥 Baixar Backup</button>
              <label className="btn-g" style={{padding:"10px 18px",cursor:"pointer"}}>
                📤 Restaurar Backup
                <input type="file" accept=".json" onChange={importarBackup} style={{display:"none"}}/>
              </label>
            </div>

            <div style={{padding:14,background:"#f8fafc",borderRadius:8,marginBottom:14,fontSize:12,color:"#64748b",lineHeight:1.6}}>
              📊 <b style={{color:"#0f172a"}}>Resumo geral</b><br/>
              {data.length} lançamento(s) registrado(s) • {data.reduce((s,l)=>s+l.parcelas.length,0)} parcela(s) total
            </div>

            <div style={{padding:14,background:"#fff1f2",borderRadius:8,fontSize:12,color:"#b91c1c",lineHeight:1.6,border:"1px solid #f43f5e50"}}>
              ⚠️ <b>Limpar todos os dados</b><br/>
              Apaga permanentemente todos os lançamentos. Faça backup antes!
              <div style={{marginTop:10}}>
                <button className="btn-d" onClick={()=>{
                  if(confirm("ATENÇÃO: Apagar TODOS os dados? Esta ação é irreversível. Você fez backup?")) {
                    setData([]); tst("Todos os dados foram apagados.","err");
                  }
                }}>🗑 Apagar Tudo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BaixaModal({ item, contas, onClose, onConfirm }) {
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [conta, setConta] = useState(item.contaBancaria);
  return (
    <div className="mdl" onClick={onClose}>
      <div className="mdl-c" onClick={e=>e.stopPropagation()}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>{item.tipo==="entrada"?"✓ Confirmar Recebimento":"✓ Confirmar Pagamento"}</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:18}}>{item.cliente} — <span style={{color:item.tipo==="entrada"?"#15803d":"#b91c1c",fontWeight:700}}>{fmt(item.valor)}</span>{item.nParcs>1?` (Parcela ${item.numero}/${item.nParcs})`:""}</div>
        <div style={{marginBottom:14}}>
          <div className="lbl">Data da Baixa *</div>
          <input type="date" className="inp" value={data} onChange={e=>setData(e.target.value)}/>
        </div>
        <div style={{marginBottom:18}}>
          <div className="lbl">Conta Bancária *</div>
          <select className="inp" value={conta} onChange={e=>setConta(e.target.value)}>
            {contas.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button className="btn-g" onClick={onClose}>Cancelar</button>
          <button className="btn-p" onClick={()=>onConfirm(data,conta)}>Confirmar Baixa</button>
        </div>
      </div>
    </div>
  );
}
