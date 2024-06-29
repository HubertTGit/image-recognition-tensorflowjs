import { loadGraphModel, Tensor, tidy, zeros } from '@tensorflow/tfjs';

export const MOBILE_NET_INPUT_WIDTH = 224;
export const MOBILE_NET_INPUT_HEIGHT = 224;

//for more details of the base model, visit https://www.kaggle.com/models/google/mobilenet-v3/tfJs/small-100-224-feature-vector
const URL =
  'https://www.kaggle.com/models/google/mobilenet-v3/TfJs/small-100-224-feature-vector/1';
export const loadMobileNetFeatureModel = async () => {
  const mobilenet = await loadGraphModel(URL, { fromTFHub: true });

  // Warm up the model by passing zeros through it once.
  tidy(function () {
    const answer = mobilenet.predict(
      zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3])
    ) as Tensor;
    console.log(answer.shape);
  });

  return mobilenet;
};
