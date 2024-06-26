import { useEffect, useRef } from 'react';
import Cam from './component/cam.component';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initCam(videoRef);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Transfer Learning</h1>
      <Cam width={640} height={480} ref={videoRef} />
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
