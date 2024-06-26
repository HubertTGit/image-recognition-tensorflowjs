import { ForwardedRef, forwardRef } from 'react';

interface CamProps {
  width: number;
  height: number;
}

const Cam = forwardRef<HTMLVideoElement, CamProps>(
  ({ width, height }: CamProps, ref: ForwardedRef<HTMLVideoElement>) => {
    return (
      <div className="relative">
        <div className="absolute left-[80px] w-[480px] h-[480px] border-2 border-red-500"></div>
        <video ref={ref} width={width} height={height}></video>
      </div>
    );
  }
);

export default Cam;
