import './styles.css';
import { toys } from './manifest';

const grid = document.querySelector<HTMLElement>('#toy-grid')!;
const template = document.querySelector<HTMLTemplateElement>('#toy-card')!;

toys.forEach((toy, index) => {
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const card = fragment.querySelector<HTMLElement>('.toy-card')!;
  const link = fragment.querySelector<HTMLAnchorElement>('.toy-link')!;
  const image = fragment.querySelector<HTMLImageElement>('img')!;
  card.style.setProperty('--delay', `${index * 55}ms`);
  card.dataset.status = toy.status;
  image.src = toy.image;
  image.alt = `${toy.name}复古玩具盒插图`;
  image.loading = index < 2 ? 'eager' : 'lazy';
  fragment.querySelector<HTMLElement>('.toy-verb')!.textContent = toy.verb;
  fragment.querySelector<HTMLElement>('.toy-name')!.textContent = toy.name;
  fragment.querySelector<HTMLElement>('.toy-kana')!.textContent = toy.kana;
  fragment.querySelector<HTMLElement>('.toy-description')!.textContent = toy.description;
  fragment.querySelector<HTMLElement>('.toy-status')!.textContent = toy.status;
  fragment.querySelector<HTMLElement>('.toy-package')!.textContent = toy.packageName ?? 'COMING SOON';
  if (toy.href) {
    link.href = toy.href;
    link.textContent = toy.external ? '拿出来玩 ↗' : '拿出来玩 →';
    if (toy.external) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
  } else {
    link.removeAttribute('href');
    link.textContent = '还在盒子里';
    link.setAttribute('aria-disabled', 'true');
  }
  grid.append(fragment);
});
