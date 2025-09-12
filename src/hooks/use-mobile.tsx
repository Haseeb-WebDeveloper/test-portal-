import { useMediaQuery } from "react-responsive";

export const useIsMobile = () => {
  return useMediaQuery({ query: "(max-width: 768px)" });
};

export const useIsTablet = () => {
  return useMediaQuery({ query: "(max-width: 1024px)" });
};

export const useIsDesktop = () => {
  return useMediaQuery({ query: "(min-width: 1025px)" });
};

export const useIsLargeDesktop = () => {
  return useMediaQuery({ query: "(min-width: 1280px)" });
};
