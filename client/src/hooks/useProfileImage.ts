import { useState, useEffect } from 'react';
import { useUserData } from './useUserData';

export function useProfileImage() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { userData } = useUserData();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setProfileImage(null);
      return;
    }

    if (userData.fotoPerfil) {
      const timestamp = Date.now();
      const url = `/api/users/${userId}/profile-image?v=${timestamp}`;
      setProfileImage(url);
    } else {
      setProfileImage(null);
    }
  }, [userData.fotoPerfil]);

  const updateProfileImage = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const timestamp = Date.now();
    const url = `/api/users/${userId}/profile-image?v=${timestamp}`;
    setProfileImage(url);

    window.dispatchEvent(new Event("userDataUpdate"));
  };

  return { 
    profileImage,
    updateProfileImage 
  };
}
