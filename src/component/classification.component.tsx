import { useEffect, useState } from 'react';
import { IClassification } from '../interfaces/classification.model';
import { FRAME_RATE_MS } from '../constants/constants';
import { createCanvasContextFromVideo } from '../utils/utilities';

interface ClassificationProps {
  onChangeName: (name: string, index: number) => void;
  onDeleteHandler: (idx: number) => void;
  onRecoderHandler: (
    idx: number,
    frames: string[],
    idxs: number[],
    imageDatas: ImageData[]
  ) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  classification: IClassification;
}

export function Classification({
  onChangeName,
  onDeleteHandler,
  onRecoderHandler,
  videoRef,
  classification,
}: ClassificationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [idx, setIdx] = useState<number[]>([]);
  const [imageDatas, setImageDatas] = useState<ImageData[]>([]);
  const [className, setClassName] = useState<string>();

  useEffect(() => {
    if (className) {
      onChangeName(className, classification.index);
    }
  }, [className, classification.index, onChangeName]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        if (videoRef.current) {
          const canvasUtil = createCanvasContextFromVideo(videoRef.current);
          const { canvas, ctx } = canvasUtil;

          if (ctx) {
            ctx.drawImage(videoRef.current, 80, 0, canvas.width, canvas.height);
            //set image data url to frames
            setFrames((state) => {
              return [...state, canvas.toDataURL()];
            });
            //set index
            setIdx((state) => {
              return [...state, classification.index];
            });
            //set image data
            setImageDatas((state) => {
              return [
                ...state,
                ctx.getImageData(0, 0, canvas.width, canvas.height),
              ];
            });
          }
        }
      }, FRAME_RATE_MS); // 5ms
    } else {
      onRecoderHandler(classification.index, frames, idx, imageDatas);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [
    isRecording,
    classification.index,
    onRecoderHandler,
    frames,
    videoRef,
    idx,
    imageDatas,
  ]);

  const clearFramesHandler = () => {
    setFrames([]);
    setIdx([]);
    setImageDatas([]);
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        onChange={(e) => setClassName(e.target.value)}
        value={className}
      ></input>
      <button
        className="btn btn-error"
        onClick={() => onDeleteHandler(classification.index)}
      >
        Delete
      </button>
      <button
        disabled={!className?.length}
        className="btn btn-primary"
        onMouseDown={() => setIsRecording(true)}
        onMouseUp={() => setIsRecording(false)}
        onMouseLeave={() => setIsRecording(false)}
      >
        Press To Record
      </button>
      <ul className="flex gap-2 flex-wrap">
        {frames.map((shot, idx) => (
          <li key={idx}>
            <img src={shot} alt="" width={100} height={100} />
          </li>
        ))}

        {!!frames.length && (
          <li>
            <button className="btn btn-error" onClick={clearFramesHandler}>
              Delete All Frames{' '}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
