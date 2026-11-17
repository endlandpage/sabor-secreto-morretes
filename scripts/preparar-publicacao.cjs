const fs = require('node:fs/promises');
const path = require('node:path');

function httpsOrigin(address) {
  const url = new URL(address);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash ||
      url.username || url.password || url.port || !url.hostname.includes('.')) {
    throw new Error('Informe um domínio HTTPS, sem caminho, credenciais ou porta.');
  }
  return url;
}

async function build(primaryAddress, outputDirectory, menuAddress) {
  if (!primaryAddress || !outputDirectory) {
    throw new Error('Execute node scripts/preparar-publicacao.cjs https://seu-dominio.com.br pasta-de-saida-nova');
  }

  const primary = httpsOrigin(primaryAddress);
  const menuOrigin = menuAddress ? httpsOrigin(menuAddress).origin
    : `https://marmitas.${primary.hostname.replace(/^www\./, '')}`;
  if (primary.origin === menuOrigin) throw new Error('Use endereços distintos para o site e as marmitas.');
  const output = path.resolve(outputDirectory);
  const parent = await fs.realpath(path.dirname(output));
  const target = path.join(parent, path.basename(output));
  const existing = await fs.lstat(target).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (existing) throw new Error('O diretório de saída já existe.');
  const staging = await fs.mkdtemp(path.join(parent, '.sabor-secreto-'));
  const mainDirectory = path.join(staging, 'site');
  const menuDirectory = path.join(staging, 'marmitas');

  try {
    await fs.mkdir(mainDirectory);
    await fs.mkdir(path.join(menuDirectory, 'marmitas'), { recursive: true });
    for (const folder of ['css', 'js', 'images']) {
      await fs.mkdir(path.join(menuDirectory, 'assets', folder), { recursive: true });
    }

    const project = (...parts) => path.join(__dirname, '..', ...parts);
    const main = (await fs.readFile(project('index.html'), 'utf8'))
      .replace('<meta name="robots" content="noindex, nofollow">', `<link rel="canonical" href="${primary.origin}/">`)
      .replace('href="marmitas/index.html"', `href="${menuOrigin}/"`);
    const menu = (await fs.readFile(project('marmitas', 'index.html'), 'utf8'))
      .replace('content="noindex, nofollow"', 'content="noindex, follow"')
      .replaceAll('href="../index.html"', `href="${primary.origin}/"`)
      .replaceAll('../', './');

    const results = await Promise.allSettled([
      fs.writeFile(path.join(mainDirectory, 'index.html'), main),
      fs.writeFile(path.join(menuDirectory, 'index.html'), menu),
      fs.cp(project('assets'), path.join(mainDirectory, 'assets'), { recursive: true }),
      fs.cp(project('marmitas', 'cardapios'), path.join(menuDirectory, 'marmitas', 'cardapios'), { recursive: true }),
      fs.cp(project('assets', 'fonts'), path.join(menuDirectory, 'assets', 'fonts'), { recursive: true }),
      ...['css/site.css', 'css/marmitas.css', 'js/carousel.js', 'images/marca.jpg'].map((file) =>
        fs.copyFile(project('assets', file), path.join(menuDirectory, 'assets', file))),
    ]);

    const failure = results.find((result) => result.status === 'rejected');
    if (failure) throw failure.reason;
    await fs.rename(staging, target);
    console.log(`Site (${primary.origin}): ${path.join(target, 'site')}`);
    console.log(`Marmitas (${menuOrigin}): ${path.join(target, 'marmitas')}`);
  } finally {
    // Remove only the temporary directory created for this invocation.
    const resolved = await fs.realpath(staging).catch(() => null);
    if (resolved === staging && path.dirname(resolved) === parent && path.basename(resolved).startsWith('.sabor-secreto-')) {
      await fs.rm(staging, { recursive: true, force: true });
    }
  }
}

build(process.argv[2], process.argv[3], process.argv[4]).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
