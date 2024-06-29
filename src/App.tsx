import { useEffect, useRef, useState } from 'react';
import Cam from './component/cam.component';
import { Classification } from './component/classification.component';
import { IClassification } from './interfaces/classification.model';
import { loadMobileNetFeatureModel } from './model/mobilenet';
import {
  browser,
  GraphModel,
  Sequential,
  tidy,
  image,
  tensor2d,
  tensor1d,
  util,
  oneHot,
  stack,
} from '@tensorflow/tfjs';
import { trainedModel } from './model/trained-model';
import {
  BATCH_SIZE,
  EPOCH,
  MOBILE_NET_INPUT_HEIGHT,
  MOBILE_NET_INPUT_WIDTH,
} from './constants/constants';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clasifications, setClasifications] = useState<IClassification[]>([]);
  const [mobileNet, setmobileNet] = useState<GraphModel | null>(null);
  const [localModel, setLocalModel] = useState<Sequential | null>(null);
  const [isModelTrained, setIsModelTrained] = useState<boolean>(false);

  useEffect(() => {
    loadMobileNetFeatureModel().then((model) => {
      setmobileNet(model);
    });
    if (clasifications.length > 0) {
      const local = trainedModel(clasifications.length);
      setLocalModel(local);
    } else {
      setLocalModel(null);
    }
  }, [clasifications.length]);

  const addClassificationHandler = () => {
    setClasifications((state): IClassification[] => {
      if (state.length > 0) {
        return [
          ...state,
          ...[
            {
              clasificationName: `class ${state[state.length - 1].index + 1}`,
              index: state[state.length - 1].index + 1,
              framesUrlData: [],
              idx: [],
              imageData: [],
            },
          ],
        ];
      }
      return [
        {
          clasificationName: 'class 0',
          index: 0,
          framesUrlData: [],
          idx: [],
          imageData: [],
        },
      ];
    });
  };

  const onSetRecordingHandler = (
    idx: number,
    frames: string[],
    idxs: number[],
    imageDatas: ImageData[]
  ) => {
    setClasifications((state) => {
      const index = state.findIndex((c) => c.index === idx);
      state[index].framesUrlData = frames;
      state[index].idx = idxs;
      state[index].imageData = imageDatas;
      return state;
    });
  };
  const removeHandler = (idx: number) => {
    setClasifications((state) => {
      const newState = [...state];
      newState.splice(idx, 1);
      return newState;
    });
  };

  const changeNameHandler = (name: string, idx: number) => {
    setClasifications((state) => {
      const index = state.findIndex((c) => c.index === idx);
      state[index].clasificationName = name;

      return state;
    });
  };

  useEffect(() => {
    initCam(videoRef);
  }, []);

  const train = async () => {
    console.table(clasifications);

    const featureInput = clasifications.reduce((acc, clasification) => {
      return [...acc, ...clasification.imageData];
    }, []) as unknown as ImageData[];

    const trainingDataOutputs = clasifications.reduce((acc, clasification) => {
      return [...acc, ...clasification.idx];
    }, []) as unknown as number[];

    const trainingDataInputs = featureInput.map((d) =>
      calculateFeaturesOnCurrentFrame(d, mobileNet)
    );

    util.shuffleCombo(trainingDataInputs, trainingDataOutputs);

    if (localModel) {
      const outputsAsTensor = tensor1d(trainingDataOutputs, 'int32');
      const oneHotOutputs = oneHot(outputsAsTensor, clasifications.length);
      const inputsAsTensor = stack(trainingDataInputs);

      await localModel.fit(inputsAsTensor, oneHotOutputs, {
        shuffle: true,
        batchSize: BATCH_SIZE,
        epochs: EPOCH,
        callbacks: { onEpochEnd: logProgress },
      });

      outputsAsTensor.dispose();
      oneHotOutputs.dispose();
      inputsAsTensor.dispose();

      setLocalModel(localModel);
      setIsModelTrained(true);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold underline">
        Face Recognition with Tensorflow
      </h1>

      <div className="grid grid-cols-2 gap-1">
        <div>
          <button
            className="btn btn-primary"
            onClick={addClassificationHandler}
            disabled={!mobileNet}
          >
            {mobileNet ? 'Add Face Data' : 'Loading Model'}
          </button>
          <Cam width={640} height={480} ref={videoRef} />
        </div>
        <div>
          <button className="btn btn-outline" onClick={train}>
            Train
          </button>
          <button className="btn btn-primary" disabled={!isModelTrained}>
            Predict
          </button>
          <button className="btn btn-secondary">Reset</button>
        </div>
      </div>

      <ul>
        {clasifications.map((clasification) => (
          <li key={clasification.index}>
            <Classification
              classification={clasification}
              onDeleteHandler={removeHandler}
              onChangeName={changeNameHandler}
              onRecoderHandler={onSetRecordingHandler}
              videoRef={videoRef}
            ></Classification>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

const initCam = (ref: React.RefObject<HTMLVideoElement>) => {
  if (ref.current) {
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (ref.current) {
          ref.current.srcObject = stream;
          ref.current.play();
        }
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
      });
  }
};

const calculateFeaturesOnCurrentFrame = (
  imageDatas: ImageData,
  model?: GraphModel | null
) => {
  return tidy(() => {
    const fromVid = browser.fromPixels(imageDatas);
    const resized = image.resizeBilinear(
      fromVid,
      [MOBILE_NET_INPUT_WIDTH, MOBILE_NET_INPUT_HEIGHT],
      true
    );
    const normalizedTensorFrame = resized.div(255);
    const predict = model!.predict(normalizedTensorFrame.expandDims());

    return predict.squeeze();
  });
};

const logProgress = (epoch: number, logs: any) => {
  console.log(`Epoch ${epoch + 1}: loss = ${logs.loss}`);
};
