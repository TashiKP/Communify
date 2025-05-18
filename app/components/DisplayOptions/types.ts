import { ContrastModeType, TextSizeType } from "../../context/AppearanceContext";


export interface DisplayScreenSettings {
  brightness: number;
  textSize: TextSizeType;
  darkModeEnabled: boolean;
  contrastMode: ContrastModeType;
}