import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";

interface CreditCardDisplayProps {
  className?: string;
  userName?: string;
  donorId?: number;
  onClick?: () => void;
}

export default function CreditCardDisplay({ 
  className = "", 
  userName = "—",
  donorId,
  onClick 
}: CreditCardDisplayProps) {
  const lastFourDigits = donorId ? String(donorId).padStart(4, '0').slice(-4) : "0000";
  const fingerprint = donorId ? `donor${String(donorId).padStart(8, '0')}` : "wrSurlFbddpZCVON";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
      data-testid="credit-card-display"
    >
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg border-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
        
        <CardHeader className="relative z-10">
          <div className="flex justify-between items-start">
            <CreditCard className="w-10 h-10 text-white/90" />
            <div className="text-right">
              <div className="text-lg font-bold tracking-wider">VISA</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-6">
          <div className="space-y-1">
            <p className="text-xs text-white/70 uppercase tracking-wide">Número</p>
            <div className="flex items-center gap-3">
              <span className="text-lg">••••</span>
              <span className="text-lg">••••</span>
              <span className="text-lg">••••</span>
              <span className="text-2xl font-bold tracking-wider">{lastFourDigits}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-xs text-white/70 uppercase tracking-wide">Nome</p>
              <p className="text-sm font-medium">{userName}</p>
            </div>
            
            <div className="space-y-1 text-right">
              <p className="text-xs text-white/70 uppercase tracking-wide">Vencimento</p>
              <p className="text-sm font-medium">6 / 2029</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-white/70 uppercase tracking-wide">Impressão digital</p>
            <p className="text-xs font-mono text-white/80">{fingerprint}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
