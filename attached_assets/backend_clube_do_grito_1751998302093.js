// Estrutura atualizada com Loading
// Adições:
// - Componente Loading.jsx
// - Uso do loading nas telas Cadastro.jsx e Verificacao.jsx

// =========================
// src/components/Loading.jsx
import React from "react";
import Lottie from "lottie-react";
import animationData from "../assets/Animation.json";

export default function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <div className="w-72 h-72">
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
}

// =========================
// pages/Cadastro.jsx (com loading)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', sobrenome: '', telefone: '' });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setCarregando(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('nome', form.nome);
    localStorage.setItem('telefone', form.telefone);
    navigate('/verificar');
  };

  if (carregando) return <Loading />;

  return (
    <div className="min-h-screen bg-white text-black p-6 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-6">Complete seu cadastro</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <input type="text" name="nome" placeholder="Nome" onChange={handleChange} className="w-full border px-4 py-2 rounded" required />
        <input type="text" name="sobrenome" placeholder="Sobrenome" onChange={handleChange} className="w-full border px-4 py-2 rounded" required />
        <input type="tel" name="telefone" placeholder="Telefone com DDD" onChange={handleChange} className="w-full border px-4 py-2 rounded" required />
        <button type="submit" className="bg-black text-white px-6 py-2 rounded-full">Continuar</button>
      </form>
    </div>
  );
}

// =========================
// pages/Verificacao.jsx (com loading)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';

export default function Verificacao() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setCarregando(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/boas-vindas');
  };

  if (carregando) return <Loading />;

  return (
    <div className="min-h-screen bg-white text-black p-6 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-6">Digite o código enviado por SMS</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="w-full border px-4 py-2 rounded" placeholder="Código de verificação" required />
        <button type="submit" className="bg-black text-white px-6 py-2 rounded-full">Verificar</button>
      </form>
    </div>
  );
}
