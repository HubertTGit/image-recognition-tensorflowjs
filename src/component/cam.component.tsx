import { ForwardedRef, forwardRef } from 'react';

interface CamProps {
  width: number;
  height: number;
}

const Cam = forwardRef<HTMLVideoElement, CamProps>(
  ({ width, height }: CamProps, ref: ForwardedRef<HTMLVideoElement>) => {
    return (
      <>
        <video
          ref={ref}
          width={width}
          height={height}
          className="border-2 border-red-500"
        ></video>
      </>
    );
  }
);

export default Cam;
