# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Production API URL

In the Vercel project settings, set `VITE_SERVER_URL` for Production to the backend's public origin, such as `https://alpha-ai-backend.onrender.com`, then redeploy the frontend. Do not enter the variable name itself as its value or use a relative path. Set the backend's `FRONTEND_URL` to the Vercel site origin so credentialed API requests pass CORS.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
