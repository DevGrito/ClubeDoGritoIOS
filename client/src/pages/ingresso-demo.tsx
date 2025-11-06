import { useEffect } from "react";
import { useLocation } from "wouter";

export default function IngressoDemoPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/pagamento-ingresso');
  }, [setLocation]);

  return null;
}
