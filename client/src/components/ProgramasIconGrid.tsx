import { BookOpen, Heart, Users, ShoppingBag, Briefcase } from "lucide-react";

interface Props {
  onPEC: () => void;
  onPsicossocial: () => void;
  onF3D: () => void;
  onNegocios: () => void;
  onInclusao: () => void;
}

export function ProgramasIconGrid({ onPEC, onPsicossocial, onF3D, onNegocios, onInclusao }: Props) {
  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      <div className="flex gap-4 w-max items-start">
        <button
          onClick={onPEC}
          className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
          data-testid="card-programa-pec"
        >
          <div className="w-20 h-20 bg-yellow-200 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
            <BookOpen className="w-10 h-10 text-gray-800" />
          </div>
          <span className="text-sm text-gray-800 font-semibold text-center">PEC</span>
        </button>

        <button
          onClick={onPsicossocial}
          className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
          data-testid="card-programa-psicossocial"
        >
          <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
            <Heart className="w-10 h-10 text-gray-800" />
          </div>
          <span className="text-sm text-gray-800 font-semibold text-center leading-tight">Psicossocial</span>
        </button>

        <button
          onClick={onF3D}
          className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
          data-testid="card-programa-f3d"
        >
          <div className="w-20 h-20 bg-purple-300 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
            <Users className="w-10 h-10 text-gray-800" />
          </div>
          <span className="text-sm text-gray-800 font-semibold text-center">F3D</span>
        </button>

        <button
          onClick={onNegocios}
          className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
          data-testid="card-programa-negocios"
        >
          <div className="w-20 h-20 bg-yellow-300 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
            <ShoppingBag className="w-10 h-10 text-gray-800" />
          </div>
          <span className="text-sm text-gray-800 font-semibold text-center leading-tight max-w-[80px]">Negócios Sociais</span>
        </button>

        <button
          onClick={onInclusao}
          className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
          data-testid="card-programa-inclusao"
        >
          <div className="w-20 h-20 bg-amber-200 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
            <Briefcase className="w-10 h-10 text-gray-800" />
          </div>
          <span className="text-sm text-gray-800 font-semibold text-center leading-tight max-w-[80px]">Inclusão Produtiva</span>
        </button>
      </div>
    </div>
  );
}
