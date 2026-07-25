# MATplayer

Генеративный 3D-плеер: не список треков, а аудиореактивный опыт. Каждый артист —
«остров» в едином 3D-атласе, камера летает между ними по кривым Безье. Вокруг
toon-shaded аватара — облако частиц на curl-noise шейдере, реагирующее на FFT
воспроизводимого трека. Лирика синхронизирована построчно.

**Живая версия:** https://zazser82-methedron.github.io/MATplayer/

## Стек

React 18 · React Three Fiber · Zustand · Web Audio API · кастомные GLSL-шейдеры ·
`@react-three/postprocessing` · Vite · Vitest · Playwright

## Разработка

```bash
npm install
npm run dev      # дев-сервер
npm test         # юнит-тесты (Vitest)
npm run test:e2e # e2e (Playwright)
npm run build    # прод-сборка
```

## Деплой

`git push origin master` → GitHub Actions собирает и публикует на GitHub Pages.

## Документация

- `STATE.md` — текущее состояние и на чём остановились
- `docs/superpowers/specs/` — дизайн-спеки
- `docs/superpowers/plans/` — планы реализации
