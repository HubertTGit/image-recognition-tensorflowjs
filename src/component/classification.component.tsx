import { useEffect, useState } from 'react';
import { IClassification } from '../interfaces/classification.model';
import { FRAME_RATE_MS } from '../constants/constants';
import { createCanvasContextFromVideo } from '../utils/utilities';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CameraIcon,
  PlayIcon,
  TrashIcon,
  VideoIcon,
} from '@radix-ui/react-icons';

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
  const [className, setClassName] = useState<string>('');

  useEffect(() => {
    if (className) {
      onChangeName(className, classification.index);
    }
  }, [className, classification.index, onChangeName]);

  useEffect(() => {
    console.log('classification', classification);
  }, [classification]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        if (videoRef.current) {
          const canvasUtil = createCanvasContextFromVideo(videoRef.current);
          const { canvas, ctx } = canvasUtil;

          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
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
    <Card className="p-2">
      <div className="flex justify-between gap-2">
        <Input
          type="text"
          placeholder="Enter a name"
          onChange={(e) => setClassName(e.target.value)}
          value={className}
        ></Input>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDeleteHandler(classification.index)}
        >
          <TrashIcon></TrashIcon>
        </Button>

        <Button
          className="indicator"
          disabled={!className?.length}
          variant="outline"
          onMouseDown={() => setIsRecording(true)}
          onMouseUp={() => setIsRecording(false)}
          onMouseLeave={() => setIsRecording(false)}
        >
          <span className="indicator-item badge badge-secondary">
            {frames.length}
          </span>
          Press To Record
          <PlayIcon></PlayIcon>
        </Button>
      </div>

      <div className="overflow-y-auto h-72 my-2">
        <ul className="flex gap-2 flex-wrap">
          {frames.map((shot, idx) => (
            <li key={idx}>
              <img
                src={shot}
                alt=""
                width={50}
                height={50}
                className="rounded-md"
              />
            </li>
          ))}

          {!!frames.length && (
            <li>
              <Button variant="outline" onClick={clearFramesHandler}>
                Delete Frames
              </Button>
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
}
