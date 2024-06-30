export interface IClassification {
  clasificationName: string;
  index: number;
  framesUrlData: string[];
  idx: number[];
  imageData: ImageData[];
}

export interface IPredictionResult {
  name: string;
  dataUrl: string;
}
