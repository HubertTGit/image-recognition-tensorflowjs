import { useEffect, useRef, useState, FocusEvent } from 'react';
import Cam from './component/cam.component';
import {
  Classification,
  IClassification,
} from './component/classification.component';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clasifications, setClasifications] = useState<IClassification[]>([]);

  const addClassificationHandler = () => {
    setClasifications((state): IClassification[] => {
      if (state.length > 0) {
        return [
          ...state,
          ...[
            {
              clasificationName: `class ${state[state.length - 1].index + 1}`,
              index: state[state.length - 1].index + 1,
            },
          ],
        ];
      }
      return [
        {
          clasificationName: 'class 0',
          index: 0,
        },
      ];
    });
  };

  const removeHandler = (idx: number) => {
    setClasifications((state) => {
      const newState = [...state];
      newState.splice(idx, 1);
      return newState;
    });
  };

  const changeNameHandler = (e: FocusEvent<HTMLInputElement>, idx: number) => {
    setClasifications((state) => {
      const changedName = e.target.value;
      const index = state.findIndex((c) => c.index === idx);
      state[index].clasificationName = changedName;

      return state;
    });
  };

  useEffect(() => {
    initCam(videoRef);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Transfer Learning</h1>
      <Cam width={640} height={480} ref={videoRef} />
      <ul>
        {clasifications.map((clasification) => (
          <li key={clasification.index}>
            <Classification
              cla={clasification}
              onDeleteHandler={removeHandler}
              onSetHandler={changeNameHandler}
            ></Classification>
          </li>
        ))}
      </ul>

      <button className="btn btn-primary" onClick={addClassificationHandler}>
        Add Class
      </button>
      <button className="btn btn-outline">Train and Predict</button>
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
