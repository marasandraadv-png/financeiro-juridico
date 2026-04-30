// ════════════════════════════════════════════════════════════
// AUTOCOMPLETE DE CLIENTES — Busca clientes cadastrados na nuvem
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const formatCPF = (v) => {
  const d = (v||"").replace(/\D/g,"").slice(0,11);
  return d.replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})/,"$1-$2");
};

const STATUS_CORES = {
  aguardando_implantacao: { bg: "#fef3c7", c: "#a16207", e: "🟠" },
  implantado_ag_extrato:  { bg: "#fffbeb", c: "#a16207", e: "🟡" },
  implantado_extrato:     { bg: "#dcfce7", c: "#15803d", e: "🟢" },
};

export default function AutocompleteCliente({ valor, onChange, placeholder, label }) {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef(null);

  // Carrega clientes da nuvem na primeira vez que o componente abrir
  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nome, cpf, telefone, email, cidade, estado, pais, status_geral")
          .eq("ativo", true)
          .order("nome", { ascending: true });
        if (!cancelado) {
          if (error) console.error("Erro ao carregar clientes:", error);
          else setClientes(data || []);
        }
      } catch (e) {
        console.error(e);
      }
      if (!cancelado) setCarregando(false);
    })();
    return () => { cancelado = true; };
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (ev) => {
      if (wrapRef.current && !wrapRef.current.contains(ev.target)) setAberto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filtra clientes baseado no que foi digitado
  const filtrados = (() => {
    if (!valor || valor.trim().length === 0) return clientes.slice(0, 8);
    const busca = valor.toLowerCase().trim();
    const buscaNum = busca.replace(/\D/g, "");
    return clientes.filter(c => {
      if ((c.nome || "").toLowerCase().includes(busca)) return true;
      if (buscaNum.length >= 3 && (c.cpf || "").includes(buscaNum)) return true;
      if (buscaNum.length >= 3 && (c.telefone || "").includes(buscaNum)) return true;
      return false;
    }).slice(0, 12);
  })();

  // Verifica se o que foi digitado corresponde EXATAMENTE a algum cliente
  const exatoMatch = clientes.find(c => (c.nome || "").toLowerCase() === (valor || "").toLowerCase().trim());

  const selecionar = (c) => {
    onChange(c.nome, c); // passa o nome E o objeto completo
    setAberto(false);
    setHighlight(-1);
  };

  const teclaPress = (ev) => {
    if (!aberto) return;
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setHighlight(h => Math.min(h + 1, filtrados.length - 1));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setHighlight(h => Math.max(h - 1, -1));
    } else if (ev.key === "Enter" && highlight >= 0) {
      ev.preventDefault();
      selecionar(filtrados[highlight]);
    } else if (ev.key === "Escape") {
      setAberto(false);
      setHighlight(-1);
    }
  };

  return (
    <div ref={wrapRef} style={{position:"relative"}}>
      {label && <div className="lbl">{label}</div>}
      <input
        className="inp"
        placeholder={placeholder || "Digite o nome ou CPF..."}
        value={valor || ""}
        onChange={e => { onChange(e.target.value, null); setAberto(true); setHighlight(-1); }}
        onFocus={() => setAberto(true)}
        onKeyDown={teclaPress}
        autoComplete="off"
      />

      {/* Indicador de cliente cadastrado */}
      {exatoMatch && !aberto && (
        <div style={{position:"absolute",right:10,top:34,fontSize:11,color:"#15803d",fontWeight:600,pointerEvents:"none",background:"#fff",padding:"0 4px"}}>
          ✓ cadastrado
        </div>
      )}

      {/* Dropdown de sugestões */}
      {aberto && (
        <div style={{
          position:"absolute", top:"100%", left:0, right:0, zIndex:50,
          background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:8,
          marginTop:4, maxHeight:340, overflowY:"auto",
          boxShadow:"0 10px 30px #0f172a20"
        }}>
          {carregando ? (
            <div style={{padding:14, fontSize:12, color:"#64748b", textAlign:"center"}}>
              ⏳ Carregando clientes da nuvem...
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{padding:14}}>
              <div style={{fontSize:12, color:"#64748b", marginBottom:6}}>
                ❌ Nenhum cliente cadastrado encontrado.
              </div>
              {valor && valor.trim().length > 0 && (
                <div style={{fontSize:11, color:"#94a3b8", lineHeight:1.4}}>
                  💡 Você pode prosseguir digitando o nome livremente, ou cadastrar este cliente na aba <b>"👥 Clientes"</b> antes de continuar.
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{padding:"6px 12px",fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid #f1f5f9",background:"#f8fafc"}}>
                {valor && valor.trim() ? `${filtrados.length} cliente(s) encontrado(s)` : `Selecione um cliente cadastrado`}
              </div>
              {filtrados.map((c, i) => {
                const s = STATUS_CORES[c.status_geral] || { bg: "#f1f5f9", c: "#64748b", e: "⚪" };
                const isHighlighted = i === highlight;
                return (
                  <div
                    key={c.id}
                    onClick={() => selecionar(c)}
                    onMouseEnter={() => setHighlight(i)}
                    style={{
                      padding:"10px 12px", cursor:"pointer",
                      borderBottom: i < filtrados.length - 1 ? "1px solid #f1f5f9" : "none",
                      background: isHighlighted ? "#f0fdf4" : "transparent",
                    }}
                  >
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                      <span style={{fontWeight:600,fontSize:13,color:"#0f172a"}}>{c.nome}</span>
                      <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:s.bg,color:s.c,fontWeight:600}}>{s.e} {(c.status_geral||"").replace(/_/g," ")}</span>
                      <span style={{fontSize:10,color:"#64748b"}}>{c.pais === "BR" ? "🇧🇷" : "🇪🇸"}</span>
                    </div>
                    <div style={{fontSize:10,color:"#64748b",display:"flex",gap:10,flexWrap:"wrap"}}>
                      {c.cpf && <span>📄 {formatCPF(c.cpf)}</span>}
                      {c.cidade && <span>📍 {c.cidade}{c.estado?`/${c.estado}`:""}</span>}
                      {c.email && <span>✉️ {c.email}</span>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div style={{padding:"8px 12px",fontSize:10,color:"#94a3b8",borderTop:"1px solid #f1f5f9",background:"#f8fafc"}}>
            💡 Cadastre novos clientes na aba <b>"👥 Clientes"</b> para que apareçam aqui.
          </div>
        </div>
      )}
    </div>
  );
}
