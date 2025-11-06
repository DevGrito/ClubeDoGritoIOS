import { useState, useEffect } from "react";
import { Home, Search, Megaphone, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { isLeoMartins, isAdminEmail, isConselhoEmail } from "@shared/conselho";

export default function BottomNav() {
  const [location] = useLocation();
  const [homePath, setHomePath] = useState("/");

  // Function to determine the correct home path based on user login status
  const getHomePath = () => {
    const isLoggedIn = localStorage.getItem("isVerified");
    
    if (!isLoggedIn) {
      return "/";
    }

    // For logged in users, check their specific role/type
    const userPapel = localStorage.getItem("userPapel");
    const userEmail = localStorage.getItem("userEmail");
    const userTelefone = localStorage.getItem("userTelefone");
    
    // First check by papel (role) stored during login
    if (userPapel === "leo") {
      return "/administrador";
    }
    
    if (userPapel === "admin") {
      return "/admin-geral";
    }
    
    if (userPapel === "conselho") {
      return "/conselho";
    }
    
    // Fallback: check by email if available
    if (userEmail && isLeoMartins(userEmail)) {
      return "/administrador";
    }
    
    if (userEmail && isAdminEmail(userEmail)) {
      return "/admin-geral";
    }
    
    if (userEmail && isConselhoEmail(userEmail)) {
      return "/conselho";
    }
    
    // Fallback: check by specific phone numbers for Leo
    if (userTelefone) {
      const normalizedPhone = userTelefone.replace(/\D/g, "");
      if (normalizedPhone === "31986631203") {
        return "/administrador";
      }
      if (normalizedPhone === "31999999999") {
        return "/admin-geral";
      }
      if (normalizedPhone === "31888888888") {
        return "/conselho";
      }
    }
    
    // Default logged in user goes to welcome
    return "/tdoador";
  };

  useEffect(() => {
    // Update home path when component mounts or when storage changes
    const newPath = getHomePath();
    setHomePath(newPath);
    
    // Listen for storage changes
    const handleStorageChange = () => {
      const updatedPath = getHomePath();
      setHomePath(updatedPath);
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom events when localStorage is updated in same tab
    window.addEventListener("localStorageChanged", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorageChanged", handleStorageChange);
    };
  }, [location]); // Add location as dependency to update when route changes

  const navItems = [
    { icon: Home, path: homePath, label: "Início" },
    { icon: Search, path: "/busca", label: "Busca" },
    { icon: Megaphone, path: "/noticias", label: "Notícias" },
    { icon: User, path: "/perfil", label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow z-50">
      <div className="flex justify-around py-2 max-w-xl mx-auto">
        {navItems.map(({ icon: Icon, path, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center text-xs ${
              location === path ? "text-black" : "text-gray-700"
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {path === "/perfil" && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
            <span className="mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
