import { useState, FocusEvent, useEffect } from 'react';

export interface IClassification {
  clasificationName: string;
  index: number;
  shots: string[];
}
interface ClassificationProps {
  onSetHandler: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onDeleteHandler: (idx: number) => void;
  onAddShotHandler: (idx: number, isPressed?: boolean) => void;
  cla: IClassification;
}

export function Classification({
  onSetHandler,
  onDeleteHandler,
  onAddShotHandler,
  cla,
}: ClassificationProps) {
  const [clasification, setClasification] = useState<string>('');

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
        onMouseDown={() => onAddShotHandler(cla.index, true)}
        onMouseUp={() => onAddShotHandler(cla.index, false)}
      >
        Press To Record
      </button>
      <ul className="flex gap-2">
        {cla.shots.map((shot, idx) => (
          <li key={idx}>
            <div className="w-8 h-8 bg-red-600"></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
