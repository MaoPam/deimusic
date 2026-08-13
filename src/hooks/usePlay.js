import { useState } from 'react';
import { player } from '../services/player.js';
import { usePlayerState } from './usePlayerState.js';

export const usePlaylist = () => {
  const { current, queue: queueServidor } = usePlayerState();

  // Copia local para poder reordenar al instante al soltar el drag; cuando el
  // servidor manda una cola nueva, esa copia se descarta y manda la del servidor.
  const [queue, setQueue] = useState(queueServidor);
  const [ultimaDelServidor, setUltimaDelServidor] = useState(queueServidor);
  if (ultimaDelServidor !== queueServidor) {
    setUltimaDelServidor(queueServidor);
    setQueue(queueServidor);
  }

  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const cmd = (endpoint, body) => player.command(endpoint, body).catch(() => {});

  const onDragStart = (e, i) => { setDragging(i); e.dataTransfer.effectAllowed = 'move'; };
  const onDragEnter = (e, i) => { e.preventDefault(); if (i !== dragging) setDragOver(i); };
  const onDragOver  = (e)    => e.preventDefault();
  const onDragEnd   = ()     => { setDragging(null); setDragOver(null); };

  const onDrop = (e, toIndex) => {
    e.preventDefault();
    setDragging(null);
    setDragOver(null);
    if (dragging === null || dragging === toIndex) return;

    const next = [...queue];
    const [item] = next.splice(dragging, 1);
    next.splice(toIndex, 0, item);
    setQueue(next);
    cmd('move', { from: dragging, to: toIndex });
  };

  return {
    queue, current, cmd,
    dragging, dragOver,
    onDragStart, onDragEnter, onDragOver, onDragEnd, onDrop,
  };
};
