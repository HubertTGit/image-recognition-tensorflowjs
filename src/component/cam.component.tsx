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
          className="rounded-lg w-[480px] sticky top-5"
        ></video>
      </>
    );
  }
);

export default Cam;
