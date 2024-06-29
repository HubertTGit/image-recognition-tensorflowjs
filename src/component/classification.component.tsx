import { useEffect, useState } from 'react';
import { IClassification } from '../model/classification.model';

interface ClassificationProps {
  onChangeName: (name: string, index: number) => void;
  onDeleteHandler: (idx: number) => void;
  onRecoderHandler: (idx: number, frames: string[]) => void;
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
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            setFrames((state) => {
              return [...state, canvas.toDataURL()];
            });
          }
        }
      }, 250);
    } else {
      onRecoderHandler(classification.index, frames);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording, classification.index, onRecoderHandler, frames, videoRef]);

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
        className="btn btn-primary"
        onMouseDown={() => setIsRecording(true)}
        onMouseUp={() => setIsRecording(false)}
        onMouseLeave={() => setIsRecording(false)}
      >
        Press To Record
      </button>
      <p>{frames.length}</p>
      <ul className="flex gap-2 flex-wrap">
        {frames.map((shot, idx) => (
          <li key={idx}>
            <img src={shot} alt="" width={100} height={100} />
          </li>
        ))}
      </ul>
    </div>
  );
}
