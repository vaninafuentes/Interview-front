/**
 * src/screens/home/home-screen.tsx
 * ----------------------------------
 * Contenedor lógico del Home.
 *
 * Patrón Screen + View:
 * ---------------------
 * HomeScreen = LÓGICA (obtiene datos, maneja acciones)
 * HomeView   = UI pura (recibe props, renderiza)
 *
 * Este archivo:
 *   1. Llama al hook useAuth() para obtener datos del usuario
 *   2. Maneja el estado local de "cerrando sesión"
 *   3. Define el handler de logout
 *   4. Pasa todo a <HomeView /> como props
 *
 * HomeScreen NO sabe nada de styles, colores ni layout.
 * HomeView NO sabe nada de hooks ni lógica de negocio.
 */

import { useState } from 'react';
import { useAuth } from '@/src/hooks/use-auth';
import { HomeView } from './home-view';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <HomeView
      user={user}
      isLoggingOut={isLoggingOut}
      onLogout={handleLogout}
    />
  );
}
