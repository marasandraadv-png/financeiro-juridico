// ════════════════════════════════════════════════════════════
// TELA DE CLIENTES — Cadastro na nuvem (Supabase)
// ════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const STATUS_CLIENTE = [
  { v: "aguardando_implantacao", l: "🟠 Aguardando Implantação", c: "#a16207", bg: "#fef3c7" },
  { v: "implantado_ag_extrato", l: "🟡 Implantado / Ag. Extrato", c: "#a16207", bg: "#fffbeb" },
  { v: "implantado_extrato", l: "🟢 Implantado / Extrato", c: "#15803d", bg: "#dcfce7" },
];

const PAISES = [
  { v: "BR", l: "🇧🇷 Brasil" },
  { v: "ES", l: "🇪🇸 Espanha" },
];

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const formatCPF = (v) => {
  const d = (v||"").replace(/\D/g,"").slice(0,11);
  return d.replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})/,"$1-$2");
};
const formatTel = (v) => {
  const d = (v||"").replace(/\D/g,"").slice(0,11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/,"($1) $2").replace(/(\d{4})(\d)/,"$1-$2");
  return d.replace(/(\d{2})(\d)/,"($1) $2").replace(/(\d{5})(\d)/,"$1-$2");
};

const empty = () => ({
  nome: "", cpf: "", rg: "", telefone: "", email: "",
  endereco: "", cidade: "", estado: "", observacoes: "",
  status_geral: "aguardando_implantacao", pais: "BR"
});

export default function TelaClientes({ tst }) {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPais, setFiltroPais] = useState("todos");
  const [modal, setModal] = useState(null); // null | "novo" | objeto cliente para editar
  const [form, setForm] = useState(empty());
  const [salvando, setSalvando] = useState(false);
  const [confirmaExcluir, setConfirmaExcluir] = useState(null);

  // Carregar clientes da nuvem
  const carregar = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true });
      if (error) throw error;
      setClientes(data || []);
    } catch (e) {
      tst("Erro ao carregar clientes: " + e.message, "err");
    }
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  // Filtros
  const filtrados = clientes.filter(c => {
    if (filtroStatus !== "todos" && c.status_geral !== filtroStatus) return false;
    if (filtroPais !== "todos" && c.pais !== filtroPais) return false;
    if (busca) {
      const b = busca.toLowerCase();
      const match = [c.nome, c.cpf, c.email, c.telefone, c.cidade].some(x => x?.toLowerCase().includes(b));
      if (!match) return false;
    }
    return true;
  });

  // Salvar (novo ou editar)
  const salvar = async () => {
    if (!form.nome.trim()) { tst("Informe o nome do cliente", "err"); return; }
    setSalvando(true);
    try {
      const dados = {
        nome: form.nome.trim(),
        cpf: (form.cpf||"").replace(/\D/g,"") || null,
        rg: form.rg || null,
        telefone: form.telefone || null,
        email: form.email || null,
        endereco: form.endereco || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        observacoes: form.observacoes || null,
        status_geral: form.status_geral,
        pais: form.pais,
        atualizado_em: new Date().toISOString(),
      };
      if (modal === "novo") {
        const { error } = await supabase.from("clientes").insert([dados]);
        if (error) throw error;
        tst("✓ Cliente cadastrado!");
      } else {
        const { error } = await supabase.from("clientes").update(dados).eq("id", modal.id);
        if (error) throw error;
        tst("✓ Cliente atualizado!");
      }
      setModal(null);
      setForm(empty());
      await carregar();
    } catch (e) {
      tst("Erro: " + e.message, "err");
    }
    setSalvando(false);
  };

  // Editar
  const editar = (c) => {
    setForm({
      nome: c.nome || "",
      cpf: formatCPF(c.cpf || ""),
      rg: c.rg || "",
      telefone: formatTel(c.telefone || ""),
      email: c.email || "",
      endereco: c.endereco || "",
      cidade: c.cidade || "",
      estado: c.estado || "",
      observacoes: c.observacoes || "",
      status_geral: c.status_geral || "aguardando_implantacao",
      pais: c.pais || "BR",
    });
    setModal(c);
  };

  // Excluir (soft delete)
  const excluir = async (id) => {
    try {
      const { error } = await supabase.from("clientes").update({ ativo: false }).eq("id", id);
      if (error) throw error;
      tst("Cliente excluído.", "err");
      setConfirmaExcluir(null);
      await carregar();
    } catch (e) {
      tst("Erro: " + e.message, "err");
    }
  };

  const novoCliente = () => {
    setForm(empty());
    setModal("novo");
  };

  const fecharModal = () => {
    setModal(null);
    setForm(empty());
  };

  const statusConfig = (v) => STATUS_CLIENTE.find(s => s.v === v) || STATUS_CLIENTE[0];

  return (
    <div>
      {/* TOPO COM BUSCA E BOTÃO */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{flex:1, minWidth:240}}>
          <div className="lbl">🔍 Buscar</div>
          <input className="inp" placeholder="Nome, CPF, telefone, e-mail, cidade..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        </div>
        <div style={{minWidth:200}}>
          <div className="lbl">Status</div>
          <select className="inp" value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)}>
            <option value="todos">Todos</option>
            {STATUS_CLIENTE.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
        <div style={{minWidth:140}}>
          <div className="lbl">País</div>
          <select className="inp" value={filtroPais} onChange={e=>setFiltroPais(e.target.value)}>
            <option value="todos">Todos</option>
            {PAISES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
          </select>
        </div>
        <button className="btn-p" onClick={novoCliente}>➕ Novo Cliente</button>
      </div>

      {/* RESUMO */}
      <div style={{display:"flex",gap:12,marginBottom:16,fontSize:12,color:"#64748b",flexWrap:"wrap"}}>
        <span><b style={{color:"#0f172a"}}>{filtrados.length}</b> cliente(s) {busca || filtroStatus!=="todos" || filtroPais!=="todos" ? "encontrado(s)" : "no total"}</span>
        {STATUS_CLIENTE.map(s => {
          const n = clientes.filter(c => c.status_geral === s.v).length;
          if (n === 0) return null;
          return <span key={s.v}>{s.l.split(" ")[0]} <b style={{color:s.c}}>{n}</b></span>;
        })}
      </div>

      {/* LISTA DE CLIENTES */}
      <div className="card" style={{padding:0}}>
        {carregando ? (
          <div style={{padding:40,textAlign:"center",color:"#64748b"}}>⏳ Carregando clientes da nuvem...</div>
        ) : filtrados.length === 0 ? (
          <div style={{padding:40,textAlign:"center",color:"#64748b"}}>
            <div style={{fontSize:36,marginBottom:12}}>👥</div>
            {clientes.length === 0
              ? <>Nenhum cliente cadastrado ainda.<br/><button className="btn-p" style={{marginTop:16}} onClick={novoCliente}>➕ Cadastrar primeiro cliente</button></>
              : "Nenhum cliente encontrado com os filtros aplicados."}
          </div>
        ) : (
          <div>
            {filtrados.map((c, i) => {
              const s = statusConfig(c.status_geral);
              return (
                <div key={c.id} style={{padding:"14px 20px",borderBottom: i<filtrados.length-1 ? "1px solid #f1f5f9" : "none",display:"flex",gap:14,alignItems:"flex-start"}}>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontWeight:600,fontSize:14,color:"#0f172a"}}>{c.nome}</span>
                      <span className="tag" style={{background:s.bg,color:s.c}}>{s.l}</span>
                      <span style={{fontSize:11,color:"#64748b"}}>{c.pais === "BR" ? "🇧🇷" : "🇪🇸"}</span>
                    </div>
                    <div style={{fontSize:11,color:"#64748b",display:"flex",gap:10,flexWrap:"wrap"}}>
                      {c.cpf && <span>📄 CPF: {formatCPF(c.cpf)}</span>}
                      {c.telefone && <span>📞 {formatTel(c.telefone)}</span>}
                      {c.email && <span>✉️ {c.email}</span>}
                      {c.cidade && <span>📍 {c.cidade}{c.estado?`/${c.estado}`:""}</span>}
                    </div>
                    {c.observacoes && <div style={{fontSize:11,color:"#94a3b8",marginTop:4,fontStyle:"italic"}}>💬 {c.observacoes}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button className="btn-ed" onClick={()=>editar(c)}>✏️ Editar</button>
                    <button className="btn-d" onClick={()=>setConfirmaExcluir(c)}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE NOVO/EDITAR */}
      {modal && (
        <div className="mdl" onClick={fecharModal}>
          <div className="mdl-c" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:17,marginBottom:18,color:"#0f172a"}}>
              {modal === "novo" ? "➕ Novo Cliente" : "✏️ Editar Cliente"}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div style={{gridColumn:"span 2"}}>
                <div className="lbl">Nome Completo *</div>
                <input className="inp" autoFocus placeholder="João da Silva" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/>
              </div>
              <div>
                <div className="lbl">CPF</div>
                <input className="inp" placeholder="000.000.000-00" value={form.cpf} onChange={e=>setForm({...form,cpf:formatCPF(e.target.value)})}/>
              </div>
              <div>
                <div className="lbl">RG</div>
                <input className="inp" placeholder="00.000.000-0" value={form.rg} onChange={e=>setForm({...form,rg:e.target.value})}/>
              </div>
              <div>
                <div className="lbl">Telefone</div>
                <input className="inp" placeholder="(00) 00000-0000" value={form.telefone} onChange={e=>setForm({...form,telefone:formatTel(e.target.value)})}/>
              </div>
              <div>
                <div className="lbl">E-mail</div>
                <input className="inp" type="email" placeholder="email@dominio.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <div className="lbl">Endereço</div>
                <input className="inp" placeholder="Rua, número, bairro" value={form.endereco} onChange={e=>setForm({...form,endereco:e.target.value})}/>
              </div>
              <div>
                <div className="lbl">Cidade</div>
                <input className="inp" placeholder="Cidade" value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})}/>
              </div>
              <div>
                <div className="lbl">Estado</div>
                {form.pais === "BR" ? (
                  <select className="inp" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
                    <option value="">—</option>
                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                ) : (
                  <input className="inp" placeholder="Província" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}/>
                )}
              </div>
              <div>
                <div className="lbl">País</div>
                <select className="inp" value={form.pais} onChange={e=>setForm({...form,pais:e.target.value, estado:""})}>
                  {PAISES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </div>
              <div>
                <div className="lbl">Status do Cliente</div>
                <select className="inp" value={form.status_geral} onChange={e=>setForm({...form,status_geral:e.target.value})}>
                  {STATUS_CLIENTE.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <div className="lbl">Observações</div>
                <textarea className="inp" rows={3} placeholder="Observações sobre o cliente, processo, parente, etc." value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})} style={{resize:"vertical",fontFamily:"inherit"}}/>
              </div>
            </div>

            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
              <button className="btn-g" onClick={fecharModal} disabled={salvando}>Cancelar</button>
              <button className="btn-p" onClick={salvar} disabled={salvando}>
                {salvando ? "⏳ Salvando..." : (modal === "novo" ? "✓ Cadastrar" : "💾 Salvar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAR EXCLUSÃO */}
      {confirmaExcluir && (
        <div className="mdl" onClick={()=>setConfirmaExcluir(null)}>
          <div className="mdl-c" onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:6,color:"#0f172a"}}>🗑 Excluir Cliente?</div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:18,lineHeight:1.5}}>
              Tem certeza que deseja excluir <b style={{color:"#0f172a"}}>{confirmaExcluir.nome}</b>?<br/>
              <span style={{fontSize:11,color:"#94a3b8"}}>O cliente será arquivado (soft delete) — pode ser recuperado depois se necessário.</span>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="btn-g" onClick={()=>setConfirmaExcluir(null)}>Cancelar</button>
              <button className="btn-d" style={{padding:"8px 16px",fontSize:13}} onClick={()=>excluir(confirmaExcluir.id)}>🗑 Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
