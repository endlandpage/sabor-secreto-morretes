# Sabor Secreto · Morretes

Site do Restaurante Sabor Secreto com cozinha, fotos do espaço, carrossel de avaliações e informações para a visita. A página de marmitas abre no dia da semana em Morretes.

## Visualizar

Abra `index.html` no navegador. Entre em **Pedir marmita** ou abra `marmitas/index.html`. As duas páginas funcionam sem instalar dependências.

## Arquivos

- `index.html` contém o conteúdo e os destinos de navegação.
- `assets/css/` contém os estilos do site e do cardápio.
- `assets/js/carousel.js` controla os carrosséis e a seleção do dia.
- `assets/images/` e `assets/fonts/` contêm fotos, marca, fontes e licenças.
- `marmitas/index.html` e `marmitas/cardapios/` formam a página de pedidos.

## Atualizar a semana

Há artes para segunda, terça, quarta e sexta. Para atualizar uma arte, substitua o WebP do dia em `marmitas/cardapios/` e atualize a versão em texto no mesmo slide de `marmitas/index.html`. Para completar quinta, sábado ou domingo, siga o exemplo de sexta. Preserve o atributo `data-day`, acrescente `data-available` e coloque a imagem e a versão em texto. A página seleciona o dia no fuso `America/Sao_Paulo`.

## Publicar no Render

O projeto usa dois Static Sites na branch `main`. O comando abaixo prepara as duas pastas de publicação, com links entre os endereços e sem instalação de dependências.

```sh
node scripts/preparar-publicacao.cjs https://sabor-secreto-morretes.onrender.com .render-build https://sabor-secreto-marmitas.onrender.com
```

- Site do restaurante publica `.render-build/site`.
- Página de marmitas publica `.render-build/marmitas`.

Use os endereços reais atribuídos pelo Render se houver sufixo nos nomes. Para um domínio próprio, troque os endereços no comando e vincule-os a cada site no painel do Render. Sem o terceiro argumento, o script usa `marmitas.<domínio-principal>`.
