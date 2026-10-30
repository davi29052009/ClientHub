
const STORAGE_KEY = "clienthub_clientes";

let clientes = carregarClientes();
let clienteEditando = null;

const tabela = document.getElementById("tabelaClientes");
const modal = document.getElementById("modalCadastro");
const form = document.getElementById("formCliente");
const pesquisa = document.getElementById("pesquisa");

function carregarClientes() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error("Erro ao carregar clientes:", erro);
    return [];
  }
}

function salvarDados() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(clientes)
    );
    return true;
  } catch (erro) {
    alert("Não foi possível salvar os dados.");
    return false;
  }
}

function gerarId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString() +
    Math.random().toString(36).slice(2);
}

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function obterIniciais(nome) {
  return nome.trim().split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0))
    .join("")
    .toUpperCase();
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);

  if (classe) elemento.className = classe;
  if (texto !== undefined) {
    elemento.textContent = texto;
  }

  return elemento;
}

// ATUALIZAR INDICADORES

function atualizarIndicadores() {
  const ativos = clientes.filter(
    cliente => cliente.status === "Ativo"
  ).length;

  const agora = new Date();

  const novos = clientes.filter(cliente => {
    const data = new Date(cliente.dataCadastro);

    return data.getMonth() === agora.getMonth() &&
      data.getFullYear() === agora.getFullYear();
  }).length;

  document.getElementById("totalClientes").textContent =
    clientes.length;

  document.getElementById("clientesAtivos").textContent =
    ativos;

  document.getElementById("clientesInativos").textContent =
    clientes.length - ativos;

  document.getElementById("novosClientes").textContent =
    novos;
}

// RENDERIZAR TABELA

function renderizarClientes() {
  const termo = pesquisa.value.toLowerCase().trim();

  const filtrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(termo) ||
    cliente.email.toLowerCase().includes(termo) ||
    cliente.telefone.includes(termo)
  );

  tabela.replaceChildren();

  if (filtrados.length === 0) {
    const tr = document.createElement("tr");
    const td = criarElemento(
      "td",
      "empty-state",
      termo
        ? "Nenhum cliente encontrado."
        : "Nenhum cliente cadastrado. Clique em Novo cliente."
    );

    td.colSpan = 5;
    tr.appendChild(td);
    tabela.appendChild(tr);
  }

  filtrados.forEach(cliente => {
    const tr = document.createElement("tr");

    const tdCliente = document.createElement("td");
    const info = criarElemento("div", "client-info");
    const avatar = criarElemento(
      "div",
      "client-avatar",
      obterIniciais(cliente.nome)
    );

    const detalhes = document.createElement("div");
    detalhes.appendChild(
      criarElemento("strong", "", cliente.nome)
    );
    detalhes.appendChild(
      criarElemento("small", "", cliente.email)
    );

    info.append(avatar, detalhes);
    tdCliente.appendChild(info);

    const tdTelefone = criarElemento(
      "td", "", cliente.telefone
    );

    const tdData = criarElemento(
      "td", "", formatarData(cliente.dataCadastro)
    );

    const tdStatus = document.createElement("td");
    const badge = criarElemento(
      "span",
      "badge " + cliente.status.toLowerCase(),
      cliente.status
    );
    tdStatus.appendChild(badge);

    const tdAcoes = document.createElement("td");

    const btnEditar = criarElemento(
      "button", "action-btn", "Editar"
    );
    btnEditar.type = "button";
    btnEditar.addEventListener("click", () => {
      editarCliente(cliente.id);
    });

    const btnExcluir = criarElemento(
      "button", "action-btn", "Excluir"
    );
    btnExcluir.type = "button";
    btnExcluir.style.marginLeft = "12px";
    btnExcluir.style.color = "#dc2626";
    btnExcluir.addEventListener("click", () => {
      excluirCliente(cliente.id);
    });

    tdAcoes.append(btnEditar, btnExcluir);

    tr.append(
      tdCliente,
      tdTelefone,
      tdData,
      tdStatus,
      tdAcoes
    );

    tabela.appendChild(tr);
  });

  document.getElementById("contadorTabela").textContent =
    `Exibindo ${filtrados.length} de ${clientes.length} clientes`;

  atualizarIndicadores();
}

// MODAL

function abrirModal() {
  clienteEditando = null;
  form.reset();

  document.getElementById("tituloModal").textContent =
    "Novo cliente";

  modal.hidden = false;
  document.getElementById("nome").focus();
}

function fecharModal() {
  modal.hidden = true;
  clienteEditando = null;
  form.reset();
}

document.getElementById("btnNovoCliente")
  .addEventListener("click", abrirModal);

document.getElementById("fecharModal")
  .addEventListener("click", fecharModal);

document.getElementById("cancelarModal")
  .addEventListener("click", fecharModal);

modal.addEventListener("click", evento => {
  if (evento.target === modal) fecharModal();
});

document.addEventListener("keydown", evento => {
  if (evento.key === "Escape" && !modal.hidden) {
    fecharModal();
  }
});

// CADASTRAR OU EDITAR

form.addEventListener("submit", evento => {
  evento.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const status = document.getElementById("status").value;

  if (!nome || !email || !telefone) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const copiaAnterior = [...clientes];

  if (clienteEditando !== null) {
    clientes = clientes.map(cliente => {
      if (cliente.id === clienteEditando) {
        return {
          ...cliente,
          nome,
          email,
          telefone,
          status
        };
      }

      return cliente;
    });
  } else {
    clientes.push({
      id: gerarId(),
      nome,
      email,
      telefone,
      status,
      dataCadastro: new Date().toISOString()
    });
  }

  if (!salvarDados()) {
    clientes = copiaAnterior;
    return;
  }

  fecharModal();
  renderizarClientes();
});

// EDITAR

function editarCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  clienteEditando = id;

  document.getElementById("nome").value = cliente.nome;
  document.getElementById("email").value = cliente.email;
  document.getElementById("telefone").value = cliente.telefone;
  document.getElementById("status").value = cliente.status;

  document.getElementById("tituloModal").textContent =
    "Editar cliente";

  modal.hidden = false;
  document.getElementById("nome").focus();
}

// EXCLUIR

function excluirCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const confirmar = confirm(
    `Deseja realmente excluir ${cliente.nome}?`
  );

  if (!confirmar) return;

  const copiaAnterior = [...clientes];

  clientes = clientes.filter(c => c.id !== id);

  if (!salvarDados()) {
    clientes = copiaAnterior;
    return;
  }

  renderizarClientes();
}

// PESQUISA

pesquisa.addEventListener("input", renderizarClientes);

document.getElementById("btnVerTodos")
  .addEventListener("click", () => {
    pesquisa.value = "";
    renderizarClientes();
  });

// MENU


// NAVEGAÇÃO ENTRE PÁGINAS

const paginaRelatorios =
  document.getElementById("paginaRelatorios");

const paginaConfiguracoes =
  document.getElementById("paginaConfiguracoes");

const conteudoDashboard = [
  document.querySelector(".welcome"),
  document.querySelector(".stats"),
  document.querySelector(".table-section")
];

function abrirPagina(pagina) {
  const mostrarDashboard =
    pagina === "dashboard" || pagina === "clientes";

  conteudoDashboard.forEach(elemento => {
    if (elemento) {
      elemento.hidden = !mostrarDashboard;
    }
  });

  paginaRelatorios.hidden = pagina !== "relatorios";
  paginaConfiguracoes.hidden = pagina !== "configuracoes";

  const titulos = {
    dashboard: "Dashboard",
    clientes: "Clientes",
    relatorios: "Relatórios",
    configuracoes: "Configurações"
  };

  document.querySelector(".topbar h1").textContent =
    titulos[pagina] || "Dashboard";

  document.querySelector(".breadcrumb").textContent =
    "Painel / " + (titulos[pagina] || "Dashboard");

  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === pagina
    );
  });

  if (pagina === "relatorios") {
    atualizarRelatorios();
  }

  if (pagina === "configuracoes") {
    carregarConfiguracoes();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", evento => {
    evento.preventDefault();
    abrirPagina(item.dataset.page);
  });
});

// MOSTRAR DASHBOARD AO INICIAR
abrirPagina("dashboard");

// INICIAR

renderizarClientes();


// ====================================
// RELATÓRIOS
// ====================================

function obterClientesPeriodo() {
  const periodo =
    document.getElementById("periodoRelatorio").value;

  if (periodo === "todos") {
    return [...clientes];
  }

  const dias = Number(periodo);
  const limite = new Date();

  limite.setDate(limite.getDate() - dias);

  return clientes.filter(cliente => {
    const data = new Date(cliente.dataCadastro);
    return data >= limite;
  });
}

function atualizarRelatorios() {
  const dados = obterClientesPeriodo();

  const total = dados.length;

  const ativos = dados.filter(
    cliente => cliente.status === "Ativo"
  ).length;

  const inativos = total - ativos;

  const taxa = total > 0
    ? Math.round((ativos / total) * 100)
    : 0;

  document.getElementById("relTotal").textContent = total;
  document.getElementById("relAtivos").textContent = ativos;
  document.getElementById("relInativos").textContent = inativos;
  document.getElementById("relTaxa").textContent = taxa + "%";

  document.getElementById("graficoTotal").textContent = total;

  // GRÁFICO DE ROSCA

  const percentual = total > 0
    ? (ativos / total) * 100
    : 0;

  const grafico = document.getElementById("graficoRosca");

  grafico.style.background = total === 0
    ? "#e5e5e5"
    : `conic-gradient(
        #111 0% ${percentual}%,
        #dedede ${percentual}% 100%
      )`;

  // GRÁFICO DE CADASTROS MENSAIS

  const areaBarras = document.getElementById("graficoBarras");
  areaBarras.replaceChildren();

  const agora = new Date();
  const meses = [];

  for (let i = 5; i >= 0; i--) {
    const referencia = new Date(
      agora.getFullYear(),
      agora.getMonth() - i,
      1
    );

    const quantidade = dados.filter(cliente => {
      const data = new Date(cliente.dataCadastro);

      return data.getMonth() === referencia.getMonth() &&
        data.getFullYear() === referencia.getFullYear();
    }).length;

    meses.push({
      nome: referencia.toLocaleDateString("pt-BR", {
        month: "short"
      }).replace(".", ""),
      quantidade
    });
  }

  const maior = Math.max(
    1,
    ...meses.map(mes => mes.quantidade)
  );

  meses.forEach(mes => {
    const grupo = document.createElement("div");
    grupo.className = "barra-grupo";

    const valor = document.createElement("span");
    valor.className = "barra-valor";
    valor.textContent = mes.quantidade;

    const barra = document.createElement("div");
    barra.className = "barra";
    barra.style.height =
      (mes.quantidade / maior) * 190 + "px";

    const label = document.createElement("span");
    label.className = "barra-label";
    label.textContent = mes.nome;

    grupo.append(valor, barra, label);
    areaBarras.appendChild(grupo);
  });

  document.getElementById("textoResumo").textContent =
    `No período selecionado, foram encontrados ${total} ` +
    `clientes cadastrados, sendo ${ativos} ativos e ` +
    `${inativos} inativos. A taxa de clientes ativos ` +
    `é de ${taxa}%.`;
}

document.getElementById("periodoRelatorio")
  .addEventListener("change", atualizarRelatorios);

// EXPORTAR CSV

document.getElementById("exportarCSV")
  .addEventListener("click", () => {
    const dados = obterClientesPeriodo();

    if (dados.length === 0) {
      alert("Não existem clientes para exportar.");
      return;
    }

    const linhas = [
      ["Nome", "Email", "Telefone", "Status", "Data"]
    ];

    dados.forEach(cliente => {
      linhas.push([
        cliente.nome,
        cliente.email,
        cliente.telefone,
        cliente.status,
        new Date(cliente.dataCadastro)
          .toLocaleDateString("pt-BR")
      ]);
    });

    function campoCSV(valor) {
      let texto = String(valor ?? "");

      // Evita interpretar entradas como fórmulas
      // em programas de planilhas.
      if (/^[\s]*[=+\-@\t\r]/.test(texto)) {
        texto = "'" + texto;
      }

      return '"' + texto.replace(/"/g, '""') + '"';
    }

    const csv = linhas.map(linha =>
      linha.map(campoCSV).join(";")
    ).join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "clienthub-relatorio.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

// ====================================
// CONFIGURAÇÕES
// ====================================

const CONFIG_KEY = "clienthub_configuracoes";

const configuracoesPadrao = {
  nome: "Administrador",
  empresa: "ClientHub",
  email: "",
  confirmarExclusao: true,
  ordenarClientes: false
};

function obterConfiguracoes() {
  try {
    const salvas = JSON.parse(
      localStorage.getItem(CONFIG_KEY) || "{}"
    );

    return {
      ...configuracoesPadrao,
      ...salvas
    };
  } catch {
    return { ...configuracoesPadrao };
  }
}

function carregarConfiguracoes() {
  const config = obterConfiguracoes();

  document.getElementById("configNome").value = config.nome;
  document.getElementById("configEmpresa").value = config.empresa;
  document.getElementById("configEmail").value = config.email;

  document.getElementById("confirmarExclusao").checked =
    config.confirmarExclusao;

  document.getElementById("ordenarClientes").checked =
    config.ordenarClientes;

  document.querySelector(".sidebar-footer strong").textContent =
    config.nome;

  const iniciais = obterIniciais(config.nome);

  document.querySelector(".avatar").textContent = iniciais;
  document.querySelector(".top-avatar").textContent = iniciais;
}

function salvarConfiguracoes() {
  const config = {
    nome: document.getElementById("configNome").value.trim(),
    empresa: document.getElementById("configEmpresa").value.trim(),
    email: document.getElementById("configEmail").value.trim(),
    confirmarExclusao:
      document.getElementById("confirmarExclusao").checked,
    ordenarClientes:
      document.getElementById("ordenarClientes").checked
  };

  if (!config.nome || !config.empresa) {
    alert("Preencha o nome e a empresa.");
    return;
  }

  try {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify(config)
    );

    carregarConfiguracoes();
    renderizarClientes();

    alert("Configurações salvas com sucesso!");
  } catch {
    alert("Não foi possível salvar as configurações.");
  }
}

document.getElementById("formConfiguracoes")
  .addEventListener("submit", evento => {
    evento.preventDefault();
    salvarConfiguracoes();
  });



document.getElementById("confirmarExclusao")
  .addEventListener("change", salvarPreferencias);

document.getElementById("ordenarClientes")
  .addEventListener("change", salvarPreferencias);

function salvarPreferencias() {
  const config = obterConfiguracoes();

  config.confirmarExclusao =
    document.getElementById("confirmarExclusao").checked;

  config.ordenarClientes =
    document.getElementById("ordenarClientes").checked;

  try {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify(config)
    );
    renderizarClientes();
  } catch {
    alert("Erro ao salvar preferências.");
  }
}


document.getElementById("limparClientes")
  .addEventListener("click", () => {
    const confirmar = confirm(
      "ATENÇÃO: todos os clientes serão excluídos. " +
      "Esta ação não poderá ser desfeita. Deseja continuar?"
    );

    if (!confirmar) return;

    const copia = [...clientes];
    clientes = [];

    if (!salvarDados()) {
      clientes = copia;
      return;
    }

    renderizarClientes();
    atualizarRelatorios();

    alert("Todos os clientes foram excluídos.");
  });

// INTEGRAÇÃO COM A TABELA EXISTENTE

const renderizarClientesOriginal = renderizarClientes;

renderizarClientes = function() {
  const config = obterConfiguracoes();

  if (config.ordenarClientes) {
    clientes.sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  } else {
    clientes.sort((a, b) =>
      new Date(a.dataCadastro) - new Date(b.dataCadastro)
    );
  }

  renderizarClientesOriginal();

  if (!paginaRelatorios.hidden) {
    atualizarRelatorios();
  }
};



excluirCliente = function(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const config = obterConfiguracoes();

  if (config.confirmarExclusao) {
    const confirmar = confirm(
      `Deseja realmente excluir ${cliente.nome}?`
    );

    if (!confirmar) return;
  }

  const copia = [...clientes];
  clientes = clientes.filter(c => c.id !== id);

  if (!salvarDados()) {
    clientes = copia;
    return;
  }

  renderizarClientes();
};

// CARREGAR PREFERÊNCIAS INICIAIS

carregarConfiguracoes();
renderizarClientes();

