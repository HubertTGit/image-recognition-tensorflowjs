import { useEffect, useRef, useState } from 'react';
import Cam from './component/cam.component';
import { Classification } from './component/classification.component';
import {
  IClassification,
  IPredictionResult,
} from './interfaces/classification.model';
import { loadMobileNetFeatureModel } from './model/mobilenet';
import {
  browser,
  GraphModel,
  Sequential,
  tidy,
  image,
  tensor1d,
  util,
  oneHot,
  stack,
} from '@tensorflow/tfjs';
import { trainedModel } from './model/trained-model';
import {
  BATCH_SIZE,
  EPOCH,
  FRAME_RATE_MS,
  MOBILE_NET_INPUT_HEIGHT,
  MOBILE_NET_INPUT_WIDTH,
} from './constants/constants';
import { createCanvasContextFromVideo } from './utils/utilities';
import { Button } from '@/components/ui/button';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clasifications, setClasifications] = useState<IClassification[]>([]);
  const [mobileNet, setmobileNet] = useState<GraphModel | null>(null);
  const [localModel, setLocalModel] = useState<Sequential | null>(null);
  const [isModelTrained, setIsModelTrained] = useState<boolean>(false);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] =
    useState<IPredictionResult | null>(null);
  const [trainProgress, setTrainProgress] = useState<string[]>([]);

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
      return state.filter((c) => c.index !== idx);
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

  // predict result
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPredicting) {
      timer = setInterval(() => {
        if (localModel) {
          tidy(() => {
            if (!videoRef.current) return;

            const { canvas, ctx } = createCanvasContextFromVideo(
              videoRef.current
            );
            const dataImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const feature = calculateFeaturesOnCurrentFrame(dataImg, mobileNet);

            const prediction = localModel
              .predict(feature.expandDims())
              .squeeze();
            const highestIndex = prediction.argMax().arraySync(); // 0 or 1
            //const predictionArray = prediction.arraySync(); // [0.1, 0.9]

            const theResult: IPredictionResult = {
              name: clasifications[highestIndex].clasificationName,
              dataUrl: clasifications[highestIndex].framesUrlData[highestIndex],
            };
            setPredictionResult(theResult);
          });
        }
      }, FRAME_RATE_MS);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPredicting, localModel, mobileNet, clasifications]);

  const reset = () => {
    setClasifications([]);
    setIsModelTrained(false);
    setPredictionResult(null);
    setIsPredicting(false);
    setTrainProgress([]);
  };

  const logProgress = (epoch: number, logs: any) => {
    const progress = `Epoch ${epoch + 1}: loss = ${logs.loss}`;
    setTrainProgress((state) => [...state, progress]);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold underline">
        Face Recognition with Tensorflow
      </h1>

      <div className="grid grid-cols-2 gap-1">
        <div>
          <Button
            className="btn btn-primary"
            onClick={addClassificationHandler}
            disabled={!mobileNet}
          >
            {mobileNet ? 'Add Face Data' : 'Loading Model'}
          </Button>
          <Cam width={480} height={480} ref={videoRef} />
        </div>
        <div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline"
              onClick={train}
              disabled={!clasifications.length}
            >
              Train
            </button>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Scan and Predict</span>
                <input
                  disabled={!isModelTrained}
                  type="checkbox"
                  className="toggle"
                  checked={isPredicting ? true : false}
                  onChange={() => setIsPredicting((result) => !result)}
                />
              </label>
            </div>

            <button
              className="btn btn-secondary"
              onClick={reset}
              disabled={!isModelTrained}
            >
              Reset
            </button>
          </div>

          {predictionResult && (
            <div>
              <h1 className="text-2xl text-green-400">
                {predictionResult?.name}
              </h1>

              <img
                src={predictionResult?.dataUrl}
                alt="prediction"
                className="w-[480px] h-[480px]"
              />
            </div>
          )}

          <ul>
            {trainProgress.map((progress) => (
              <li key={progress}>{progress}</li>
            ))}
          </ul>
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
        width: { ideal: 480 },
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
