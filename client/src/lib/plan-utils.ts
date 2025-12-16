// Plan images
import gritoImage from "@assets/O GRITO_ilustracao_personagens-06_1752082042712.png";
import ecoImage from "@assets/O GRITO_ilustracao_personagens-03_1752082053539.png";
import vozImage from "@assets/O GRITO_ilustracao_personagens-05_1752082064753.png";

export const getPlanImage = (planId: string) => {
  switch (planId) {
    case "eco":
      return ecoImage;
    case "voz":
      return vozImage;
    case "grito":
      return gritoImage;
    default:
      return ecoImage;
  }
};

export const planDisplayNames = {
  eco: "Eco - R$ 9,90/mês",
  voz: "Voz - R$ 19,90/mês", 
  grito: "O Grito - R$ 29,90/mês",
};