import GestaoVistaAreas from "@/components/GestaoVistaAreas";

export default function GestaoVistaPreview() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-5xl mb-4 bg-yellow-100 border border-yellow-300 rounded-xl px-4 py-3 text-yellow-800 text-sm font-medium text-center">
        Rota temporária de visualização — somente para validação interna
      </div>
      <div className="w-full max-w-5xl">
        <GestaoVistaAreas />
      </div>
    </div>
  );
}
