// Caminho do arquivo: src/components/Modal.tsx

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    // Fundo semi-transparente
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
      onClick={onClose} // Fecha o modal ao clicar no fundo
    >
      {/* Container do Modal */}
      <div
        className="bg-gray-800 text-white p-6 rounded-lg shadow-xl z-50 w-full max-w-lg"
        onClick={e => e.stopPropagation()} // Impede que o clique dentro do modal o feche
      >
        {children}
      </div>
    </div>
  );
}