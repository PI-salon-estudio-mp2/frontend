import { Route, Routes } from 'react-router';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './features/auth/RequireAuth';
import { Accesibilidad } from './pages/Accesibilidad';
import { CrearSala } from './pages/CrearSala';
import { EditarSala } from './pages/EditarSala';
import { ElegirUsername } from './pages/ElegirUsername';
import { IniciarSesion } from './pages/IniciarSesion';
import { Inicio } from './pages/Inicio';
import { NoEncontrado } from './pages/NoEncontrado';
import { Panel } from './pages/Panel';
import { Perfil } from './pages/Perfil';
import { Registro } from './pages/Registro';
import { Sala } from './pages/Sala';
import { UnirseSala } from './pages/UnirseSala';
import { RUTAS } from './routes/rutas';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={RUTAS.inicio} element={<Inicio />} />

        {/* Públicas: autenticación */}
        <Route path={RUTAS.ingresar} element={<IniciarSesion />} />
        <Route path={RUTAS.registro} element={<Registro />} />
        <Route path={RUTAS.elegirUsername} element={<ElegirUsername />} />

        {/* Privadas: exigen sesión iniciada */}
        <Route element={<RequireAuth />}>
          <Route path={RUTAS.panel} element={<Panel />} />
          <Route path={RUTAS.perfil} element={<Perfil />} />
          <Route path={RUTAS.crearSala} element={<CrearSala />} />
          <Route path={RUTAS.unirseSala} element={<UnirseSala />} />
          <Route path={RUTAS.sala} element={<Sala />} />
          <Route path={RUTAS.editarSala} element={<EditarSala />} />
        </Route>

        <Route path={RUTAS.accesibilidad} element={<Accesibilidad />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}