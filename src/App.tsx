import { useEffect, useRef, useState } from 'react';
import Cam from './component/cam.component';
import { ClassificationCmp } from './component/classification.component';
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
import { SunIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Toggle } from './components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { useAtom } from 'jotai';
import { classificationsState } from './states/classifications.state';
import { toast } from 'sonner';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clasifications, setClasifications] =
    useAtom<IClassification[]>(classificationsState);
  const [mobileNet, setmobileNet] = useState<GraphModel | null>(null);
  const [localModel, setLocalModel] = useState<Sequential | null>(null);
  const [isModelTrained, setIsModelTrained] = useState<boolean>(false);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] =
    useState<IPredictionResult | null>(null);
  const [trainProgress, setTrainProgress] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);

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
              framesUrlDatas: [],
              indexes: [],
              imageDatas: [],
            },
          ],
        ];
      }
      return [
        {
          clasificationName: 'class 0',
          index: 0,
          framesUrlDatas: [],
          indexes: [],
          imageDatas: [],
        },
      ];
    });
  };

  const trainSamples = async () => {
    setIsTraining(true);
    setTrainProgress([]);
    try {
      const featureInput = clasifications.reduce((acc, clasification) => {
        return [...acc, ...clasification.imageDatas];
      }, []) as unknown as ImageData[];

      const trainingDataOutputs = clasifications.reduce(
        (acc, clasification) => {
          return [...acc, ...clasification.indexes];
        },
        []
      ) as unknown as number[];

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
        setIsTraining(false);

        toast.success('model trained successfully');
      }
    } catch (error) {
      toast.error(error.message);
      setIsTraining(false);
      setTrainProgress([]);
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
              dataUrl:
                clasifications[highestIndex].framesUrlDatas[highestIndex],
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

  const initCam = () => {
    if (videoRef.current) {
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
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setShowCamera(true);
          }
        })
        .catch(() => {
          toast.error('error loading camera. please try again');
        });
    }
  };

  const startCamera = () => {
    initCam();
  };

  return (
    <div className=" flex justify-center items-center">
      <div>
        <h1 className="text-3xl font-bold text-center p-5">
          Trainable object detection
        </h1>

        {!showCamera && (
          <div className="text-center">
            {mobileNet ? (
              <Button
                onClick={startCamera}
                className={`${showCamera && 'invisible'} `}
              >
                Activate Camera
              </Button>
            ) : (
              <div>
                <span className="loading loading-spinner loading-lg"></span>
                <p>loading base model ...</p>
              </div>
            )}
          </div>
        )}

        <div className={`flex gap-5 p-5  ${!showCamera && 'invisible'}`}>
          <div className="sticky top-0 ">
            <Cam width={480} height={480} ref={videoRef} />
          </div>
          <div>
            <Tabs defaultValue="add" className="w-[850px]">
              <TabsList className="grid w-full grid-cols-3 sticky top-5">
                <TabsTrigger value="add">
                  Add &nbsp;
                  {!!clasifications.length && (
                    <Badge>{clasifications.length} item(s)</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="train">Train</TabsTrigger>
                <TabsTrigger value="predict">Predict</TabsTrigger>
              </TabsList>
              <TabsContent value="add">
                <Card>
                  <CardHeader>
                    <CardTitle>Classifications </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul>
                      {clasifications.map((_, index) => (
                        <li key={index} className="pb-2">
                          <ClassificationCmp
                            classificationIdx={index}
                            videoRef={videoRef}
                          ></ClassificationCmp>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={addClassificationHandler}
                    >
                      <PlusCircledIcon />
                      &nbsp; Add
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="train">
                <Card>
                  <CardContent className="p-5">
                    <Button
                      onClick={trainSamples}
                      disabled={clasifications.length < 2}
                    >
                      {isTraining ? 'Training...' : 'Train sample images'}
                    </Button>
                    <ul className="pt-5">
                      {trainProgress.map((progress) => (
                        <li key={progress}>{progress}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="predict">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <div>Predict the Result</div>
                      <Button onClick={reset} disabled={!isModelTrained}>
                        Reset
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="hero bg-base-300">
                      <div className="hero-content text-center">
                        <div className="max-w-md">
                          {predictionResult && (
                            <div className="mb-5">
                              <h1 className="text-5xl font-bold text-green-400 mb-5">
                                {predictionResult?.name}
                              </h1>

                              <img
                                src={predictionResult?.dataUrl}
                                alt="prediction"
                                className="w-[480px] h-[480px] rounded-lg"
                              />
                            </div>
                          )}

                          {isModelTrained && (
                            <Toggle
                              className="w-full"
                              aria-label="Toggle italic"
                              variant="outline"
                              onClick={() =>
                                setIsPredicting((result) => !result)
                              }
                            >
                              <div className="mr-2">
                                Predicting {isPredicting ? 'On' : 'Off'}
                              </div>
                              <SunIcon
                                className={`h-4 w-4 ${
                                  isPredicting && 'animate-spin'
                                }`}
                              />
                            </Toggle>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

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
