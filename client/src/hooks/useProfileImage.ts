import { useState, useEffect } from 'react';
import { useUserData } from './useUserData';

export function useProfileImage() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState<number>(Date.now());
  const { userData } = useUserData();

  useEffect(() => {
    // ⭐ VERIFICAR SE É MODO DEV
    const urlParams = new URLSearchParams(window.location.search);
    const isDevAccess = urlParams.get('dev_access') === 'true';
    const isFromDevPanel = urlParams.get('origin') === 'dev_panel';
    const devPanelActive = localStorage.getItem('dev_panel_active') === 'true';
    const devPanelTimestamp = localStorage.getItem('dev_panel_timestamp');
    const isRecentDevPanel = devPanelTimestamp && (Date.now() - parseInt(devPanelTimestamp)) < 60000;
    
    const isDevMode = (isDevAccess && isFromDevPanel) || (devPanelActive && isRecentDevPanel);
    
    // 🔍 DEBUG: Log detalhado
    console.log('🔍 [useProfileImage] Debug:', {
      isDevAccess,
      isFromDevPanel,
      devPanelActive,
      devPanelTimestamp,
      isRecentDevPanel,
      isDevMode,
      fotoPerfil: userData.fotoPerfil
    });
    
    // Em modo dev, não carregar foto (mostrar iniciais)
    if (isDevMode) {
      console.log('✅ [useProfileImage] Modo dev - usando iniciais do Leo');
      setProfileImage(null);
      return;
    }
    
    const userId = localStorage.getItem("userId");
    
    if (userData.fotoPerfil && userId) {
      // Convert object storage URL to local endpoint with cache busting
      const timestamp = Date.now();
      const localImageUrl = `/api/users/${userId}/profile-image?v=${timestamp}`;
      
      setProfileImage(localImageUrl);
      setImageVersion(timestamp);
      
      // Save timestamp to detect changes
      localStorage.setItem("hasProfileImage", "true");
      localStorage.setItem("profileImageTimestamp", userData.fotoPerfil);
    } else {
      console.log('❌ Nenhuma imagem encontrada no banco');
      setProfileImage(null);
      localStorage.removeItem("hasProfileImage");
      localStorage.removeItem("profileImageTimestamp");
    }
  }, [userData.fotoPerfil]);

  const updateProfileImage = () => {
    // Force refresh with new timestamp
    const userId = localStorage.getItem("userId");
    if (userId) {
      const newTimestamp = Date.now();
      const newImageUrl = `/api/users/${userId}/profile-image?v=${newTimestamp}`;
      setProfileImage(newImageUrl);
      setImageVersion(newTimestamp);
      
      // Trigger user data refresh to get updated fotoPerfil
      window.dispatchEvent(new Event('userDataUpdate'));
    }
  };

  return { profileImage, updateProfileImage, imageVersion };
}