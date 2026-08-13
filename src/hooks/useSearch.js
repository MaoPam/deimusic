import { useState, useEffect, useRef } from 'react';
import { player } from '../services/player.js';

const TOAST_MS = 3000;

export const useSearch = () => {
  const [busqueda, setBusqueda]     = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando]     = useState(false);
  const [modalAbierto, setModal]    = useState(false);
  const [toast, setToast]           = useState(null);
  const [encolando, setEncolando]   = useState(null);

  const toastRef = useRef(null);
  useEffect(() => () => clearTimeout(toastRef.current), []);

  const mostrarToast = (contenido) => {
    clearTimeout(toastRef.current);
    setToast(contenido);
    toastRef.current = setTimeout(() => setToast(null), TOAST_MS);
  };

  const cerrarModal = () => {
    setModal(false);
    setResultados([]);
    setBusqueda('');
  };

  const manejarBusqueda = async (e) => {
    e.preventDefault();
    if (busqueda.trim() === '') return;
    setCargando(true);
    setResultados([]);
    setModal(true);
    try {
      setResultados(await player.search(busqueda));
    } catch {
      mostrarToast({ error: true, title: 'No se pudo conectar' });
      setModal(false);
    } finally {
      setCargando(false);
    }
  };

  const ponerEnCola = async (track) => {
    if (encolando) return;
    setEncolando(track.id);
    try {
      await player.enqueue(track);
      mostrarToast(track);
      cerrarModal();
    } catch {
      mostrarToast({ error: true, title: 'Error al encolar' });
    } finally {
      setEncolando(null);
    }
  };

  return {
    busqueda, setBusqueda,
    resultados, cargando,
    modalAbierto, cerrarModal,
    manejarBusqueda, ponerEnCola,
    encolando, toast,
  };
};
