/**
 * Site do Discoff — comportamento.
 *
 * Os links de download NÃO ficam escritos no HTML. Eles são resolvidos na
 * hora, a partir da última versão publicada no GitHub. Assim, quando sair a
 * 4.3.0, o site passa a apontar para ela sozinho, sem editar nada.
 *
 * Se a API falhar (offline, limite de requisições, bloqueador), cai num link
 * direto para a página de versões — que sempre funciona.
 */

const REPO = 'scoffyt/screenconnect'
const API = `https://api.github.com/repos/${REPO}/releases/latest`
const PAGINA_VERSOES = `https://github.com/${REPO}/releases`

/*
 * Link direto para o instalador, sem passar pela API.
 *
 * O caminho `/releases/latest/download/<arquivo>` só funciona com o nome do
 * arquivo no fim — sem ele, o GitHub devolve 404. Como o nome carrega a versão,
 * ele não pode ser fixado aqui; usamos a página de versões como plano B, que
 * sempre existe e nunca aponta para um arquivo que não está lá.
 */
const PAGINA_DOWNLOADS = `https://github.com/${REPO}/releases/latest`

/** Formata bytes em MB com vírgula decimal, como se escreve em português. */
function emMB(bytes) {
  if (!bytes) return null
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

/**
 * Descobre quais arquivos a versão mais recente publica.
 *
 * Nomes possíveis do instalador, em ordem de preferência:
 *   1. Discoff-Setup-<versao>.exe      (atual)
 *   2. ScreenConnect-Setup-<versao>.exe (versões antigas, antes da renomeação)
 *   3. qualquer .exe que não seja o portátil
 */
function escolherArquivos(ativos) {
  const exe = ativos.filter((a) => a.name.toLowerCase().endsWith('.exe'))
  const apk = ativos.filter((a) => a.name.toLowerCase().endsWith('.apk'))

  const instalador =
    exe.find((a) => /^Discoff-Setup-/i.test(a.name)) ??
    exe.find((a) => /^ScreenConnect-Setup-/i.test(a.name)) ??
    exe.find((a) => !/portable/i.test(a.name)) ??
    null

  const portatil = exe.find((a) => /portable/i.test(a.name)) ?? null
  const android = apk.find((a) => /^Discoff-Android-/i.test(a.name)) ?? apk[0] ?? null

  return { instalador, portatil, android }
}

/** Aplica a versão e os tamanhos nos elementos marcados com data-*. */
function aplicarDados(info, dados) {
  const versao = info?.tag_name ? info.tag_name.replace(/^v/, '') : null

  if (versao) {
    document.querySelectorAll('[data-versao]').forEach((el) => {
      el.textContent = versao
    })
  }

  const tamanhoWin = emMB(dados.instalador?.size)
  if (tamanhoWin) {
    document.querySelectorAll('[data-tamanho]').forEach((el) => {
      el.textContent = tamanhoWin
    })
  }

  const tamanhoApk = emMB(dados.android?.size)
  if (tamanhoApk) {
    document.querySelectorAll('[data-tamanho-apk]').forEach((el) => {
      el.textContent = tamanhoApk
    })
  }
}

/** Liga os botões aos arquivos certos. */
function ligarBotoes(dados) {
  // Sem o arquivo certo, mandamos para a página de versões em vez de inventar
  // uma URL que pode não existir.
  const urlWindows = dados.instalador?.browser_download_url ?? PAGINA_DOWNLOADS
  const urlAndroid = dados.android?.browser_download_url ?? PAGINA_VERSOES
  const urlPortatil = dados.portatil?.browser_download_url ?? PAGINA_VERSOES

  document.querySelectorAll('[data-download]').forEach((el) => {
    const plataforma = el.dataset.plataforma
    if (plataforma === 'android') {
      el.href = urlAndroid
      // O APK pode não estar publicado em todas as versões; nesse caso mandamos
      // para a página de versões em vez de um link quebrado.
      if (!dados.android) el.target = '_blank'
    } else {
      el.href = urlWindows
    }
  })

  document.querySelectorAll('[data-portable]').forEach((el) => {
    el.href = urlPortatil
  })
}

/** Sem a API, os links ainda precisam funcionar. */
function usarFallback() {
  document.querySelectorAll('[data-download]').forEach((el) => {
    el.href = el.dataset.plataforma === 'android' ? PAGINA_VERSOES : PAGINA_DOWNLOADS
    el.target = '_blank'
    el.rel = 'noopener'
  })
  document.querySelectorAll('[data-portable]').forEach((el) => {
    el.href = PAGINA_VERSOES
    el.target = '_blank'
    el.rel = 'noopener'
  })
}

async function carregarVersao() {
  try {
    const resposta = await fetch(API, {
      headers: { Accept: 'application/vnd.github+json' }
    })
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)

    const info = await resposta.json()
    const dados = escolherArquivos(Array.isArray(info.assets) ? info.assets : [])

    aplicarDados(info, dados)
    ligarBotoes(dados)
  } catch {
    usarFallback()
  }
}

/** Cabeçalho ganha borda quando a página sai do topo. */
function observarRolagem() {
  const topo = document.getElementById('topo')
  if (!topo) return

  const atualizar = () => {
    topo.classList.toggle('topo--rolado', window.scrollY > 8)
  }
  atualizar()
  window.addEventListener('scroll', atualizar, { passive: true })
}

/**
 * Fecha os outros itens quando um é aberto.
 *
 * Perguntas abertas ao mesmo tempo empurram o conteúdo para baixo e atrapalham
 * a leitura. Um por vez mantém a página previsível.
 */
function acordeaoUnico() {
  const itens = Array.from(document.querySelectorAll('.duvida'))
  for (const item of itens) {
    item.addEventListener('toggle', () => {
      if (!item.open) return
      for (const outro of itens) {
        if (outro !== item) outro.open = false
      }
    })
  }
}

carregarVersao()
observarRolagem()
acordeaoUnico()
