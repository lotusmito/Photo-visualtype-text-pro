
export type FontOption = 
  | 'Inter' 
  | 'Playfair Display' 
  | 'Roboto Mono' 
  | 'Bebas Neue' 
  | 'Montserrat' 
  | 'Pacifico' 
  | 'Lora' 
  | 'Caveat' 
  | 'Oswald' 
  | 'Dancing Script' 
  | 'Anton'
  | 'Noto Sans TC'
  | 'Noto Serif TC'
  | 'Ma Shan Zheng'
  | 'Zhi Mang Xing'
  | 'Long Cang';

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  color: string;
  backgroundColor: string; // Used for masking original text
  padding: number;
  fontFamily: FontOption;
  fontWeight: string;
  opacity: number;
  maskWidth?: number; // normalized 0-100
  maskHeight?: number; // normalized 0-100
}

export interface DetectedText {
  text: string;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}