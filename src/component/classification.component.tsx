import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import { IClassification } from '../interfaces/classification.model';
import { FRAME_RATE_MS } from '../constants/constants';
import { createCanvasContextFromVideo } from '../utils/utilities';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlayIcon, TrashIcon } from '@radix-ui/react-icons';
import { useAtom } from 'jotai';
import { classificationsState } from '@/states/classifications.state';

interface ClassificationProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  classificationIdx: number;
}

export const ClassificationCmp = ({
  videoRef,
  classificationIdx,
}: ClassificationProps): ReactNode => {
  const [isRecording, setIsRecording] = useState(false);
  const [classifications, setClassifications] =
    useAtom<IClassification[]>(classificationsState);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        if (videoRef.current) {
          const canvasUtil = createCanvasContextFromVideo(videoRef.current);
          const { canvas, ctx } = canvasUtil;

          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL();
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const idx = classificationIdx;

            setClassifications((state) => {
              const classifications = state.map((c, i) => {
                if (i === idx) {
                  return {
                    ...c,
                    framesUrlDatas: [...c.framesUrlDatas, dataUrl],
                    imageDatas: [...c.imageDatas, imageData],
                    indexes: [...c.indexes, idx],
                  };
                }
                return c;
              });
              return classifications;
            });
          }
        }
      }, FRAME_RATE_MS); // 5ms
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording, classificationIdx, setClassifications, videoRef]);

  const clearFramesHandler = () => {
    setClassifications((state) => {
      const classifications = state.map((c, i) => {
        if (i === classificationIdx) {
          return {
            ...c,
            framesUrlDatas: [],
            indexes: [],
            imageDatas: [],
          };
        }
        return c;
      });

      return classifications;
    });
  };

  const changeNameHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setClassifications((state) => {
      const classifications = state.map((c, i) => {
        if (i === classificationIdx) {
          return {
            ...c,
            clasificationName: e.target.value,
          };
        }
        return c;
      });

      return classifications;
    });
  };

  const deleteHandler = () => {
    console.log(classificationIdx, classifications);
    setClassifications((state) => {
      const classifications = state.filter((_, i) => i !== classificationIdx);
      return classifications;
    });
  };

  return (
    <Card className="p-2">
      <div className="flex justify-between gap-2">
        <Input
          type="text"
          placeholder="Enter a name"
          onChange={changeNameHandler}
          value={classifications[classificationIdx].clasificationName}
        ></Input>
        <Button variant="destructive" size="icon" onClick={deleteHandler}>
          <TrashIcon></TrashIcon>
        </Button>

        <Button
          className="indicator"
          disabled={!classifications[classificationIdx].clasificationName}
          variant="outline"
          onMouseDown={() => setIsRecording(true)}
          onMouseUp={() => setIsRecording(false)}
          onMouseLeave={() => setIsRecording(false)}
        >
          <span className="indicator-item badge badge-secondary">
            {classifications[classificationIdx].indexes.length}
          </span>
          Press To Record
          <PlayIcon></PlayIcon>
        </Button>
      </div>

      <div className="overflow-y-auto h-72 my-2">
        <ul className="flex gap-2 flex-wrap">
          {classifications[classificationIdx].framesUrlDatas.map(
            (shot, idx) => (
              <li key={idx}>
                <img
                  src={shot}
                  alt=""
                  width={50}
                  height={50}
                  className="rounded-md"
                />
              </li>
            )
          )}

          {!!classifications[classificationIdx].indexes.length && (
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
};
