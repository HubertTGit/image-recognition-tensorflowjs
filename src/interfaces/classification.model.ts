export interface IClassification {
  clasificationName: string;
  index: number;
  framesUrlDatas: string[];
  indexes: number[];
  imageDatas: ImageData[];
}

export interface IPredictionResult {
  name: string;
  dataUrl: string;
}
