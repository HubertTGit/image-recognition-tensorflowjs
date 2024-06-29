import { useState, FocusEvent, useEffect, useRef } from 'react';

export interface IClassification {
  clasificationName: string;
  index: number;
}
interface ClassificationProps {
  onSetHandler: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onDeleteHandler: (idx: number) => void;
  cla: IClassification;
}

export function Classification({
  onSetHandler,
  onDeleteHandler,

  cla,
}: ClassificationProps) {
  const [clasification, setClasification] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [animationFrame, setAnimationFrame] = useState<string[]>([]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isRecording) {
      t = setInterval(() => {
        setAnimationFrame((state) => [...state, '']);
      }, 240);
    }

    return () => clearInterval(t);
  }, [isRecording]);

  useEffect(() => {
    setClasification(cla.clasificationName);
  }, [cla]);

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        onChange={(e) => setClasification(e.target.value)}
        value={clasification}
        onBlur={(e) => onSetHandler(e, cla.index)}
      ></input>
      <button
        className="btn btn-error"
        onClick={() => onDeleteHandler(cla.index)}
      >
        Delete
      </button>
      <button
        className="btn btn-primary"
        onMouseDown={() => setIsRecording(true)}
        onMouseUp={() => setIsRecording(false)}
      >
        Press To Record
      </button>
      <p>{animationFrame.length}</p>
      <ul className="flex gap-2 flex-wrap">
        {animationFrame.map((shot, idx) => (
          <li key={idx}>
            <div className="w-8 h-8 bg-red-600"></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
