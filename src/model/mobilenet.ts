import { loadGraphModel, Tensor, tidy, zeros } from '@tensorflow/tfjs';
import {
  MOBILE_NET_INPUT_HEIGHT,
  MOBILE_NET_INPUT_WIDTH,
  MOBILE_NET_URL,
} from '../constants/constants';

export const loadMobileNetFeatureModel = async () => {
  const mobilenet = await loadGraphModel(MOBILE_NET_URL, { fromTFHub: true });

  // Warm up the model by passing zeros through it once.
  tidy(function () {
    const answer = mobilenet.predict(
      zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3])
    ) as Tensor;
    console.log(answer.shape);
  });

  return mobilenet;
};
export { MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH };
