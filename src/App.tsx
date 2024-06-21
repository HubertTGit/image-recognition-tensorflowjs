import { useEffect, useRef } from 'react';
import { GraphModel, loadGraphModel } from '@tensorflow/tfjs';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  let animation: number;
  let model: GraphModel;

  const predictCam = () => {
    console.log('xxxxx', videoRef.current);

    //model.predict(data);
    //console.log('h');

    animation = window.requestAnimationFrame(predictCam);
  };

  const startCam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;

      model = await loadGraphModel(
        '/kaggle/input/movenet/tfjs/singlepose-lightning/1',
        { fromTFHub: true }
      );

      //videoRef.current.addEventListener('loadeddata', predictCam);
    }
  };

  useEffect(() => {
    startCam();

    return () => {
      if (animation) {
        window.cancelAnimationFrame(animation);
      }
    };
  }, []);

  return (
    <>
      <video ref={videoRef} autoPlay></video>
    </>
  );
}

export default App;
