// Estrutura de arquivos do projeto
// - App.jsx
// - pages/Planos.jsx
// - pages/Cadastro.jsx
// - pages/Verificacao.jsx
// - pages/BoasVindas.jsx
// - index.js
// - tailwind.config.js
// - .env (já enviado anteriormente)

// =========================
// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// =========================
// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Planos from "./pages/Planos";
import Cadastro from "./pages/Cadastro";
import Verificacao from "./pages/Verificacao";
import BoasVindas from "./pages/BoasVindas";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Planos />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/verificar" element={<Verificacao />} />
        <Route path="/boas-vindas" element={<BoasVindas />} />
      </Routes>
    </Router>
  );
}

export default App;

// =========================
// pages/Planos.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const planos = [
  { id: 'eco', nome: 'Plano Eco', descricao: 'O seu Grito começa a se propagar.', preco: 'R$ 9,90' },
  { id: 'voz', nome: 'Plano Voz', descricao: 'Deixe o seu grito tomar força.', preco: 'R$ 19,90' },
  { id: 'grito', nome: 'Plano O Grito', descricao: 'Seu Grito ecoa por toda parte.', preco: 'R$ 29,90' }
];

export default function Planos() {
  const navigate = useNavigate();

  const handleAssinar = (id) => {
    navigate('/cadastro'); // Simulação pós-pagamento
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Escolha seu plano</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
        {planos.map((plano) => (
          <div key={plano.id} className="border p-6 rounded-xl shadow-md text-center">
            <h2 className="text-xl font-semibold mb-2">{plano.nome}</h2>
            <p className="mb-2">{plano.descricao}</p>
            <p className="font-bold mb-4">{plano.preco}</p>
            <button onClick={() => handleAssinar(plano.id)} className="bg-black text-white px-4 py-2 rounded-full">Assinar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================
// pages/Cadastro.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', sobrenome: '', telefone: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('nome', form.nome);
    localStorage.setItem('telefone', form.telefone);
    navigate('/verificar');
  };

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
// pages/Verificacao.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Verificacao() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui chamaria API do backend para verificar com Twilio
    navigate('/boas-vindas');
  };

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

// =========================
// pages/BoasVindas.jsx
import React from 'react';

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function BoasVindas() {
  const nome = localStorage.getItem('nome') || 'Usuário';

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-center items-center">
      <img src="/logo.png" alt="Clube do Grito" className="w-32 mb-4" />
      <h1 className="text-2xl font-bold">Fala, {nome}. {saudacao()}!</h1>
      <p className="mt-2">Seja bem-vinda ao Clube do Grito.</p>
    </div>
  );
}

// =========================
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
