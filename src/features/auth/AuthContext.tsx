import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest, toApiError, type ApiError } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { parsePerfil, type Perfil } from './contrato';

export type EstadoSesion =
  | { status: 'cargando' }
  | { status: 'anonimo' }
  | { status: 'sin-username'; user: User }
  | { status: 'autenticado'; user: User; perfil: Perfil }
  | { status: 'error'; user: User; error: ApiError };

interface AuthContextValue {
  estado: EstadoSesion;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  continuarConGoogle: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
  recargarPerfil: () => Promise<void>;
  obtenerToken: () => Promise<string>;
  avisoCierre: boolean;
  descartarAvisoCierre: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>({ status: 'cargando' });
  // Evita que una respuesta lenta pise a una más reciente (por ejemplo, al cerrar sesión).
  const version = useRef(0);
  const [avisoCierre, setAvisoCierre] = useState(false);

  const cargarPerfil = useCallback(async (user: User) => {
    const mia = ++version.current;
    setEstado({ status: 'cargando' });
    try {
      const token = await user.getIdToken();
      const perfil = await apiRequest('/api/users/me', { token, parse: parsePerfil });
      if (mia === version.current) setEstado({ status: 'autenticado', user, perfil });
    } catch (e) {
      if (mia !== version.current) return;
      const error = toApiError(e);
      if (error.status === 404 && error.code !== 'ROUTE_NOT_FOUND') {
        // Tiene cuenta de Firebase pero aún no eligió username (registro con Google).
        setEstado({ status: 'sin-username', user });
      } else if (error.status === 401) {
        await signOut(auth);
      } else {
        setEstado({ status: 'error', user, error });
      }
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        version.current++;
        setEstado({ status: 'anonimo' });
        return;
      }
      setAvisoCierre(false);
      void cargarPerfil(user);
    });
  }, [cargarPerfil]);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    await signInWithEmailAndPassword(auth, correo, contrasena);
  }, []);

  const continuarConGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const cerrarSesion = useCallback(async () => {
    setAvisoCierre(true);
    try {
      await signOut(auth);
    } catch (e) {
      setAvisoCierre(false);
      throw e;
    }
  }, []);

  const descartarAvisoCierre = useCallback(() => setAvisoCierre(false), []);

  const recargarPerfil = useCallback(async () => {
    if (auth.currentUser) await cargarPerfil(auth.currentUser);
  }, [cargarPerfil]);

  const obtenerToken = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No hay una sesión activa.');
    return user.getIdToken();
  }, []);

  const value = useMemo(
    () => ({
      estado,
      avisoCierre,
      descartarAvisoCierre,
      iniciarSesion,
      continuarConGoogle,
      cerrarSesion,
      recargarPerfil,
      obtenerToken,
    }),
    [estado, avisoCierre, descartarAvisoCierre, iniciarSesion, continuarConGoogle, cerrarSesion, recargarPerfil, obtenerToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return contexto;
}